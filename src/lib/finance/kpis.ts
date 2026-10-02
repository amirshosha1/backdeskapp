import Decimal from "decimal.js";
import { ONE, sumMoney, ZERO } from "./money";

/**
 * Occupancy, ADR and RevPAR (BUILD_PLAN.md §4.1, CLAUDE.md §9).
 *
 * Booked nights above available nights are never clamped: the engine
 * returns the raw occupancy with an `availability_conflict` warning, and
 * only the *displayed* occupancy is capped at 100% (`displayOccupancy`).
 */

export type FinanceWarning = {
  code: "availability_conflict";
  bookedNights: Decimal;
  nightsAvailable: Decimal;
};

export interface KpiInput {
  nightsAvailable: Decimal.Value;
  bookedNights: Decimal.Value;
  accommodationRevenue: Decimal.Value;
}

export interface Kpis {
  nightsAvailable: Decimal;
  bookedNights: Decimal;
  /** Null when no nights are available. May exceed 1, always with a warning. */
  occupancy: Decimal | null;
  /** Null when nothing was booked. */
  adr: Decimal | null;
  /** Null when no nights are available. */
  revpar: Decimal | null;
  warnings: FinanceWarning[];
}

export function computeKpis(input: KpiInput): Kpis {
  const available = new Decimal(input.nightsAvailable);
  const booked = new Decimal(input.bookedNights);
  const revenue = new Decimal(input.accommodationRevenue);
  const warnings: FinanceWarning[] = [];
  if (booked.greaterThan(available)) {
    warnings.push({ code: "availability_conflict", bookedNights: booked, nightsAvailable: available });
  }
  return {
    nightsAvailable: available,
    bookedNights: booked,
    occupancy: available.isZero() ? null : booked.dividedBy(available),
    adr: booked.isZero() ? null : revenue.dividedBy(booked),
    revpar: available.isZero() ? null : revenue.dividedBy(available),
    warnings,
  };
}

/** Portfolio KPIs are weighted by nights: Σ booked ÷ Σ available, Σ revenue ÷ Σ booked. */
export function aggregateKpis(units: readonly KpiInput[]): Kpis {
  return computeKpis({
    nightsAvailable: sumMoney(units.map((u) => u.nightsAvailable)),
    bookedNights: sumMoney(units.map((u) => u.bookedNights)),
    accommodationRevenue: sumMoney(units.map((u) => u.accommodationRevenue)),
  });
}

/** What the UI shows: occupancy capped at 100% (pair it with the conflict warning). */
export function displayOccupancy(occupancy: Decimal | null): Decimal | null {
  return occupancy === null ? null : Decimal.min(occupancy, ONE);
}

export interface CategoryAmount {
  id: string;
  amount: Decimal.Value;
}

export interface CategoryShare {
  id: string;
  amount: Decimal;
  /** Share of the total, 0–1 (0 when the total is 0). */
  share: Decimal;
}

export interface ExpenseBreakdown {
  total: Decimal;
  /** Largest first; ties keep their input order. */
  categories: CategoryShare[];
  /** The `top` largest categories. */
  top: CategoryShare[];
  /** Everything after the top categories, folded into one line (null when nothing is left). */
  rest: (CategoryShare & { ids: string[] }) | null;
}

/** Ranks expense categories by amount and folds the tail into one "everything else" line. */
export function expenseBreakdown(items: readonly CategoryAmount[], top: number): ExpenseBreakdown {
  const total = sumMoney(items.map((i) => i.amount));
  const shareOf = (amount: Decimal) => (total.isZero() ? ZERO : amount.dividedBy(total));
  const categories = items
    .map((item, index) => ({ id: item.id, amount: new Decimal(item.amount), index }))
    .sort((a, b) => b.amount.comparedTo(a.amount) || a.index - b.index)
    .map(({ id, amount }) => ({ id, amount, share: shareOf(amount) }));
  const head = categories.slice(0, top);
  const tail = categories.slice(top);
  const restAmount = sumMoney(tail.map((c) => c.amount));
  return {
    total,
    categories,
    top: head,
    rest:
      tail.length === 0
        ? null
        : { id: "other", ids: tail.map((c) => c.id), amount: restAmount, share: shareOf(restAmount) },
  };
}
