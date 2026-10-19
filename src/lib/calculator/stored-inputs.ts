import { FIELD_KIND, parseCalculatorForm, type CalculatorForm, type ManagedBasis, type NumberField } from "./form";
import type { OperatingModel, PercentBasis } from "@/lib/finance";

/**
 * The calculator's saved inputs — what a unit keeps, in the browser
 * (src/lib/guest/store.ts) or in the account (`units.calculator_inputs`):
 * `{ form, assumed }`, inputs only, never results.
 *
 * This reader checks a stored value by hand, without Zod: it runs in the
 * browser, where Zod would add ~97 KB (PROGRESS.md, Phase 1). Writes to the
 * account are checked again on the server with Zod
 * (src/lib/account/schemas.ts). Only a form the engine accepts is ever
 * returned; anything else reads as null.
 */

/** An input that can still hold an assumed (example) value: a number field, or the commission basis. */
export type AssumedField = NumberField | "commissionBasis";

export interface StoredInputs {
  form: CalculatorForm;
  /** Inputs still holding the example's value; each carries the تجريبي tag until the visitor commits it. */
  assumed: AssumedField[];
}

export const NUMBER_FIELDS = Object.keys(FIELD_KIND) as NumberField[];
export const ASSUMED_FIELDS: AssumedField[] = [...NUMBER_FIELDS, "commissionBasis"];
export const OPERATING_MODELS: OperatingModel[] = ["owner_operated", "rental_arbitrage", "managed_for_owner"];
export const MANAGED_BASES: ManagedBasis[] = ["gross_revenue", "net_payout", "noi", "fixed_monthly", "hybrid"];
export const PERCENT_BASES: PercentBasis[] = ["gross_revenue", "net_payout", "noi"];

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
export const oneOf = <T extends string>(list: readonly T[], x: unknown): x is T =>
  typeof x === "string" && (list as readonly string[]).includes(x);

export function parseStoredForm(x: unknown): CalculatorForm | null {
  if (!isRecord(x) || !oneOf(OPERATING_MODELS, x.operatingModel) || !isRecord(x.values) || !isRecord(x.commission)) return null;
  const values = x.values;
  // Existing guest and account forms predate the laundry input. Zero preserves
  // their exact old result; a new baseline preset can supply its real cost.
  if (!NUMBER_FIELDS.every((f) => typeof values[f] === "string" || (f === "laundryCost" && values[f] === undefined))) return null;
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
    values: Object.fromEntries(NUMBER_FIELDS.map((f) => [f, f === "laundryCost" && values[f] === undefined ? "0" : values[f] as string])) as CalculatorForm["values"],
    commission: { basis: c.basis, hybridMode: c.hybridMode, hybridBasis: c.hybridBasis, includeCleaningFees: c.includeCleaningFees },
  };
  // Only a form the engine accepts is ever used: an older or edited payload falls back to nothing.
  return parseCalculatorForm(form).ok ? form : null;
}

/** Known assumed fields only, each once. */
export function parseAssumed(x: unknown): AssumedField[] {
  if (!Array.isArray(x)) return [];
  return [...new Set(x.filter((f): f is AssumedField => oneOf(ASSUMED_FIELDS, f)))];
}

/** `units.calculator_inputs` (or the browser's copy) → inputs the calculator can open, or null. */
export function parseStoredInputs(x: unknown): StoredInputs | null {
  if (!isRecord(x)) return null;
  const form = parseStoredForm(x.form);
  if (!form) return null;
  return { form, assumed: parseAssumed(x.assumed) };
}
