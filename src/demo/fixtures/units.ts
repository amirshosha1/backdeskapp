import { displayOccupancy, sumMoney, toMoneyString, type UnitMonthPnl } from "@/lib/finance";
import { PREVIOUS_MONTH, SAMPLE_MONTH, SAMPLE_OVERHEAD, SAMPLE_UNITS, type SampleUnit } from "@/demo/sample-data/units";
import { samplePnl } from "./build";
import type { UnitFixture } from "./types";

/**
 * The `/demo` units for September 2026, every figure computed by the
 * finance engine from the raw sample inputs (src/demo/sample-data/units.ts).
 * Owner-run units show net profit (after the SAMPLE setup-cost
 * depreciation); managed units show manager profit (commission − the
 * costs the manager bears).
 */

export interface UnitResult {
  unit: SampleUnit;
  pnl: UnitMonthPnl;
  previous: UnitMonthPnl;
}

export const UNIT_RESULTS: UnitResult[] = SAMPLE_UNITS.map((unit) => ({
  unit,
  pnl: samplePnl(unit, SAMPLE_MONTH),
  previous: samplePnl(unit, PREVIOUS_MONTH),
}));

export function toUnitFixture({ unit, pnl }: UnitResult): UnitFixture {
  const isManaged = unit.operatingModel === "managed_for_owner";
  return {
    id: unit.id,
    name: unit.name,
    area: unit.area,
    operatingModel: unit.operatingModel,
    currency: unit.currency,
    occupancy: displayOccupancy(pnl.kpis.occupancy)?.toNumber() ?? 0,
    availabilityConflict: pnl.kpis.warnings.some((w) => w.code === "availability_conflict"),
    adr: toMoneyString(pnl.kpis.adr ?? 0),
    revpar: toMoneyString(pnl.kpis.revpar ?? 0),
    ...(isManaged
      ? {
          managerProfit: toMoneyString(pnl.managerProfit),
          owner: unit.owner,
          commissionBasis: unit.commissionBasis,
          hasStatement: unit.hasStatement ?? false,
        }
      : { netProfit: toMoneyString(pnl.netProfit) }),
  };
}

export const UNITS: UnitFixture[] = UNIT_RESULTS.map(toUnitFixture);

/** The month's portfolio-level overhead, shown as a cost (negative). */
export const PORTFOLIO_OVERHEAD = toMoneyString(sumMoney(SAMPLE_OVERHEAD.map((line) => line.amount)).negated());
