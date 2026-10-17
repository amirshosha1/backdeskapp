import { useSyncExternalStore } from "react";
import { callbackUrl, FLASH_COOKIE, NEXT_COOKIE, NEXT_COOKIE_MAX_AGE, nextFromLocation } from "@/lib/auth/next-path";
import type { StoredInputs } from "@/lib/calculator/stored-inputs";
import { isApartmentCount, type ApartmentCount } from "@/lib/first-run/apartment-count";
import { clearGuest } from "@/lib/guest/store";
import { loadBrowserSupabase, type BrowserSupabase } from "@/lib/supabase/browser";
import { hasAuthCookie, supabaseEnv } from "@/lib/supabase/env";
import { adoptGuestUnit, createUnit, deleteMyAccount, deleteUnit, saveApartmentCount, updateUnit, type AdoptionOutcome } from "./actions";
import { mapAuthError, mapDbError, type AccountError, type ActionResult } from "./errors";
import { toAccountUnit, UNIT_COLUMNS, type AccountUnit } from "./units";

/**
 * The signed-in person's account, in this page's memory only (never in
 * browser storage, so nothing of an account stays on a shared phone after
 * sign-out). Reads go straight from the browser with the publishable key
 * and the session (Row Level Security applies); writes go through the
 * server actions and update this copy with what the database returned.
 *
 * A visitor without a session cookie never loads the Supabase client: the
 * state is "guest" at once and nothing is requested.
 */

export type AccountState =
  /** Accounts are not configured (no Supabase values): the app is visitor-only. */
  | { status: "off" }
  | { status: "guest" }
  | { status: "loading" }
  /** Sign-out was not confirmed. No account data is exposed; the person can retry. */
  | { status: "sign_out_error"; userId: string }
  | {
      status: "signed_in";
      userId: string;
      email: string | null;
      units: AccountUnit[];
      /** org_entitlements.max_units (not shown since the 2026-10-09 hotfix); null if it could not be read. */
      maxUnits: number | null;
      apartmentCount: ApartmentCount | null;
      /** The apartments could not be loaded (the screen offers a retry). */
      loadError: AccountError | null;
    };

const listeners = new Set<() => void>();
let state: AccountState | null = null;
let authSubscribed = false;
let loadVersion = 0;
let authVersion = 0;
let expectedUserId: string | null = null;
let expectNoSession = false;
let pendingSignOutId: string | null = null;

function emit(next: AccountState) {
  state = next;
  listeners.forEach((l) => l());
}

function initialState(): AccountState {
  const env = supabaseEnv();
  if (!env) return { status: "off" };
  let cookie = "";
  try {
    cookie = document.cookie;
  } catch {
    // Cookies blocked: no session can exist.
  }
  if (!hasAuthCookie(cookie, env.authCookie)) return { status: "guest" };
  void load();
  return { status: "loading" };
}

function getSnapshot(): AccountState {
  state ??= initialState();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The account state, or null during the static render and hydration. */
export function useAccount(): AccountState | null {
  return useSyncExternalStore<AccountState | null>(subscribe, getSnapshot, () => null);
}

export function readAccount(): AccountState {
  return getSnapshot();
}

function signedIn(): Extract<AccountState, { status: "signed_in" }> | null {
  return state?.status === "signed_in" ? state : null;
}

function hideAccount(nextUserId: string | null, requireNoSession = false): void {
  loadVersion++;
  authVersion++;
  expectedUserId = nextUserId;
  expectNoSession = requireNoSession;
  emit({ status: "loading" });
}

/** An event may be missing or out of order; compare with the current session before writes. */
async function verifyCurrentSession(userId: string, version: number): Promise<void> {
  try {
    const sb = await client();
    const { data, error } = sb ? await sb.auth.getSession() : { data: { session: null }, error: null };
    if (version !== authVersion || state?.status !== "signed_in" || state.userId !== userId) return;
    // A transient refresh error is not proof that A changed. Writes still
    // verify the session before dispatch, so keep the form mounted here.
    if (error) return;
    if (!data.session?.user.id) {
      hideAccount(null, true);
      void load();
    } else if (data.session.user.id !== userId) {
      hideAccount(data.session.user.id);
      void load();
    }
  } catch {
    // Refocus verification failed; an attempted write will fail closed.
  }
}

async function verifyFailedSignOut(userId: string): Promise<void> {
  try {
    const sb = await client();
    const { data, error } = sb ? await sb.auth.getSession() : { data: { session: null }, error: null };
    if (state?.status !== "sign_out_error" || state.userId !== userId || error) return;
    const currentId = data.session?.user.id;
    if (!currentId) {
      authVersion++;
      expectedUserId = null;
      emit({ status: "guest" });
    } else if (currentId !== userId) {
      hideAccount(currentId);
      void load();
    }
  } catch {
    // The earlier sign-out remains unverified; keep account data hidden.
  }
}

async function client(): Promise<BrowserSupabase | null> {
  const promise = loadBrowserSupabase();
  if (!promise) return null;
  const sb = await promise;
  if (!authSubscribed) {
    authSubscribed = true;
    // Another tab signing out (or a session that can no longer refresh) signs this page out too.
    sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (pendingSignOutId) return;
        if (state?.status === "sign_out_error") {
          void verifyFailedSignOut(state.userId);
          return;
        }
        hideAccount(null, true);
        void load();
      }
      if (event === "SIGNED_IN") {
        const userId = session?.user.id;
        if (userId && userId === pendingSignOutId) return;
        if (userId && state?.status === "sign_out_error" && state.userId === userId) {
          void verifyFailedSignOut(userId);
          return;
        }
        if (userId && state?.status === "signed_in" && state.userId === userId) {
          void verifyCurrentSession(userId, authVersion);
          return;
        }
        pendingSignOutId = null;
        hideAccount(userId ?? null);
        void load();
      }
    });
  }
  return sb;
}

/** Reads the session, then the apartments, the profile answer and the limit, in parallel. */
export async function load(): Promise<void> {
  if (state?.status === "sign_out_error") return;
  let version = ++loadVersion;
  // A retry for the same user keeps forms mounted until identity is checked.
  if (state?.status !== "signed_in") emit({ status: "loading" });
  const sb = await client();
  if (version !== loadVersion) return;
  if (!sb) return emit({ status: "off" });
  const { data, error } = await sb.auth.getSession();
  if (version !== loadVersion) return;
  const session = data.session;
  const userId = !error ? session?.user.id : undefined;
  if (!userId) {
    authVersion++;
    expectedUserId = null;
    if (!error) expectNoSession = false;
    return emit({ status: error ? "loading" : "guest" });
  }
  if (expectNoSession) return emit({ status: "loading" });
  if (state?.status === "signed_in" && state.userId !== userId) {
    hideAccount(userId);
    version = loadVersion;
  } else if (expectedUserId && userId !== expectedUserId) {
    // A stale session read must not revive A after a B event. Wait for a
    // matching event/session; the screen stays hidden in the meantime.
    return emit({ status: "loading" });
  }
  expectedUserId = userId;
  const [units, profile, entitlements] = await Promise.all([
    sb.from("units").select(UNIT_COLUMNS).order("created_at"),
    sb.from("profiles").select("apartment_count_answer").maybeSingle(),
    sb.from("org_entitlements").select("max_units").maybeSingle(),
  ]);
  if (version !== loadVersion) return;
  if (expectedUserId !== userId) return;
  // The browser session can change without an auth event while these requests
  // are in flight. Never publish their rows under the initiating identity.
  let currentUserId: string | undefined;
  try {
    const current = await sb.auth.getSession();
    if (version !== loadVersion) return;
    if (current.error) {
      hideAccount(userId);
      return;
    }
    currentUserId = current.data.session?.user.id;
  } catch {
    if (version === loadVersion) hideAccount(userId);
    return;
  }
  if (currentUserId !== userId) {
    hideAccount(currentUserId ?? null, !currentUserId);
    void load();
    return;
  }
  const answer = profile.data?.apartment_count_answer;
  emit({
    status: "signed_in",
    userId,
    email: session!.user.email ?? null,
    units: (units.data ?? []).map(toAccountUnit),
    maxUnits: entitlements.data?.max_units ?? null,
    apartmentCount: isApartmentCount(answer) ? answer : null,
    loadError: units.error ? mapDbError(units.error, units.status) : null,
  });
}

/**
 * Before a server action: let the browser refresh an expired session first
 * (it writes the new cookies), so the server never races it with the same
 * refresh token after a long time away.
 */
type AuthToken = { userId: string; version: number };

function writeToken(): AuthToken | null {
  const current = signedIn();
  return current ? { userId: current.userId, version: authVersion } : null;
}

function writeIsCurrent(token: AuthToken): boolean {
  return token.version === authVersion && state?.status === "signed_in" && state.userId === token.userId;
}

const superseded = () => ({ ok: false, error: "superseded" } as const);

async function freshSession(token: AuthToken): Promise<ActionResult> {
  try {
    const sb = await client();
    if (!sb) return { ok: false, error: "not_configured" };
    const { data, error } = await sb.auth.getSession();
    if (!writeIsCurrent(token)) return superseded();
    const userId = data.session?.user.id;
    if (error || !userId) {
      hideAccount(null, true);
      void load();
      return { ok: false, error: error ? mapAuthError(error) : "not_signed_in" };
    }
    if (userId !== token.userId) {
      hideAccount(userId);
      void load();
      return superseded();
    }
    return { ok: true, data: undefined };
  } catch {
    if (writeIsCurrent(token)) {
      hideAccount(null, true);
      void load();
    }
    return { ok: false, error: "network" };
  }
}

function setUnits(token: AuthToken, change: (units: AccountUnit[]) => AccountUnit[]) {
  const current = writeIsCurrent(token) ? signedIn() : null;
  if (current) emit({ ...current, units: change(current.units) });
}

/** An action failed because the session is gone: show the person as signed out. */
function afterError<T>(result: ActionResult<T>, token: AuthToken): ActionResult<T> {
  if (!result.ok && result.error === "identity_changed" && writeIsCurrent(token)) {
    // The server saw another identity even though the browser preflight saw A.
    // Do not republish A from a possibly stale browser session without a new
    // matching auth event.
    hideAccount(null, true);
    void load();
  }
  if (!result.ok && result.error === "not_signed_in" && writeIsCurrent(token)) {
    loadVersion++;
    authVersion++;
    expectedUserId = null;
    emit({ status: "guest" });
  }
  return result;
}

async function guardedWrite<T, U>(
  run: (userId: string) => Promise<ActionResult<T>>,
  apply: (data: T, token: AuthToken) => U,
): Promise<ActionResult<U>> {
  const token = writeToken();
  if (!token) return { ok: false, error: "not_signed_in" };
  const checked = await freshSession(token);
  if (!checked.ok) return checked;
  if (!writeIsCurrent(token)) return superseded();
  const result = await run(token.userId);
  if (!writeIsCurrent(token)) return superseded();
  if (!result.ok) return afterError(result, token);
  return { ok: true, data: apply(result.data, token) };
}

export function addUnit(name: string, inputs: StoredInputs): Promise<ActionResult<AccountUnit>> {
  return guardedWrite((userId) => createUnit({ name, inputs }, userId), (data, token) => {
    const unit = toAccountUnit(data);
    setUnits(token, (units) => [...units, unit]);
    return unit;
  });
}

export function renameUnit(id: string, name: string): Promise<ActionResult<AccountUnit>> {
  return guardedWrite((userId) => updateUnit({ id, name }, userId), (data, token) => {
    const unit = toAccountUnit(data);
    setUnits(token, (units) => units.map((u) => (u.id === id ? unit : u)));
    return unit;
  });
}

export function saveUnitInputs(id: string, inputs: StoredInputs): Promise<ActionResult<AccountUnit>> {
  return guardedWrite((userId) => updateUnit({ id, inputs }, userId), (data, token) => {
    const unit = toAccountUnit(data);
    setUnits(token, (units) => units.map((u) => (u.id === id ? unit : u)));
    return unit;
  });
}

export function removeUnit(id: string): Promise<ActionResult<{ id: string }>> {
  return guardedWrite((userId) => deleteUnit(id, userId), (data, token) => {
    setUnits(token, (units) => units.filter((u) => u.id !== id));
    return data;
  });
}

export function adoptBrowserUnit(name: string, inputs: StoredInputs): Promise<ActionResult<AdoptionOutcome>> {
  return guardedWrite((userId) => adoptGuestUnit({ name, inputs, apartmentCount: null }, userId), (data, token) => {
    if (data.outcome === "added") {
      const unit = toAccountUnit(data.unit);
      setUnits(token, (units) => [...units, unit]);
    }
    return data;
  });
}

/** The first-run answer. `onlyIfEmpty`: the copy made at sign-in never replaces an existing answer. */
export function saveCount(answer: ApartmentCount, onlyIfEmpty = false): Promise<ActionResult<{ saved: boolean }>> {
  return guardedWrite((userId) => saveApartmentCount(answer, onlyIfEmpty, userId), (data, token) => {
    const current = writeIsCurrent(token) ? signedIn() : null;
    if (current && (data.saved || !onlyIfEmpty)) emit({ ...current, apartmentCount: answer });
    return data;
  });
}

/**
 * Google sign-in. The page to come back to goes in a first-party cookie;
 * Supabase is sent to exactly /auth/callback (src/lib/auth/next-path.ts).
 * On success the browser leaves for Google; the result only comes back on
 * failure.
 */
export async function signInWithGoogle(pathname: string): Promise<ActionResult> {
  const sb = await client();
  if (!sb) return { ok: false, error: "not_configured" };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(nextFromLocation(pathname))}; Path=/; Max-Age=${NEXT_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(window.location.origin), queryParams: { prompt: "select_account" } },
  });
  return error ? { ok: false, error: "network" } : { ok: true, data: undefined };
}

/** Signs this device out. A failed or unverified attempt hides data and offers retry. */
export async function signOut(): Promise<ActionResult> {
  const userId = state?.status === "signed_in" || state?.status === "sign_out_error" ? state.userId : null;
  if (!userId) return { ok: false, error: "not_signed_in" };
  hideAccount(userId);
  pendingSignOutId = userId;
  const version = authVersion;
  const stillCurrent = () => version === authVersion && pendingSignOutId === userId;
  const done = (): ActionResult => {
    pendingSignOutId = null;
    expectedUserId = null;
    emit({ status: "guest" });
    return { ok: true, data: undefined };
  };
  const changed = (nextUserId: string): ActionResult => {
    pendingSignOutId = null;
    hideAccount(nextUserId);
    void load();
    return superseded();
  };
  let sb: BrowserSupabase | null = null;
  try {
    sb = await client();
    if (!stillCurrent()) return superseded();
    if (!sb) throw new Error("Account client unavailable");
    const before = await sb.auth.getSession();
    if (!stillCurrent()) return superseded();
    if (before.error) throw before.error;
    const currentId = before.data.session?.user.id;
    if (!currentId) return done();
    if (currentId !== userId) return changed(currentId);
    const signedOut = await sb.auth.signOut({ scope: "local" });
    if (!stillCurrent()) return superseded();
    if (signedOut.error) throw signedOut.error;
    const after = await sb.auth.getSession();
    if (!stillCurrent()) return superseded();
    if (after.error) throw after.error;
    const afterId = after.data.session?.user.id;
    if (!afterId) return done();
    if (afterId !== userId) return changed(afterId);
  } catch {
    if (!stillCurrent()) return superseded();
    // A thrown SDK call may have removed the session; verify before reporting failure.
    try {
      const after = sb ? await sb.auth.getSession() : null;
      if (!stillCurrent()) return superseded();
      if (after && !after.error) {
        const afterId = after.data.session?.user.id;
        if (!afterId) return done();
        if (afterId !== userId) return changed(afterId);
      }
    } catch {
      // The session cannot be verified. Keep account data hidden.
    }
  }
  pendingSignOutId = null;
  emit({ status: "sign_out_error", userId });
  return { ok: false, error: "network" };
}

/** Deletes the account and everything in it, then forgets this browser's Backdesk data too. */
export async function deleteAccount(): Promise<ActionResult> {
  const token = writeToken();
  if (!token) return { ok: false, error: "not_signed_in" };
  const checked = await freshSession(token);
  if (!checked.ok) return checked;
  if (!writeIsCurrent(token)) return superseded();
  const result = await deleteMyAccount(token.userId);
  if (!result.ok) return writeIsCurrent(token) ? afterError(result, token) : superseded();
  // This browser's guest data belongs to the deleted account even if an auth event arrived meanwhile.
  clearGuest();
  if (!writeIsCurrent(token)) return superseded();
  const signedOut = await signOut();
  return signedOut.ok ? result : signedOut;
}

/** The one-shot notice the sign-in callback may leave ("signin_failed"); reading it removes it. */
export function takeFlash(): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${FLASH_COOKIE}=([^;]*)`));
    if (!match) return null;
    document.cookie = `${FLASH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return decodeURIComponent(match[1]!);
  } catch {
    return null;
  }
}

/** Tests only: forget the module's state between tests. */
export function resetAccountForTests(next: AccountState | null = null): void {
  loadVersion++;
  authVersion++;
  expectedUserId = next?.status === "signed_in" ? next.userId : null;
  expectNoSession = false;
  pendingSignOutId = null;
  state = next;
  authSubscribed = false;
  listeners.forEach((l) => l());
}
