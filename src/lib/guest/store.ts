import { useSyncExternalStore } from "react";
import { visibleFields, type CalculatorForm } from "@/lib/calculator/form";
import { parseAssumed, parseStoredForm, type AssumedField } from "@/lib/calculator/stored-inputs";
import { ENGINE_VERSION } from "@/lib/finance";
import { APARTMENT_COUNTS, isApartmentCount, type ApartmentCount } from "@/lib/first-run/apartment-count";
import { GUEST_KEY, GUEST_VERSION } from "./keys";

/**
 * The visitor's data, kept in this browser only (P.2: no account, nothing
 * sent to a server). One versioned localStorage key holds it all, so P.2's
 * sign-up migration has a single thing to read. Every access is wrapped in
 * try/catch: private browsing or blocked storage simply means nothing is
 * remembered, never a crash.
 *
 * What is stored is *inputs* — the calculator form, which inputs are still
 * assumed (تجريبي), and the engine version — never computed results and
 * never the locale (the locale comes from the URL only, CLAUDE.md §7).
 * No Zod here (it would ship ~97 KB to the browser, PROGRESS.md Phase 1):
 * a stored form is checked by hand (src/lib/calculator/stored-inputs.ts,
 * shared with the account's apartments) and must pass `parseCalculatorForm`.
 *
 * A signed-in person's apartments live in their account, never here; this
 * browser copy is moved into the account at sign-in
 * (src/lib/account/adoption.ts) and then cleared.
 */

export { GUEST_KEY, GUEST_VERSION } from "./keys";

export { APARTMENT_COUNTS, type ApartmentCount };
export type { AssumedField };

export interface OwnUnit {
  id: "own-1";
  engineVersion: string;
  form: CalculatorForm;
  /** Inputs still holding the example's value; each carries the تجريبي tag until the visitor commits it. */
  assumed: AssumedField[];
}

export interface GuestState {
  v: typeof GUEST_VERSION;
  firstRun: { seen: boolean; count: ApartmentCount | null };
  units: OwnUnit[];
}

export const EMPTY_GUEST: GuestState = { v: GUEST_VERSION, firstRun: { seen: false, count: null }, units: [] };

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

function parseUnit(x: unknown): OwnUnit | null {
  if (!isRecord(x) || x.id !== "own-1" || typeof x.engineVersion !== "string" || !Array.isArray(x.assumed)) return null;
  const form = parseStoredForm(x.form);
  if (!form) return null;
  return { id: "own-1", engineVersion: x.engineVersion, form, assumed: parseAssumed(x.assumed) };
}

/** Reads a stored payload; anything unreadable gives the empty state (keeping the seen flag when it can). */
export function parseGuest(raw: string | null): GuestState {
  if (!raw) return EMPTY_GUEST;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_GUEST;
  }
  if (!isRecord(data) || data.v !== GUEST_VERSION) return EMPTY_GUEST;
  const firstRun = isRecord(data.firstRun) ? data.firstRun : {};
  const units = Array.isArray(data.units) ? data.units.map(parseUnit).filter((u): u is OwnUnit => u !== null).slice(0, 1) : [];
  return {
    v: GUEST_VERSION,
    firstRun: { seen: firstRun.seen === true, count: isApartmentCount(firstRun.count) ? firstRun.count : null },
    units,
  };
}

// ---------------------------------------------------------------- store

const listeners = new Set<() => void>();
let cache: { raw: string | null; state: GuestState } | null = null;
/** Where the state lives when localStorage is blocked: this page view only. */
let memoryRaw: string | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(GUEST_KEY);
  } catch {
    return memoryRaw;
  }
}

export function readGuest(): GuestState {
  const raw = readRaw();
  if (cache && cache.raw === raw) return cache.state;
  cache = { raw, state: parseGuest(raw) };
  return cache.state;
}

export function writeGuest(next: GuestState): void {
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(GUEST_KEY, raw);
  } catch {
    // Storage blocked: keep the value for this page view only.
    memoryRaw = raw;
  }
  listeners.forEach((listener) => listener());
}

export function updateGuest(change: (state: GuestState) => GuestState): void {
  writeGuest(change(readGuest()));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === GUEST_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The visitor's state, or null until it has been read. Every /demo page is
 * static, so the server (and the hydration pass) cannot know it: callers
 * render a neutral placeholder for null instead of guessing.
 */
export function useGuest(): GuestState | null {
  return useSyncExternalStore<GuestState | null>(subscribe, readGuest, () => null);
}

// ---------------------------------------------------------------- helpers

export function ownUnit(state: GuestState | null): OwnUnit | null {
  return state?.units[0] ?? null;
}

/** Saves (or replaces) the visitor's first unit. */
export function saveOwnUnit(form: CalculatorForm, assumed: AssumedField[]): void {
  updateGuest((s) => ({ ...s, units: [{ id: "own-1", engineVersion: ENGINE_VERSION, form, assumed }] }));
}

export function setFirstRunSeen(): void {
  updateGuest((s) => ({ ...s, firstRun: { ...s.firstRun, seen: true } }));
}

export function setApartmentCount(count: ApartmentCount): void {
  updateGuest((s) => ({ ...s, firstRun: { ...s.firstRun, count } }));
}

/** Removes the browser's apartment (it moved into the account, or the person deleted it from this device). */
export function clearOwnUnit(): void {
  updateGuest((s) => ({ ...s, units: [] }));
}

/** Forgets everything this browser holds for Backdesk (after the account is deleted). */
export function clearGuest(): void {
  try {
    window.localStorage.removeItem(GUEST_KEY);
  } catch {
    // Storage blocked: nothing was kept beyond this page view.
  }
  memoryRaw = null;
  listeners.forEach((listener) => listener());
}

/**
 * Whether the app entry should open the first-run flow: not seen yet (never
 * skipped or finished) and no unit saved. Never when storage is blocked —
 * nothing could be remembered, so the flow would come back on every visit.
 */
export function needsFirstRun(state: GuestState): boolean {
  if (state.firstRun.seen || state.units.length > 0) return false;
  try {
    window.localStorage.getItem(GUEST_KEY);
    return true;
  } catch {
    return false;
  }
}

/** The assumed inputs the visitor can actually see and edit for this form: only these count toward the تجريبي tag. */
export function visibleAssumed(form: CalculatorForm, assumed: readonly AssumedField[]): AssumedField[] {
  const visible = new Set<AssumedField>(visibleFields(form));
  if (form.operatingModel === "managed_for_owner") visible.add("commissionBasis");
  return assumed.filter((f) => visible.has(f));
}
