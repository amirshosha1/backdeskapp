import Decimal from "decimal.js";
import { NO_COMMISSION, type CommissionBasis, type OperatingModel, type PercentBasis, type ScenarioInput } from "@/lib/finance";
import { scenarioInputSchema } from "@/lib/finance/schemas";
import { parseAmount, type ParseAmountOptions } from "@/lib/format/amount";

/**
 * The live calculator's form (BUILD_PLAN.md Phase 1): what the host typed,
 * as raw strings, turned into a validated `ScenarioInput` for the engine —
 * or a typed error per field. Every number goes through `parseAmount`, the
 * shared parser (Arabic-Indic digits, Arabic separators); cross-field rules
 * come from the engine's own Zod schema. No financial formula lives here:
 * the only arithmetic is turning a typed percentage into a rate.
 */

export const DAYS_IN_PERIOD = 30;

export type MoneyField =
  | "adr"
  | "cleaningFeePerStay"
  | "rent"
  | "deposit"
  | "utilities"
  | "internet"
  | "compoundFees"
  | "cleaningCost"
  | "consumables"
  | "repairs"
  | "setupCost"
  | "fixedFee";
export type CountField = "bookedNights" | "blockedNights" | "usefulLifeMonths";
export type PercentField = "platformFeePercent" | "commissionPercent";
export type NumberField = MoneyField | CountField | PercentField | "avgLengthOfStay";

export type ManagedBasis = Exclude<CommissionBasis, "none">;

export interface CalculatorForm {
  operatingModel: OperatingModel;
  values: Record<NumberField, string>;
  commission: {
    basis: ManagedBasis;
    hybridMode: "sum" | "max";
    hybridBasis: PercentBasis;
    includeCleaningFees: boolean;
  };
}

export type FieldError =
  | "empty"
  | "invalid"
  | "invalid_whole"
  | "negative"
  | "non_positive"
  | "percent_range"
  | "too_large"
  | "blocked_too_many"
  | "life_required";

export type FieldKind = "money" | "count" | "percent" | "stay";

export const FIELD_KIND: Record<NumberField, FieldKind> = {
  adr: "money",
  cleaningFeePerStay: "money",
  rent: "money",
  deposit: "money",
  utilities: "money",
  internet: "money",
  compoundFees: "money",
  cleaningCost: "money",
  consumables: "money",
  repairs: "money",
  setupCost: "money",
  fixedFee: "money",
  bookedNights: "count",
  blockedNights: "count",
  usefulLifeMonths: "count",
  platformFeePercent: "percent",
  commissionPercent: "percent",
  avgLengthOfStay: "stay",
};

const PARSE_OPTIONS: Record<FieldKind, ParseAmountOptions> = {
  money: { allowZero: true, maxDecimals: 2 },
  count: { allowZero: true, maxDecimals: 0 },
  percent: { allowZero: true, maxDecimals: 2 },
  stay: { allowZero: false, maxDecimals: 1 },
};

/** The largest amount `numeric(14,2)` can hold (CLAUDE.md §6.2). */
const MAX_MONEY = new Decimal("999999999999.99");
const MAX_COUNT = 999;

export const commissionUsesRate = (basis: ManagedBasis) => basis !== "fixed_monthly";
export const commissionUsesFixedFee = (basis: ManagedBasis) => basis === "fixed_monthly" || basis === "hybrid";
/** Whether "include cleaning fees" changes anything for these terms (not for NOI or a fixed fee). */
export function commissionUsesCleaningToggle(c: CalculatorForm["commission"]): boolean {
  if (c.basis === "hybrid") return c.hybridBasis !== "noi";
  return c.basis === "gross_revenue" || c.basis === "net_payout";
}

/** The number fields shown for the chosen operating model and commission terms. */
export function visibleFields(form: CalculatorForm): NumberField[] {
  const fields: NumberField[] = [];
  if (form.operatingModel === "rental_arbitrage") fields.push("rent", "deposit");
  if (form.operatingModel === "managed_for_owner") {
    if (commissionUsesRate(form.commission.basis)) fields.push("commissionPercent");
    if (commissionUsesFixedFee(form.commission.basis)) fields.push("fixedFee");
  }
  fields.push(
    "adr",
    "bookedNights",
    "blockedNights",
    "avgLengthOfStay",
    "cleaningFeePerStay",
    "platformFeePercent",
    "utilities",
    "internet",
    "compoundFees",
    "cleaningCost",
    "consumables",
    "repairs",
    "setupCost",
    "usefulLifeMonths",
  );
  return fields;
}

export function parseField(field: NumberField, raw: string): { ok: true; value: Decimal } | { ok: false; error: FieldError } {
  const kind = FIELD_KIND[field];
  const parsed = parseAmount(raw, PARSE_OPTIONS[kind]);
  if (!parsed.ok) return { ok: false, error: parsed.error === "invalid" && kind === "count" ? "invalid_whole" : parsed.error };
  if (kind === "money" && parsed.value.greaterThan(MAX_MONEY)) return { ok: false, error: "too_large" };
  if (kind === "count" && parsed.value.greaterThan(MAX_COUNT)) return { ok: false, error: "too_large" };
  if (kind === "percent" && parsed.value.greaterThan(100)) return { ok: false, error: "percent_range" };
  return { ok: true, value: parsed.value };
}

export type ParsedForm =
  | { ok: true; input: ScenarioInput }
  | { ok: false; errors: Partial<Record<NumberField, FieldError>> };

/** Schema issues on the assembled input, mapped back to the field that caused them. */
const SCHEMA_PATH_TO_FIELD: Record<string, { field: NumberField; error: FieldError }> = {
  blockedNights: { field: "blockedNights", error: "blocked_too_many" },
  usefulLifeMonths: { field: "usefulLifeMonths", error: "life_required" },
};

export function parseCalculatorForm(form: CalculatorForm): ParsedForm {
  const errors: Partial<Record<NumberField, FieldError>> = {};
  const value = {} as Record<NumberField, Decimal>;
  for (const field of visibleFields(form)) {
    const parsed = parseField(field, form.values[field]);
    if (parsed.ok) value[field] = parsed.value;
    else errors[field] = parsed.error;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const isArbitrage = form.operatingModel === "rental_arbitrage";
  const isManaged = form.operatingModel === "managed_for_owner";
  const c = form.commission;
  const input: ScenarioInput = {
    operatingModel: form.operatingModel,
    daysInPeriod: DAYS_IN_PERIOD,
    blockedNights: value.blockedNights.toNumber(),
    bookedNights: value.bookedNights,
    adr: value.adr,
    avgLengthOfStay: value.avgLengthOfStay,
    cleaningFeePerStay: value.cleaningFeePerStay,
    platformFeeRate: value.platformFeePercent.dividedBy(100),
    rent: isArbitrage ? value.rent : 0,
    deposit: isArbitrage ? value.deposit : 0,
    fixedCosts: [
      { id: "utilities", amount: value.utilities },
      { id: "internet", amount: value.internet },
      { id: "compound", amount: value.compoundFees },
    ],
    perStayCosts: [
      { id: "cleaning", amount: value.cleaningCost },
      { id: "consumables", amount: value.consumables },
    ],
    perNightCosts: [],
    irregularCosts: [{ id: "repairs", amount: value.repairs }],
    setupCost: value.setupCost,
    usefulLifeMonths: value.usefulLifeMonths.toNumber(),
    commission: isManaged
      ? {
          basis: c.basis,
          rate: commissionUsesRate(c.basis) ? value.commissionPercent.dividedBy(100) : 0,
          fixedFee: commissionUsesFixedFee(c.basis) ? value.fixedFee : 0,
          hybridMode: c.hybridMode,
          hybridBasis: c.hybridBasis,
          includeCleaningFees: c.includeCleaningFees,
        }
      : NO_COMMISSION,
  };

  // The engine's boundary schema has the last word (cross-field rules).
  const checked = scenarioInputSchema.safeParse(input);
  if (checked.success) return { ok: true, input };
  for (const issue of checked.error.issues) {
    const mapped = SCHEMA_PATH_TO_FIELD[String(issue.path[0])];
    if (mapped) errors[mapped.field] = mapped.error;
  }
  // Anything the schema rejects that no field explains is a bug in this form, not user input.
  if (Object.keys(errors).length === 0) {
    throw new Error(`Calculator form produced an invalid scenario: ${checked.error.issues.map((i) => i.message).join("; ")}`);
  }
  return { ok: false, errors };
}

/** Whether the form still holds exactly a preset's values (its chip shows as selected). */
export function sameForm(a: CalculatorForm, b: CalculatorForm): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
