import Decimal from "decimal.js";
import { computeCommission, type CommissionTerms } from "./commission";
import { requireUnitCurrency } from "./fx";
import { roundMoney, sumMoney } from "./money";
import { allocateStayByMonth, monthOf, postingMonth, type IsoDate, type IsoMonth } from "./period";
import { splitByBearer, sumByCategory, type Bearer, type ExpenseLine, type UnitStay } from "./pnl";
import { ok, type Result } from "./result";

/**
 * Owner statements (BUILD_PLAN.md §4.2, §4.4).
 *
 * - `cash` (default): revenue, platform fees and payouts by payout date;
 *   expenses by payment date. Commission is computed on these figures.
 * - `accrual`: revenue by night (`allocateStayByMonth`).
 *
 * `owner_net = net_payout − owner_borne_opex − commission`;
 * `balance_due = opening_balance + owner_net − owner_payouts`. Every line
 * is a whole-piastre amount and the lines sum exactly to the totals.
 */

export interface StatementStay extends UnitStay {
  payoutDate: IsoDate;
}

export interface OwnerPayout {
  date: IsoDate;
  amount: Decimal.Value;
  currency: string;
}

export interface StatementInput {
  unitCurrency: string;
  period: IsoMonth;
  basis: "cash" | "accrual";
  stays: readonly StatementStay[];
  expenses: readonly ExpenseLine[];
  commission: CommissionTerms;
  bearerRules?: Readonly<Record<string, Bearer>>;
  ownerPayouts: readonly OwnerPayout[];
  /** The previous finalized statement's closing balance, or a manual amount on an owner's first statement. */
  openingBalance: Decimal.Value;
  lockedMonths?: ReadonlySet<IsoMonth>;
}

export interface OwnerStatement {
  period: IsoMonth;
  basis: "cash" | "accrual";
  openingBalance: Decimal;
  grossRevenue: Decimal;
  platformFees: Decimal;
  netPayout: Decimal;
  /** Owner-borne expenses by category (the owner's share of split categories). */
  ownerExpenses: { categoryId: string; amount: Decimal }[];
  ownerExpensesTotal: Decimal;
  /** All unit opex, whoever bears it (the NOI commission basis uses it). */
  noi: Decimal;
  commission: Decimal;
  ownerNet: Decimal;
  ownerPayouts: Decimal;
  balanceDue: Decimal;
  managerBorneOpex: Decimal;
  managerProfit: Decimal;
}

export function ownerStatement(input: StatementInput): Result<OwnerStatement> {
  for (const item of [...input.stays, ...input.expenses, ...input.ownerPayouts]) {
    const check = requireUnitCurrency(item.currency, input.unitCurrency);
    if (!check.ok) return check;
  }
  const locked = input.lockedMonths ?? new Set<IsoMonth>();
  const inPeriod = (date: IsoDate) => postingMonth(monthOf(date), locked) === input.period;

  let gross: Decimal;
  let cleaning: Decimal;
  let fees: Decimal;
  let feesOnCleaning: Decimal;
  if (input.basis === "cash") {
    const paid = input.stays.filter((s) => inPeriod(s.payoutDate));
    const rows = paid.flatMap((s) => allocateStayByMonth(s));
    gross = sumMoney(paid.flatMap((s) => [s.accommodationRevenue, s.cleaningFee, s.otherFees]));
    cleaning = sumMoney(paid.map((s) => s.cleaningFee));
    fees = sumMoney(paid.map((s) => s.platformFee));
    feesOnCleaning = sumMoney(rows.map((r) => r.platformFeeOnCleaning));
  } else {
    const rows = input.stays
      .flatMap((s) => allocateStayByMonth(s))
      .filter((r) => postingMonth(r.month, locked) === input.period);
    gross = sumMoney(rows.flatMap((r) => [r.accommodationRevenue, r.cleaningFee, r.otherFees]));
    cleaning = sumMoney(rows.map((r) => r.cleaningFee));
    fees = sumMoney(rows.map((r) => r.platformFee));
    feesOnCleaning = sumMoney(rows.map((r) => r.platformFeeOnCleaning));
  }
  const netPayout = gross.minus(fees);

  const expenses = input.expenses.filter((e) => inPeriod(e.date));
  const opex = sumMoney(expenses.map((e) => e.amount));
  const noi = netPayout.minus(opex);
  const splits = expenses.map((e) => ({ categoryId: e.categoryId, ...splitByBearer(e.amount, input.bearerRules?.[e.categoryId]) }));
  const ownerExpenses = sumByCategory(splits.map((s) => ({ categoryId: s.categoryId, amount: s.owner }))).filter(
    (line) => !line.amount.isZero(),
  );
  const ownerExpensesTotal = sumMoney(ownerExpenses.map((l) => l.amount));
  const managerBorneOpex = sumMoney(splits.map((s) => s.manager));

  const commission = roundMoney(
    computeCommission(input.commission, {
      grossRevenue: gross,
      cleaningFees: cleaning,
      platformFeesOnCleaning: feesOnCleaning,
      netPayout,
      noi,
    }),
  );
  const ownerNet = netPayout.minus(ownerExpensesTotal).minus(commission);
  const ownerPayouts = sumMoney(input.ownerPayouts.filter((p) => inPeriod(p.date)).map((p) => p.amount));
  const openingBalance = new Decimal(input.openingBalance);

  return ok({
    period: input.period,
    basis: input.basis,
    openingBalance,
    grossRevenue: gross,
    platformFees: fees,
    netPayout,
    ownerExpenses,
    ownerExpensesTotal,
    noi,
    commission,
    ownerNet,
    ownerPayouts,
    balanceDue: openingBalance.plus(ownerNet).minus(ownerPayouts),
    managerBorneOpex,
    managerProfit: commission.minus(managerBorneOpex),
  });
}
