import Decimal from "decimal.js";
import { computeCommission, NO_COMMISSION, type CommissionTerms } from "./commission";
import { requireUnitCurrency } from "./fx";
import { computeKpis, type Kpis } from "./kpis";
import type { PerNightModel } from "./model";
import { allocateProportionally, roundMoney, sumMoney, ZERO } from "./money";
import {
  allocateStayByMonth,
  monthOf,
  nightsAvailable,
  postingMonth,
  type AvailabilityInput,
  type IsoDate,
  type IsoMonth,
  type StayInput,
} from "./period";
import { err, ok, type Result } from "./result";
import { computeTax, NO_TAX, type TaxSettings } from "./tax";

/**
 * One unit, one month, from actual stays and expenses (BUILD_PLAN.md
 * §4.1, accrual by night per §4.4). Every money line is a whole-piastre
 * amount: revenue and expenses are sums of stored amounts, and the derived
 * lines (commission, depreciation, tax) are rounded half-up once, so the
 * lines a screen shows always add up exactly.
 */

export type CostBehavior = "fixed" | "per_night" | "per_stay" | "irregular" | "one_off";

/** Who bears an expense category on a managed unit (`agreements.expense_bearer_rules`). */
export type Bearer = { kind: "owner" } | { kind: "manager" } | { kind: "split"; ownerShare: Decimal.Value };

export interface ExpenseLine {
  date: IsoDate;
  categoryId: string;
  costBehavior: CostBehavior;
  /** In the unit currency (`amount_unit`). */
  amount: Decimal.Value;
  currency: string;
}

export interface UnitStay extends StayInput {
  currency: string;
}

export interface UnitMonthInput {
  unitCurrency: string;
  month: IsoMonth;
  availability: Omit<AvailabilityInput, "month">;
  /** Every stay that may touch the month; the engine allocates them by night. */
  stays: readonly UnitStay[];
  /** Expenses; those posted to `month` are counted. */
  expenses: readonly ExpenseLine[];
  /** Monthly depreciation, already computed (`monthlyDepreciation`). */
  depreciation: Decimal.Value;
  commission?: CommissionTerms;
  /** Per category; categories not listed are borne by the owner. */
  bearerRules?: Readonly<Record<string, Bearer>>;
  tax?: TaxSettings;
  lockedMonths?: ReadonlySet<IsoMonth>;
}

export interface UnitMonthPnl {
  month: IsoMonth;
  kpis: Kpis;
  /** Stays checking in this month (avg_LOS = booked nights ÷ stays). */
  stays: number;
  accommodationRevenue: Decimal;
  cleaningFees: Decimal;
  otherIncome: Decimal;
  grossRevenue: Decimal;
  platformFees: Decimal;
  platformFeesOnCleaning: Decimal;
  netPayout: Decimal;
  opexByBehavior: Record<"fixed" | "per_night" | "per_stay" | "irregular", Decimal>;
  /** Per category, in first-seen order. */
  expensesByCategory: { categoryId: string; amount: Decimal }[];
  opex: Decimal;
  noi: Decimal;
  commission: Decimal;
  depreciation: Decimal;
  preTaxProfit: Decimal;
  tax: Decimal;
  netProfit: Decimal;
  ownerBorneOpex: Decimal;
  managerBorneOpex: Decimal;
  /** commission − manager-borne opex (managed units). */
  managerProfit: Decimal;
}

/** Splits one expense between owner and manager; the leftover cent goes to the manager (last line). */
export function splitByBearer(amount: Decimal.Value, bearer: Bearer | undefined): { owner: Decimal; manager: Decimal } {
  if (!bearer || bearer.kind === "owner") return { owner: new Decimal(amount), manager: ZERO };
  if (bearer.kind === "manager") return { owner: ZERO, manager: new Decimal(amount) };
  const share = new Decimal(bearer.ownerShare);
  const [owner, manager] = allocateProportionally(amount, [share, new Decimal(1).minus(share)]) as [Decimal, Decimal];
  return { owner, manager };
}

/** Groups amounts by key in first-seen order. */
export function sumByCategory(lines: readonly { categoryId: string; amount: Decimal.Value }[]) {
  const totals = new Map<string, Decimal>();
  for (const line of lines) totals.set(line.categoryId, (totals.get(line.categoryId) ?? ZERO).plus(line.amount));
  return [...totals].map(([categoryId, amount]) => ({ categoryId, amount }));
}

export function unitMonthPnl(input: UnitMonthInput): Result<UnitMonthPnl> {
  for (const item of [...input.stays, ...input.expenses]) {
    const check = requireUnitCurrency(item.currency, input.unitCurrency);
    if (!check.ok) return check;
  }
  const available = nightsAvailable({ ...input.availability, month: input.month });
  if (!available.ok) return available;

  const locked = input.lockedMonths ?? new Set<IsoMonth>();
  const allocations = input.stays
    .flatMap((stay) => allocateStayByMonth(stay))
    .filter((row) => postingMonth(row.month, locked) === input.month);
  const stays = input.stays.filter((s) => postingMonth(monthOf(s.checkIn), locked) === input.month).length;
  const expenses = input.expenses.filter((e) => postingMonth(monthOf(e.date), locked) === input.month);

  const bookedNights = allocations.reduce((n, row) => n + row.nights, 0);
  const accommodationRevenue = sumMoney(allocations.map((r) => r.accommodationRevenue));
  const cleaningFees = sumMoney(allocations.map((r) => r.cleaningFee));
  const otherIncome = sumMoney(allocations.map((r) => r.otherFees));
  const grossRevenue = accommodationRevenue.plus(cleaningFees).plus(otherIncome);
  const platformFees = sumMoney(allocations.map((r) => r.platformFee));
  const platformFeesOnCleaning = sumMoney(allocations.map((r) => r.platformFeeOnCleaning));
  const netPayout = grossRevenue.minus(platformFees);

  const behaviorOf = (b: CostBehavior) => (b === "one_off" ? "irregular" : b);
  const byBehavior = (b: "fixed" | "per_night" | "per_stay" | "irregular") =>
    sumMoney(expenses.filter((e) => behaviorOf(e.costBehavior) === b).map((e) => e.amount));
  const opexByBehavior = {
    fixed: byBehavior("fixed"),
    per_night: byBehavior("per_night"),
    per_stay: byBehavior("per_stay"),
    irregular: byBehavior("irregular"),
  };
  const opex = sumMoney(expenses.map((e) => e.amount));
  const noi = netPayout.minus(opex);

  const commission = roundMoney(
    computeCommission(input.commission ?? NO_COMMISSION, {
      grossRevenue,
      cleaningFees,
      platformFeesOnCleaning,
      netPayout,
      noi,
    }),
  );
  const depreciation = roundMoney(input.depreciation);
  const preTaxProfit = noi.minus(commission).minus(depreciation);
  const tax = computeTax(input.tax ?? NO_TAX, { preTaxProfit, grossRevenue, netPayout });

  const splits = expenses.map((e) => splitByBearer(e.amount, input.bearerRules?.[e.categoryId]));
  const ownerBorneOpex = sumMoney(splits.map((s) => s.owner));
  const managerBorneOpex = sumMoney(splits.map((s) => s.manager));

  return ok({
    month: input.month,
    kpis: computeKpis({ nightsAvailable: available.value, bookedNights, accommodationRevenue }),
    stays,
    accommodationRevenue,
    cleaningFees,
    otherIncome,
    grossRevenue,
    platformFees,
    platformFeesOnCleaning,
    netPayout,
    opexByBehavior,
    expensesByCategory: sumByCategory(expenses),
    opex,
    noi,
    commission,
    depreciation,
    preTaxProfit,
    tax,
    netProfit: preTaxProfit.minus(tax),
    ownerBorneOpex,
    managerBorneOpex,
    managerProfit: commission.minus(managerBorneOpex),
  });
}

/**
 * The per-night model implied by a month's actuals (avg_LOS = booked ÷
 * stays, fee rate = fees ÷ gross, …), for a break-even on real data. At the
 * month's own booked nights it reproduces the month's NOI exactly, so the
 * break-even sits on the same basis as the profit shown. Null when nothing
 * was booked or no stay checked in (no ADR or average stay to derive).
 */
export function perNightModelFromActuals(
  pnl: UnitMonthPnl,
  commission: CommissionTerms = NO_COMMISSION,
): Result<PerNightModel, { code: "no_stays" }> {
  const booked = pnl.kpis.bookedNights;
  if (booked.isZero() || pnl.stays === 0 || pnl.grossRevenue.isZero()) return err({ code: "no_stays" });
  return ok({
    adr: pnl.accommodationRevenue.dividedBy(booked),
    avgLengthOfStay: booked.dividedBy(pnl.stays),
    cleaningFeePerStay: pnl.cleaningFees.dividedBy(pnl.stays),
    otherIncomePerStay: pnl.otherIncome.dividedBy(pnl.stays),
    platformFeeRate: pnl.platformFees.dividedBy(pnl.grossRevenue),
    perStayCosts: pnl.opexByBehavior.per_stay.dividedBy(pnl.stays),
    perNightCosts: pnl.opexByBehavior.per_night.dividedBy(booked),
    fixedCosts: pnl.opexByBehavior.fixed,
    irregularCosts: pnl.opexByBehavior.irregular,
    depreciation: pnl.depreciation,
    commission,
  });
}
