import Decimal from "decimal.js";
import { z } from "zod";
import type { BreakEvenResult } from "./breakeven";
import type { CommissionTerms } from "./commission";
import type { ForeignAmount } from "./fx";
import type { CapexAsset } from "./investment";
import type { FinanceWarning, Kpis } from "./kpis";
import type { ModelPnl, PerNightModel, ProfitBasis } from "./model";
import type { CurrencyTotal } from "./org-profit";
import { daysInMonth, nightsBetween, type StayMonthAllocation } from "./period";
import type { ExpenseLine, UnitMonthInput, UnitMonthPnl, UnitStay } from "./pnl";
import { err, ok, type Result } from "./result";
import type { ScenarioInput, ScenarioResult } from "./scenario";
import type { OwnerStatement, StatementInput, StatementStay } from "./statement";
import type { SensitivityGrid } from "./sensitivity";
import type { Verdict } from "./verdict";

/**
 * Zod schemas for every engine input and output (BUILD_PLAN.md Phase 1;
 * CLAUDE.md §6.6: validate at every server boundary). Inputs accept
 * decimal strings or numbers and produce `Decimal`s; outputs are checked
 * against the engine's own types at compile time (`z.ZodType<T>`).
 *
 * Bounds follow the database (CLAUDE.md §6.2): amounts fit `numeric(14,2)`,
 * rates `numeric(7,4)`, FX rates `numeric(18,8)`.
 */

const MAX_AMOUNT = new Decimal("999999999999.99");

export const decimalSchema = z.union([z.string(), z.number(), z.instanceof(Decimal)]).transform((value, ctx) => {
  try {
    const d = new Decimal(typeof value === "string" ? value.trim() : value);
    if (d.isFinite()) return d;
  } catch {
    // fall through to the issue below
  }
  ctx.addIssue({ code: "custom", message: "Not a number" });
  return z.NEVER;
});

const decimalPlaces = (max: number) => (d: Decimal) => d.decimalPlaces() <= max;

export const moneySchema = decimalSchema
  .refine(decimalPlaces(2), "At most 2 decimal places")
  .refine((d) => d.abs().lessThanOrEqualTo(MAX_AMOUNT), "Amount too large");
export const nonNegativeMoneySchema = moneySchema.refine((d) => !d.isNegative(), "Must not be negative");
export const rateSchema = decimalSchema
  .refine(decimalPlaces(4), "At most 4 decimal places")
  .refine((d) => d.greaterThanOrEqualTo(0) && d.lessThanOrEqualTo(1), "Must be between 0 and 1");
export const fxRateSchema = decimalSchema
  .refine(decimalPlaces(8), "At most 8 decimal places")
  .refine((d) => d.greaterThan(0), "Must be positive");
export const nightsSchema = decimalSchema.refine((d) => !d.isNegative(), "Must not be negative");
export const currencySchema = z.string().regex(/^[A-Z]{3}$/, "ISO 4217 code");

export const isoMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "YYYY-MM");
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/, "YYYY-MM-DD")
  .refine((s) => Number(s.slice(8, 10)) >= 1 && Number(s.slice(8, 10)) <= daysInMonth(s.slice(0, 7)), "Not a calendar date");

const percentBasisSchema = z.enum(["gross_revenue", "net_payout", "noi"]);

export const commissionTermsSchema = z.object({
  basis: z.enum(["none", "gross_revenue", "net_payout", "noi", "fixed_monthly", "hybrid"]),
  rate: rateSchema,
  fixedFee: nonNegativeMoneySchema,
  hybridMode: z.enum(["sum", "max"]),
  hybridBasis: percentBasisSchema,
  includeCleaningFees: z.boolean(),
}) satisfies z.ZodType<CommissionTerms>;

export const profitBasisSchema = z.object({
  includeIrregular: z.boolean(),
  includeDepreciation: z.boolean(),
}) satisfies z.ZodType<ProfitBasis>;

export const foreignAmountSchema = z.object({
  amount: moneySchema,
  currency: currencySchema,
  fxRate: fxRateSchema.nullish(),
}) satisfies z.ZodType<ForeignAmount>;

const costLineSchema = z.object({ id: z.string().min(1), amount: nonNegativeMoneySchema });

export const scenarioInputSchema = z
  .object({
    operatingModel: z.enum(["owner_operated", "rental_arbitrage", "managed_for_owner"]),
    daysInPeriod: z.number().int().min(28).max(31),
    blockedNights: z.number().int().min(0),
    // May exceed the available nights: that is an availability warning, not an input error.
    bookedNights: nightsSchema,
    adr: nonNegativeMoneySchema,
    avgLengthOfStay: decimalSchema.refine((d) => d.greaterThan(0), "Must be positive"),
    cleaningFeePerStay: nonNegativeMoneySchema,
    platformFeeRate: rateSchema,
    rent: nonNegativeMoneySchema,
    fixedCosts: z.array(costLineSchema),
    perStayCosts: z.array(costLineSchema),
    perNightCosts: z.array(costLineSchema),
    irregularCosts: z.array(costLineSchema),
    setupCost: nonNegativeMoneySchema,
    usefulLifeMonths: z.number().int().min(0).max(600),
    deposit: nonNegativeMoneySchema,
    commission: commissionTermsSchema,
  })
  .refine((s) => s.blockedNights <= s.daysInPeriod, { message: "Blocked nights exceed the days", path: ["blockedNights"] })
  .refine((s) => s.operatingModel === "rental_arbitrage" || (s.rent.isZero() && s.deposit.isZero()), {
    message: "Rent and deposit apply to rental arbitrage only",
    path: ["rent"],
  })
  .refine((s) => s.operatingModel === "managed_for_owner" || s.commission.basis === "none", {
    message: "Only managed units carry a commission",
    path: ["commission"],
  })
  .refine((s) => s.setupCost.isZero() || s.usefulLifeMonths > 0, {
    message: "A setup cost needs a useful life",
    path: ["usefulLifeMonths"],
  }) satisfies z.ZodType<ScenarioInput>;

export const perNightModelSchema = z.object({
  adr: nonNegativeMoneySchema,
  avgLengthOfStay: decimalSchema.refine((d) => d.greaterThan(0), "Must be positive"),
  cleaningFeePerStay: nonNegativeMoneySchema,
  otherIncomePerStay: nonNegativeMoneySchema,
  platformFeeRate: rateSchema,
  perStayCosts: nonNegativeMoneySchema,
  perNightCosts: nonNegativeMoneySchema,
  fixedCosts: nonNegativeMoneySchema,
  irregularCosts: nonNegativeMoneySchema,
  depreciation: decimalSchema.refine((d) => !d.isNegative(), "Must not be negative"),
  commission: commissionTermsSchema,
}) satisfies z.ZodType<PerNightModel>;

export const stayInputSchema = z
  .object({
    checkIn: isoDateSchema,
    checkOut: isoDateSchema,
    accommodationRevenue: moneySchema,
    cleaningFee: moneySchema,
    otherFees: moneySchema,
    platformFee: moneySchema,
    currency: currencySchema,
  })
  .refine((s) => nightsBetween(s.checkIn, s.checkOut) >= 1, { message: "Check-out must be after check-in", path: ["checkOut"] }) satisfies z.ZodType<UnitStay>;

export const statementStaySchema = z
  .object({
    checkIn: isoDateSchema,
    checkOut: isoDateSchema,
    accommodationRevenue: moneySchema,
    cleaningFee: moneySchema,
    otherFees: moneySchema,
    platformFee: moneySchema,
    currency: currencySchema,
    payoutDate: isoDateSchema,
  })
  .refine((s) => nightsBetween(s.checkIn, s.checkOut) >= 1, { message: "Check-out must be after check-in", path: ["checkOut"] }) satisfies z.ZodType<StatementStay>;

export const expenseLineSchema = z.object({
  date: isoDateSchema,
  categoryId: z.string().min(1),
  costBehavior: z.enum(["fixed", "per_night", "per_stay", "irregular", "one_off"]),
  amount: moneySchema,
  currency: currencySchema,
}) satisfies z.ZodType<ExpenseLine>;

const bearerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("owner") }),
  z.object({ kind: z.literal("manager") }),
  z.object({ kind: z.literal("split"), ownerShare: rateSchema }),
]);

const taxSettingsSchema = z.object({
  rate: rateSchema.nullable(),
  base: z.enum(["pre_tax_profit", "gross_revenue", "net_payout"]),
});

export const capexAssetSchema = z.object({
  cost: nonNegativeMoneySchema,
  salvageValue: nonNegativeMoneySchema.optional(),
  usefulLifeMonths: z.number().int().min(1).max(600),
  purchaseDate: isoDateSchema,
}) satisfies z.ZodType<CapexAsset>;

const lockedMonthsSchema = z
  .array(isoMonthSchema)
  .transform((months) => new Set(months))
  .optional();

export const unitMonthInputSchema = z.object({
  unitCurrency: currencySchema,
  month: isoMonthSchema,
  availability: z.object({ blockedNights: z.number().int().min(0), goLiveDate: isoDateSchema.nullish() }),
  stays: z.array(stayInputSchema),
  expenses: z.array(expenseLineSchema),
  depreciation: decimalSchema.refine((d) => !d.isNegative(), "Must not be negative"),
  commission: commissionTermsSchema.optional(),
  bearerRules: z.record(z.string(), bearerSchema).optional(),
  tax: taxSettingsSchema.optional(),
  lockedMonths: lockedMonthsSchema,
}) satisfies z.ZodType<UnitMonthInput>;

export const statementInputSchema = z.object({
  unitCurrency: currencySchema,
  period: isoMonthSchema,
  basis: z.enum(["cash", "accrual"]),
  stays: z.array(statementStaySchema),
  expenses: z.array(expenseLineSchema),
  commission: commissionTermsSchema,
  bearerRules: z.record(z.string(), bearerSchema).optional(),
  ownerPayouts: z.array(z.object({ date: isoDateSchema, amount: nonNegativeMoneySchema, currency: currencySchema })),
  openingBalance: moneySchema,
  lockedMonths: lockedMonthsSchema,
}) satisfies z.ZodType<StatementInput>;

/** Parses raw input with a schema into a typed `Result` (`invalid_input` lists the issues). */
export function parseWith<S extends z.ZodType>(schema: S, raw: unknown): Result<z.output<S>> {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return ok(parsed.data);
  return err({
    code: "invalid_input",
    issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
  });
}

// ---- Outputs -------------------------------------------------------------

const D = z.custom<Decimal>((v) => Decimal.isDecimal(v), "Expected a Decimal");
const nullableD = D.nullable();

const warningSchema = z.object({
  code: z.literal("availability_conflict"),
  bookedNights: D,
  nightsAvailable: D,
}) satisfies z.ZodType<FinanceWarning>;

export const kpisSchema = z.object({
  nightsAvailable: D,
  bookedNights: D,
  occupancy: nullableD,
  adr: nullableD,
  revpar: nullableD,
  warnings: z.array(warningSchema),
}) satisfies z.ZodType<Kpis>;

export const modelPnlSchema = z.object({
  nights: D,
  stays: D,
  accommodationRevenue: D,
  cleaningFees: D,
  otherIncome: D,
  grossRevenue: D,
  platformFees: D,
  platformFeesOnCleaning: D,
  netPayout: D,
  perStayCosts: D,
  perNightCosts: D,
  fixedCosts: D,
  irregularCosts: D,
  opex: D,
  noi: D,
  commission: D,
  profitBeforeDepreciation: D,
  depreciation: D,
  profit: D,
}) satisfies z.ZodType<ModelPnl>;

export const breakEvenResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("reached"),
    nights: D,
    wholeNights: z.number().int().min(0),
    occupancy: D,
    wholeOccupancy: D,
    basis: profitBasisSchema,
  }),
  z.object({
    kind: z.literal("unreachable"),
    reason: z.enum(["no_available_nights", "never_profitable", "exceeds_available_nights"]),
    basis: profitBasisSchema,
  }),
]) satisfies z.ZodType<BreakEvenResult>;

export const verdictSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("profitable"), occupancy: nullableD, breakEvenOccupancy: nullableD }),
  z.object({ kind: z.literal("at_break_even"), occupancy: nullableD }),
  z.object({ kind: z.literal("loss"), occupancy: nullableD, breakEvenOccupancy: D }),
  z.object({
    kind: z.literal("unreachable"),
    occupancy: nullableD,
    reason: z.enum(["never_profitable", "exceeds_available_nights"]),
  }),
  z.object({ kind: z.literal("no_available_nights") }),
]) satisfies z.ZodType<Verdict>;

export const scenarioResultSchema = z.object({
  engineVersion: z.string(),
  nightsAvailable: D,
  kpis: kpisSchema,
  pnl: modelPnlSchema,
  rent: D,
  opexExcludingRent: D,
  profitBeforeDepreciation: D,
  depreciation: D,
  netProfit: D,
  contributionPerNight: D,
  breakEven: z.object({
    primary: breakEvenResultSchema,
    excludingIrregular: breakEvenResultSchema,
    includingDepreciation: breakEvenResultSchema,
  }),
  investment: z.object({ totalCashInvested: D, paybackMonths: nullableD, cashOnCash: nullableD }),
  verdict: verdictSchema,
}) satisfies z.ZodType<ScenarioResult>;

export const stayMonthAllocationSchema = z.object({
  month: isoMonthSchema,
  nights: z.number().int().min(1),
  accommodationRevenue: D,
  cleaningFee: D,
  otherFees: D,
  platformFee: D,
  platformFeeOnCleaning: D,
  engineVersion: z.string(),
}) satisfies z.ZodType<StayMonthAllocation>;

const categoryAmountSchema = z.object({ categoryId: z.string(), amount: D });

export const unitMonthPnlSchema = z.object({
  month: isoMonthSchema,
  kpis: kpisSchema,
  stays: z.number().int().min(0),
  accommodationRevenue: D,
  cleaningFees: D,
  otherIncome: D,
  grossRevenue: D,
  platformFees: D,
  platformFeesOnCleaning: D,
  netPayout: D,
  opexByBehavior: z.object({ fixed: D, per_night: D, per_stay: D, irregular: D }),
  expensesByCategory: z.array(categoryAmountSchema),
  opex: D,
  noi: D,
  commission: D,
  depreciation: D,
  preTaxProfit: D,
  tax: D,
  netProfit: D,
  ownerBorneOpex: D,
  managerBorneOpex: D,
  managerProfit: D,
}) satisfies z.ZodType<UnitMonthPnl>;

export const ownerStatementSchema = z.object({
  period: isoMonthSchema,
  basis: z.enum(["cash", "accrual"]),
  openingBalance: D,
  grossRevenue: D,
  platformFees: D,
  netPayout: D,
  ownerExpenses: z.array(categoryAmountSchema),
  ownerExpensesTotal: D,
  noi: D,
  commission: D,
  ownerNet: D,
  ownerPayouts: D,
  balanceDue: D,
  managerBorneOpex: D,
  managerProfit: D,
}) satisfies z.ZodType<OwnerStatement>;

export const currencyTotalSchema = z.object({
  currency: currencySchema,
  ownerRunNetProfit: D,
  managedManagerProfit: D,
  overhead: D,
  total: D,
}) satisfies z.ZodType<CurrencyTotal>;

export const sensitivityGridSchema = z.object({
  occupancies: z.array(D),
  adrs: z.array(D),
  profits: z.array(z.array(D)),
  basis: profitBasisSchema,
}) satisfies z.ZodType<SensitivityGrid>;
