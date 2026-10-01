import Decimal from "decimal.js";
import { breakEvenNights, type BreakEvenResult } from "./breakeven";
import { NO_COMMISSION, type CommissionTerms } from "./commission";
import { cashOnCash, paybackMonths, straightLineMonthly, totalCashInvested } from "./investment";
import { computeKpis, displayOccupancy, type Kpis } from "./kpis";
import { contributionPerNight, modelPnl, type ModelPnl, type PerNightModel, type ProfitBasis } from "./model";
import { sumMoney } from "./money";
import type { OperatingModel } from "./org-profit";
import { generateVerdict, type Verdict } from "./verdict";
import { ENGINE_VERSION } from "./version";

/**
 * The feasibility calculator (BUILD_PLAN.md §4.3, §4.5): one month of a
 * unit from averages, not from stays. Runs in the browser (CLAUDE.md
 * §6.5); the 12-month projection is server-only and lives elsewhere.
 *
 * Cost bases, stated once here and labelled in the UI:
 * - The headline is profit **before depreciation** (NOI − commission;
 *   NOI includes the maintenance/irregular allowance). The primary
 *   break-even and the verdict use exactly that basis.
 * - `excludingIrregular` is the per-scenario toggle (Example B2), labelled.
 * - `includingDepreciation` is the break-even of the net profit after
 *   depreciation, shown next to that net profit.
 */

export interface CostLine {
  id: string;
  amount: Decimal.Value;
}

export interface ScenarioInput {
  operatingModel: OperatingModel;
  daysInPeriod: number;
  blockedNights: number;
  bookedNights: Decimal.Value;
  adr: Decimal.Value;
  avgLengthOfStay: Decimal.Value;
  cleaningFeePerStay: Decimal.Value;
  platformFeeRate: Decimal.Value;
  /** Rental arbitrage only; 0 otherwise. A fixed cost. */
  rent: Decimal.Value;
  fixedCosts: readonly CostLine[];
  perStayCosts: readonly CostLine[];
  perNightCosts: readonly CostLine[];
  /** The maintenance/irregular allowance (repairs). */
  irregularCosts: readonly CostLine[];
  setupCost: Decimal.Value;
  usefulLifeMonths: number;
  /** Rental arbitrage only; 0 otherwise. */
  deposit: Decimal.Value;
  /** Managed units only; `none` otherwise. */
  commission: CommissionTerms;
}

export const BASIS_BEFORE_DEPRECIATION: ProfitBasis = { includeIrregular: true, includeDepreciation: false };
export const BASIS_EXCLUDING_IRREGULAR: ProfitBasis = { includeIrregular: false, includeDepreciation: false };
export const BASIS_AFTER_DEPRECIATION: ProfitBasis = { includeIrregular: true, includeDepreciation: true };

export interface ScenarioResult {
  engineVersion: string;
  nightsAvailable: Decimal;
  kpis: Kpis;
  /** At the booked nights, with every cost including depreciation. */
  pnl: ModelPnl;
  rent: Decimal;
  /** Operating expenses other than rent. */
  opexExcludingRent: Decimal;
  /** The headline: NOI − commission. */
  profitBeforeDepreciation: Decimal;
  depreciation: Decimal;
  /** Profit before depreciation − depreciation. */
  netProfit: Decimal;
  contributionPerNight: Decimal;
  breakEven: {
    primary: BreakEvenResult;
    excludingIrregular: BreakEvenResult;
    includingDepreciation: BreakEvenResult;
  };
  investment: {
    totalCashInvested: Decimal;
    /** Months to recover the cash invested from profit before depreciation (cash flow). */
    paybackMonths: Decimal | null;
    cashOnCash: Decimal | null;
  };
  verdict: Verdict;
}

const sumLines = (lines: readonly CostLine[]) => sumMoney(lines.map((l) => l.amount));

export function scenarioModel(input: ScenarioInput): PerNightModel {
  return {
    adr: input.adr,
    avgLengthOfStay: input.avgLengthOfStay,
    cleaningFeePerStay: input.cleaningFeePerStay,
    otherIncomePerStay: 0,
    platformFeeRate: input.platformFeeRate,
    perStayCosts: sumLines(input.perStayCosts),
    perNightCosts: sumLines(input.perNightCosts),
    fixedCosts: sumLines(input.fixedCosts).plus(input.rent),
    irregularCosts: sumLines(input.irregularCosts),
    depreciation: straightLineMonthly(input.setupCost, 0, input.usefulLifeMonths),
    commission: input.operatingModel === "managed_for_owner" ? input.commission : NO_COMMISSION,
  };
}

export function computeScenario(input: ScenarioInput): ScenarioResult {
  const model = scenarioModel(input);
  const available = new Decimal(input.daysInPeriod - input.blockedNights);
  const pnl = modelPnl(model, input.bookedNights, BASIS_AFTER_DEPRECIATION);
  const kpis = computeKpis({
    nightsAvailable: available,
    bookedNights: input.bookedNights,
    accommodationRevenue: pnl.accommodationRevenue,
  });
  const primary = breakEvenNights(model, available, BASIS_BEFORE_DEPRECIATION);
  const invested = totalCashInvested({ capex: input.setupCost, deposits: input.deposit, preOpeningCosts: 0 });
  const rent = new Decimal(input.rent);

  return {
    engineVersion: ENGINE_VERSION,
    nightsAvailable: available,
    kpis,
    pnl,
    rent,
    opexExcludingRent: pnl.opex.minus(rent),
    profitBeforeDepreciation: pnl.profitBeforeDepreciation,
    depreciation: pnl.depreciation,
    netProfit: pnl.profit,
    contributionPerNight: contributionPerNight(model),
    breakEven: {
      primary,
      excludingIrregular: breakEvenNights(model, available, BASIS_EXCLUDING_IRREGULAR),
      includingDepreciation: breakEvenNights(model, available, BASIS_AFTER_DEPRECIATION),
    },
    investment: {
      totalCashInvested: invested,
      paybackMonths: paybackMonths(invested, pnl.profitBeforeDepreciation),
      cashOnCash: cashOnCash(invested, pnl.profitBeforeDepreciation.times(12)),
    },
    verdict: generateVerdict({
      profit: pnl.profitBeforeDepreciation,
      occupancy: displayOccupancy(kpis.occupancy),
      breakEven: primary,
    }),
  };
}
