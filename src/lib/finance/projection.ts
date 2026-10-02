import "server-only";
import Decimal from "decimal.js";
import { computeKpis, type FinanceWarning } from "./kpis";
import { modelPnl, type ModelPnl, type PerNightModel, type ProfitBasis } from "./model";
import { sumMoney } from "./money";
import { daysInMonth, nextMonth, type IsoMonth } from "./period";

/**
 * 12-month seasonal projection (BUILD_PLAN.md §4.5). A paid feature that
 * runs on the server only (CLAUDE.md §6.5): the `server-only` import makes
 * `next build` fail if any client component imports this module, and the
 * engine's index does not re-export it.
 *
 * Each month scales the base occupancy and ADR by user-editable multipliers;
 * booked nights above the month's available nights are kept, with an
 * `availability_conflict` warning, never clamped.
 */

export interface SeasonalMultiplier {
  occupancy: Decimal.Value;
  adr: Decimal.Value;
}

export interface ProjectionInput {
  model: PerNightModel;
  startMonth: IsoMonth;
  /** Base occupancy (0–1) before multipliers. */
  baseOccupancy: Decimal.Value;
  /** Exactly 12, starting at `startMonth`. */
  multipliers: readonly SeasonalMultiplier[];
  /** Blocked nights per month, aligned with `multipliers` (0 when omitted). */
  blockedNights?: readonly number[];
  basis: ProfitBasis;
}

export interface ProjectedMonth {
  month: IsoMonth;
  nightsAvailable: Decimal;
  bookedNights: Decimal;
  occupancy: Decimal | null;
  adr: Decimal;
  pnl: ModelPnl;
  warnings: FinanceWarning[];
}

export interface Projection {
  months: ProjectedMonth[];
  totals: { grossRevenue: Decimal; netPayout: Decimal; profit: Decimal };
  basis: ProfitBasis;
}

export function projectTwelveMonths(input: ProjectionInput): Projection {
  if (input.multipliers.length !== 12) {
    throw new RangeError(`A projection needs 12 monthly multipliers, got ${input.multipliers.length}`);
  }
  let month = input.startMonth;
  const months: ProjectedMonth[] = input.multipliers.map((multiplier, i) => {
    const current = month;
    month = nextMonth(month);
    const available = new Decimal(daysInMonth(current) - (input.blockedNights?.[i] ?? 0));
    const booked = new Decimal(input.baseOccupancy).times(multiplier.occupancy).times(available);
    const adr = new Decimal(input.model.adr).times(multiplier.adr);
    const pnl = modelPnl({ ...input.model, adr }, booked, input.basis);
    const kpis = computeKpis({ nightsAvailable: available, bookedNights: booked, accommodationRevenue: pnl.accommodationRevenue });
    return { month: current, nightsAvailable: available, bookedNights: booked, occupancy: kpis.occupancy, adr, pnl, warnings: kpis.warnings };
  });
  return {
    months,
    totals: {
      grossRevenue: sumMoney(months.map((m) => m.pnl.grossRevenue)),
      netPayout: sumMoney(months.map((m) => m.pnl.netPayout)),
      profit: sumMoney(months.map((m) => m.pnl.profit)),
    },
    basis: input.basis,
  };
}
