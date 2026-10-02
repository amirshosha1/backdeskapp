import Decimal from "decimal.js";
import { monthOf, type IsoDate, type IsoMonth } from "./period";
import { roundMoney, sumMoney, ZERO } from "./money";

/**
 * Depreciation and investment metrics (BUILD_PLAN.md §4.1, §4.5).
 */

export interface CapexAsset {
  cost: Decimal.Value;
  salvageValue?: Decimal.Value;
  usefulLifeMonths: number;
  purchaseDate: IsoDate;
}

/** Straight line: (cost − salvage) ÷ useful life, exact (0 when there is no life). */
export function straightLineMonthly(cost: Decimal.Value, salvageValue: Decimal.Value, usefulLifeMonths: number): Decimal {
  if (usefulLifeMonths <= 0) return ZERO;
  return new Decimal(cost).minus(salvageValue).dividedBy(usefulLifeMonths);
}

function monthIndex(month: IsoMonth): number {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return y * 12 + (m - 1);
}

/**
 * Σ (cost − salvage) / useful_life for assets active in `month` — from the
 * purchase month for `usefulLifeMonths` months — rounded half-up as one
 * monthly P&L line.
 */
export function monthlyDepreciation(assets: readonly CapexAsset[], month: IsoMonth): Decimal {
  const target = monthIndex(month);
  const active = assets.filter((asset) => {
    const start = monthIndex(monthOf(asset.purchaseDate));
    return target >= start && target < start + asset.usefulLifeMonths;
  });
  return roundMoney(
    sumMoney(active.map((a) => straightLineMonthly(a.cost, a.salvageValue ?? 0, a.usefulLifeMonths))),
  );
}

export interface CashInvested {
  capex: Decimal.Value;
  deposits: Decimal.Value;
  preOpeningCosts: Decimal.Value;
}

export function totalCashInvested(input: CashInvested): Decimal {
  return sumMoney([input.capex, input.deposits, input.preOpeningCosts]);
}

/** Months to recover the cash invested; null when nothing is invested or cash flow is ≤ 0. */
export function paybackMonths(invested: Decimal.Value, avgMonthlyNetCashflow: Decimal.Value): Decimal | null {
  const cash = new Decimal(invested);
  const flow = new Decimal(avgMonthlyNetCashflow);
  if (cash.lessThanOrEqualTo(0) || flow.lessThanOrEqualTo(0)) return null;
  return cash.dividedBy(flow);
}

/** Annual net cash flow ÷ cash invested; null when nothing is invested. */
export function cashOnCash(invested: Decimal.Value, annualNetCashflow: Decimal.Value): Decimal | null {
  const cash = new Decimal(invested);
  if (cash.lessThanOrEqualTo(0)) return null;
  return new Decimal(annualNetCashflow).dividedBy(cash);
}
