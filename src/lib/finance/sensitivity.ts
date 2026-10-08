import Decimal from "decimal.js";
import { modelPnl, type PerNightModel, type ProfitBasis } from "./model";
import { ONE, ZERO } from "./money";

/**
 * Sensitivity grid: occupancy × ADR (BUILD_PLAN.md §2 and Phase 2: the
 * full 7 × 7 grid is part of the Free calculator since 2026-10-07; 3 × 3
 * stays available as a compact size).
 * Each cell is the profit on the caller's basis, from `modelPnl`. The
 * occupancy axis is kept inside [0, 100%]: these are hypothetical axis
 * values, not data, so nothing is being hidden by bounding them.
 */

export interface SensitivityAxes {
  /** Cells per side (odd, so the base case sits in the middle): 3 or 7. */
  size: number;
  /** Occupancy step between rows, as a fraction (0.10 = 10 points). */
  occupancyStep: Decimal.Value;
  /** ADR step between columns, as a fraction of the base ADR (0.10 = 10%). */
  adrStep: Decimal.Value;
}

export const GRID_3X3: SensitivityAxes = { size: 3, occupancyStep: "0.10", adrStep: "0.10" };
export const GRID_7X7: SensitivityAxes = { size: 7, occupancyStep: "0.05", adrStep: "0.05" };

export interface SensitivityGrid {
  occupancies: Decimal[];
  adrs: Decimal[];
  /** profits[row][column]: row = occupancy, column = ADR. */
  profits: Decimal[][];
  basis: ProfitBasis;
}

export function sensitivityGrid(
  model: PerNightModel,
  nightsAvailable: Decimal.Value,
  base: { occupancy: Decimal.Value; adr: Decimal.Value },
  axes: SensitivityAxes,
  basis: ProfitBasis,
): SensitivityGrid {
  if (!Number.isInteger(axes.size) || axes.size < 1 || axes.size % 2 === 0) {
    throw new RangeError(`Grid size must be a positive odd number, got ${axes.size}`);
  }
  const half = (axes.size - 1) / 2;
  const offsets = Array.from({ length: axes.size }, (_, i) => i - half);
  const occupancies = offsets.map((k) =>
    Decimal.min(Decimal.max(new Decimal(base.occupancy).plus(new Decimal(axes.occupancyStep).times(k)), ZERO), ONE),
  );
  const adrs = offsets.map((k) => Decimal.max(new Decimal(base.adr).times(ONE.plus(new Decimal(axes.adrStep).times(k))), ZERO));
  const available = new Decimal(nightsAvailable);
  const profits = occupancies.map((occupancy) =>
    adrs.map((adr) => modelPnl({ ...model, adr }, occupancy.times(available), basis).profit),
  );
  return { occupancies, adrs, profits, basis };
}
