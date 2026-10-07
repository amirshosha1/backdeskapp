import { useSyncExternalStore } from "react";
import {
  FIELD_KIND,
  parseCalculatorForm,
  visibleFields,
  type CalculatorForm,
  type ManagedBasis,
  type NumberField,
} from "@/lib/calculator/form";
import { ENGINE_VERSION, type OperatingModel, type PercentBasis } from "@/lib/finance";
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
 * a stored form is checked by hand and then must pass `parseCalculatorForm`.
 */

export { GUEST_KEY, GUEST_VERSION } from "./keys";

export const APARTMENT_COUNTS = ["1", "2-3", "4-10", "10+"] as const;
export type ApartmentCount = (typeof APARTMENT_COUNTS)[number];

/** An input that can still hold an assumed (example) value: a number field, or the commission basis. */
export type AssumedField = NumberField | "commissionBasis";

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

const NUMBER_FIELDS = Object.keys(FIELD_KIND) as NumberField[];
const MODELS: OperatingModel[] = ["owner_operated", "rental_arbitrage", "managed_for_owner"];
const MANAGED_BASES: ManagedBasis[] = ["gross_revenue", "net_payout", "noi", "fixed_monthly", "hybrid"];
const PERCENT_BASES: PercentBasis[] = ["gross_revenue", "net_payout", "noi"];

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const oneOf = <T extends string>(list: readonly T[], x: unknown): x is T => typeof x === "string" && (list as readonly string[]).includes(x);

function parseForm(x: unknown): CalculatorForm | null {
  if (!isRecord(x) || !oneOf(MODELS, x.operatingModel) || !isRecord(x.values) || !isRecord(x.commission)) return null;
  const values = x.values;
  if (!NUMBER_FIELDS.every((f) => typeof values[f] === "string")) return null;
  const c = x.commission;
  if (
    !oneOf(MANAGED_BASES, c.basis) ||
    !oneOf(["sum", "max"] as const, c.hybridMode) ||
    !oneOf(PERCENT_BASES, c.hybridBasis) ||
    typeof c.includeCleaningFees !== "boolean"
  ) {
    return null;
  }
  const form: CalculatorForm = {
    operatingModel: x.operatingModel,
    values: Object.fromEntries(NUMBER_FIELDS.map((f) => [f, values[f] as string])) as CalculatorForm["values"],
    commission: { basis: c.basis, hybridMode: c.hybridMode, hybridBasis: c.hybridBasis, includeCleaningFees: c.includeCleaningFees },
  };
  // Only a form the engine accepts is ever used: an older or edited payload falls back to nothing.
  return parseCalculatorForm(form).ok ? form : null;
}

function parseUnit(x: unknown): OwnUnit | null {
  if (!isRecord(x) || x.id !== "own-1" || typeof x.engineVersion !== "string" || !Array.isArray(x.assumed)) return null;
  const form = parseForm(x.form);
  if (!form) return null;
  const assumed = x.assumed.filter((f): f is AssumedField => f === "commissionBasis" || oneOf(NUMBER_FIELDS, f));
  return { id: "own-1", engineVersion: x.engineVersion, form, assumed: [...new Set(assumed)] };
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
    firstRun: { seen: firstRun.seen === true, count: oneOf(APARTMENT_COUNTS, firstRun.count) ? firstRun.count : null },
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
