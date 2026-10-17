import { useSyncExternalStore } from "react";
import { callbackUrl, FLASH_COOKIE, NEXT_COOKIE, NEXT_COOKIE_MAX_AGE, nextFromLocation } from "@/lib/auth/next-path";
import type { StoredInputs } from "@/lib/calculator/stored-inputs";
import { isApartmentCount, type ApartmentCount } from "@/lib/first-run/apartment-count";
import { clearGuest } from "@/lib/guest/store";
import { loadBrowserSupabase, type BrowserSupabase } from "@/lib/supabase/browser";
import { hasAuthCookie, supabaseEnv } from "@/lib/supabase/env";
import { adoptGuestUnit, createUnit, deleteMyAccount, deleteUnit, saveApartmentCount, updateUnit, type AdoptionOutcome } from "./actions";
import { mapDbError, type AccountError, type ActionResult } from "./errors";
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
  | {
      status: "signed_in";
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

async function client(): Promise<BrowserSupabase | null> {
  const promise = loadBrowserSupabase();
  if (!promise) return null;
  const sb = await promise;
  if (!authSubscribed) {
    authSubscribed = true;
    // Another tab signing out (or a session that can no longer refresh) signs this page out too.
    sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        loadVersion++;
        authVersion++;
        if (state?.status !== "guest") emit({ status: "guest" });
      }
      // A different Google account can replace an existing session in this tab.
      if (event === "SIGNED_IN") {
        authVersion++;
        emit({ status: "loading" });
        void load();
      }
    });
  }
  return sb;
}

/** Reads the session, then the apartments, the profile answer and the limit, in parallel. */
export async function load(): Promise<void> {
  const version = ++loadVersion;
  // A fresh session read may belong to another account. Hide the old one now.
  emit({ status: "loading" });
  const sb = await client();
  if (version !== loadVersion) return;
  if (!sb) return emit({ status: "off" });
  const { data } = await sb.auth.getSession();
  if (version !== loadVersion) return;
  const session = data.session;
  if (!session) return emit({ status: "guest" });
  const [units, profile, entitlements] = await Promise.all([
    sb.from("units").select(UNIT_COLUMNS).order("created_at"),
    sb.from("profiles").select("apartment_count_answer").maybeSingle(),
    sb.from("org_entitlements").select("max_units").maybeSingle(),
  ]);
  if (version !== loadVersion) return;
  const answer = profile.data?.apartment_count_answer;
  emit({
    status: "signed_in",
    email: session.user.email ?? null,
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
async function freshSession(): Promise<void> {
  const sb = await client();
  await sb?.auth.getSession();
}

function writeIsCurrent(version: number): boolean {
  return version === authVersion && state?.status === "signed_in";
}

const staleWrite = () => ({ ok: false, error: "not_signed_in" } as const);

function setUnits(version: number, change: (units: AccountUnit[]) => AccountUnit[]) {
  const current = writeIsCurrent(version) ? signedIn() : null;
  if (current) emit({ ...current, units: change(current.units) });
}

/** An action failed because the session is gone: show the person as signed out. */
function afterError<T>(result: ActionResult<T>, version: number): ActionResult<T> {
  if (!result.ok && result.error === "not_signed_in" && writeIsCurrent(version)) {
    loadVersion++;
    authVersion++;
    emit({ status: "guest" });
  }
  return result;
}

export async function addUnit(name: string, inputs: StoredInputs): Promise<ActionResult<AccountUnit>> {
  const version = authVersion;
  await freshSession();
  if (!writeIsCurrent(version)) return staleWrite();
  const result = await createUnit({ name, inputs });
  if (!writeIsCurrent(version)) return staleWrite();
  if (!result.ok) return afterError(result, version);
  const unit = toAccountUnit(result.data);
  setUnits(version, (units) => [...units, unit]);
  return { ok: true, data: unit };
}

export async function renameUnit(id: string, name: string): Promise<ActionResult<AccountUnit>> {
  const version = authVersion;
  await freshSession();
  if (!writeIsCurrent(version)) return staleWrite();
  const result = await updateUnit({ id, name });
  if (!writeIsCurrent(version)) return staleWrite();
  if (!result.ok) return afterError(result, version);
  const unit = toAccountUnit(result.data);
  setUnits(version, (units) => units.map((u) => (u.id === id ? unit : u)));
  return { ok: true, data: unit };
}

export async function saveUnitInputs(id: string, inputs: StoredInputs): Promise<ActionResult<AccountUnit>> {
  const version = authVersion;
  await freshSession();
  if (!writeIsCurrent(version)) return staleWrite();
  const result = await updateUnit({ id, inputs });
  if (!writeIsCurrent(version)) return staleWrite();
  if (!result.ok) return afterError(result, version);
  const unit = toAccountUnit(result.data);
  setUnits(version, (units) => units.map((u) => (u.id === id ? unit : u)));
  return { ok: true, data: unit };
}

export async function removeUnit(id: string): Promise<ActionResult<{ id: string }>> {
  const version = authVersion;
  await freshSession();
  if (!writeIsCurrent(version)) return staleWrite();
  const result = await deleteUnit(id);
  if (!writeIsCurrent(version)) return staleWrite();
  if (!result.ok) return afterError(result, version);
  setUnits(version, (units) => units.filter((u) => u.id !== id));
  return result;
}

export async function adoptBrowserUnit(name: string, inputs: StoredInputs): Promise<ActionResult<AdoptionOutcome>> {
  const version = authVersion;
  await freshSession();
  if (!writeIsCurrent(version)) return staleWrite();
  const result = await adoptGuestUnit({ name, inputs, apartmentCount: null });
  if (!writeIsCurrent(version)) return staleWrite();
  if (!result.ok) return afterError(result, version);
  if (result.data.outcome === "added") {
    const unit = toAccountUnit(result.data.unit);
    setUnits(version, (units) => [...units, unit]);
  }
  return result;
}

/** The first-run answer. `onlyIfEmpty`: the copy made at sign-in never replaces an existing answer. */
export async function saveCount(answer: ApartmentCount, onlyIfEmpty = false): Promise<ActionResult<{ saved: boolean }>> {
  const version = authVersion;
  await freshSession();
  if (!writeIsCurrent(version)) return staleWrite();
  const result = await saveApartmentCount(answer, onlyIfEmpty);
  if (!writeIsCurrent(version)) return staleWrite();
  if (!result.ok) return afterError(result, version);
  const current = signedIn();
  if (current && (result.data.saved || !onlyIfEmpty)) emit({ ...current, apartmentCount: answer });
  return result;
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

/** Signs this device out (other devices stay signed in). */
export async function signOut(): Promise<void> {
  loadVersion++;
  const version = ++authVersion;
  emit({ status: "guest" });
  const sb = await client();
  if (version !== authVersion) return;
  await sb?.auth.signOut({ scope: "local" });
}

/** Deletes the account and everything in it, then forgets this browser's Backdesk data too. */
export async function deleteAccount(): Promise<ActionResult> {
  const version = authVersion;
  await freshSession();
  if (!writeIsCurrent(version)) return staleWrite();
  const result = await deleteMyAccount();
  if (!writeIsCurrent(version)) return staleWrite();
  if (!result.ok) return afterError(result, version);
  loadVersion++;
  const signedOutVersion = ++authVersion;
  emit({ status: "guest" });
  const sb = await client();
  if (signedOutVersion !== authVersion) return result;
  // The server already cleared the session cookies; this clears the client's memory of it.
  await sb?.auth.signOut({ scope: "local" });
  clearGuest();
  return result;
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
  state = next;
  authSubscribed = false;
  listeners.forEach((l) => l());
}
