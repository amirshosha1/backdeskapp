import {
  aggregateKpis,
  breakEvenNights,
  breakEvenProgress,
  displayOccupancy,
  expenseBreakdown,
  monthOverMonthChange,
  orgProfit,
  perNightModelFromActuals,
  sumByCategory,
  toMoneyString,
  type BreakEvenResult,
  type CategoryShare,
  type ProfitBasis,
  type UnitMonthPnl,
} from "@/lib/finance";
import { CATEGORIES, type CategoryId } from "@/demo/sample-data/categories";
import { SAMPLE_MONTH, SAMPLE_OVERHEAD } from "@/demo/sample-data/units";
import { monthLabel } from "./build";
import type { ExpenseShare, Localized } from "./types";
import { PORTFOLIO_OVERHEAD, toUnitFixture, UNIT_RESULTS, type UnitResult } from "./units";

/**
 * Home dashboard fixtures, all from the finance engine. CLAUDE.md §7: the
 * first element answers "كم ربحت فعلاً هذا الشهر؟" per the operating model:
 * the owner view sums owner-run units' net profit, the co-host view sums
 * managed units' manager profit minus portfolio overhead (org-profit.ts).
 * The month-over-month change compares with the sample August, and is
 * hidden (null) when August was zero or a loss.
 */

const ownerRun = UNIT_RESULTS.filter((r) => r.unit.operatingModel !== "managed_for_owner");
const managed = UNIT_RESULTS.filter((r) => r.unit.operatingModel === "managed_for_owner");

export const HOME_PERIOD: Localized = monthLabel(SAMPLE_MONTH);

/** The single EGP total of a view (every sample unit is in EGP). */
function viewTotal(results: UnitResult[], month: "pnl" | "previous", view: "owner" | "cohost") {
  const totals = orgProfit(
    results.map((r) => ({
      operatingModel: r.unit.operatingModel,
      currency: r.unit.currency,
      netProfit: r[month].netProfit,
      managerProfit: r[month].managerProfit,
    })),
    SAMPLE_OVERHEAD.map((line) => ({ currency: "EGP", amount: line.amount })),
    view,
  );
  if (totals.length !== 1) throw new Error("The demo shows one currency per view");
  return totals[0]!.total;
}

function viewKpis(results: UnitResult[]) {
  const kpis = aggregateKpis(
    results.map((r) => ({
      nightsAvailable: r.pnl.kpis.nightsAvailable,
      bookedNights: r.pnl.kpis.bookedNights,
      accommodationRevenue: r.pnl.accommodationRevenue,
    })),
  );
  return {
    occupancy: displayOccupancy(kpis.occupancy)?.toNumber() ?? 0,
    availabilityConflict: kpis.warnings.length > 0,
    adr: toMoneyString(kpis.adr ?? 0),
    revpar: toMoneyString(kpis.revpar ?? 0),
  };
}

function change(results: UnitResult[], view: "owner" | "cohost"): number | null {
  return monthOverMonthChange(viewTotal(results, "pnl", view), viewTotal(results, "previous", view))?.toNumber() ?? null;
}

/**
 * Break-even on the same basis as the net profit shown on the unit's card:
 * every cost in that net profit — the repairs allowance and the setup-cost
 * depreciation included (Phase 1 review, 2026-10-01). Samples carry no tax,
 * and tax is zero at break-even anyway.
 */
export const NET_PROFIT_BASIS: ProfitBasis = { includeIrregular: true, includeDepreciation: true };

function unitBreakEven({ unit, pnl }: UnitResult): { result: BreakEvenResult; booked: number } | null {
  const model = perNightModelFromActuals(pnl, unit.commission);
  if (!model.ok) return null;
  return {
    result: breakEvenNights(model.value, pnl.kpis.nightsAvailable, NET_PROFIT_BASIS),
    booked: pnl.kpis.bookedNights.toNumber(),
  };
}

/** The tile features the owner-run unit furthest from break-even. */
function featuredBreakEven() {
  const candidates = ownerRun
    .map((r) => {
      const be = unitBreakEven(r);
      const progress = be && breakEvenProgress(be.booked, be.result);
      return be && progress && be.result.kind === "reached" ? { r, be: be.result, booked: be.booked, progress } : null;
    })
    .filter((c) => c !== null)
    .sort((a, b) => Number(a.progress.reached) - Number(b.progress.reached) || b.progress.nightsShort - a.progress.nightsShort);
  const pick = candidates[0];
  if (!pick) throw new Error("No owner-run sample unit has a reachable break-even");
  return {
    unitName: pick.r.unit.name,
    bookedNights: pick.booked,
    breakEvenNights: toMoneyString(pick.be.nights),
    availableNights: pick.r.pnl.kpis.nightsAvailable.toNumber(),
    reached: pick.progress.reached,
    targetNights: pick.progress.targetNights,
    nightsShort: pick.progress.nightsShort,
    progress: pick.progress.progress.toNumber(),
    basis: pick.be.basis,
  };
}

function expenseShares(pnls: UnitMonthPnl[]) {
  const byCategory = sumByCategory(pnls.flatMap((p) => p.expensesByCategory));
  return expenseBreakdown(
    byCategory.map((c) => ({ id: c.categoryId, amount: c.amount })),
    3,
  );
}

/** Display shape of a ranked category; `name` overrides the category's own (the folded "everything else" line). */
export function toExpenseShare(item: CategoryShare, name?: Localized): ExpenseShare {
  const category = CATEGORIES[item.id as CategoryId];
  return {
    id: item.id,
    icon: category.icon,
    name: name ?? category.name,
    amount: toMoneyString(item.amount),
    share: item.share.toNumber(),
  };
}

/** The owner view's month of expenses (owner-run units), ranked. */
export const OWNER_EXPENSES = expenseShares(ownerRun.map((r) => r.pnl));

export const HOME_OWNER_VIEW = {
  heroTotal: toMoneyString(viewTotal(ownerRun, "pnl", "owner")),
  change: change(ownerRun, "owner"),
  ...viewKpis(ownerRun),
  units: ownerRun.map(toUnitFixture),
  breakEven: featuredBreakEven(),
  topExpenses: OWNER_EXPENSES.top.map((c) => toExpenseShare(c)),
};

export const HOME_COHOST_VIEW = {
  heroTotal: toMoneyString(viewTotal(managed, "pnl", "cohost")),
  change: change(managed, "cohost"),
  ...viewKpis(managed),
  units: managed.map(toUnitFixture),
  overhead: PORTFOLIO_OVERHEAD,
};
