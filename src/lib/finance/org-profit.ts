import Decimal from "decimal.js";
import { sumMoney, ZERO } from "./money";

/**
 * Org profit — the Home hero number (CLAUDE.md §9, BUILD_PLAN.md §4.2):
 * Σ net profit of owner-operated and rental-arbitrage units + Σ manager
 * profit of managed units − portfolio-level overhead, one total per
 * currency. The owner and co-host views are the two halves of it: the
 * owner view carries the owner-run units, the co-host view the managed
 * units and the overhead (manager costs, never charged to owners).
 */

export type OperatingModel = "owner_operated" | "rental_arbitrage" | "managed_for_owner";

export interface UnitResult {
  operatingModel: OperatingModel;
  currency: string;
  /** Owner-operated and rental-arbitrage units. */
  netProfit?: Decimal.Value;
  /** Managed units: commission − manager-borne costs. */
  managerProfit?: Decimal.Value;
}

export interface OverheadLine {
  currency: string;
  amount: Decimal.Value;
}

export type ProfitView = "org" | "owner" | "cohost";

export interface CurrencyTotal {
  currency: string;
  ownerRunNetProfit: Decimal;
  managedManagerProfit: Decimal;
  /** Portfolio-level overhead, as a positive cost (its own line). */
  overhead: Decimal;
  total: Decimal;
}

export function isOwnerRun(model: OperatingModel): boolean {
  return model !== "managed_for_owner";
}

export function orgProfit(
  units: readonly UnitResult[],
  overhead: readonly OverheadLine[],
  view: ProfitView = "org",
): CurrencyTotal[] {
  const includeOwnerRun = view !== "cohost";
  const includeManaged = view !== "owner";
  const currencies = [...new Set([...units.map((u) => u.currency), ...(includeManaged ? overhead.map((o) => o.currency) : [])])];

  return currencies.map((currency) => {
    const inCurrency = units.filter((u) => u.currency === currency);
    const ownerRunNetProfit = includeOwnerRun
      ? sumMoney(inCurrency.filter((u) => isOwnerRun(u.operatingModel)).map((u) => u.netProfit ?? ZERO))
      : ZERO;
    const managedManagerProfit = includeManaged
      ? sumMoney(inCurrency.filter((u) => !isOwnerRun(u.operatingModel)).map((u) => u.managerProfit ?? ZERO))
      : ZERO;
    const overheadTotal = includeManaged
      ? sumMoney(overhead.filter((o) => o.currency === currency).map((o) => o.amount))
      : ZERO;
    return {
      currency,
      ownerRunNetProfit,
      managedManagerProfit,
      overhead: overheadTotal,
      total: ownerRunNetProfit.plus(managedManagerProfit).minus(overheadTotal),
    };
  });
}

/**
 * Month-over-month change as a ratio of last month. Null when last month
 * was zero or a loss: a percentage on that base is meaningless, so the UI
 * hides it rather than showing a misleading figure.
 */
export function monthOverMonthChange(current: Decimal.Value, previous: Decimal.Value): Decimal | null {
  const prev = new Decimal(previous);
  if (prev.lessThanOrEqualTo(0)) return null;
  return new Decimal(current).minus(prev).dividedBy(prev);
}
