import Decimal from "decimal.js";
import { computeCommission, type CommissionTerms } from "./commission";
import { ONE, ZERO } from "./money";

/**
 * The per-night monthly model (BUILD_PLAN.md §4.3). One function,
 * `modelPnl`, turns averages (ADR, average stay, per-stay and fixed costs)
 * into a month's P&L at any number of booked nights. The calculator's
 * displayed figures, the break-even solver, the sensitivity grid and the
 * projection all evaluate profit through it, so a break-even figure can
 * never use a different cost basis from the profit it sits next to (the
 * P.1.1 maintenance bug). Values are exact; round only for display.
 */

export interface PerNightModel {
  adr: Decimal.Value;
  /** avg_LOS: booked nights ÷ stays. Must be > 0. */
  avgLengthOfStay: Decimal.Value;
  cleaningFeePerStay: Decimal.Value;
  otherIncomePerStay: Decimal.Value;
  /** Platform fee as a fraction of gross revenue. */
  platformFeeRate: Decimal.Value;
  /** Σ per-stay costs (cleaning, consumables, …) per stay. */
  perStayCosts: Decimal.Value;
  perNightCosts: Decimal.Value;
  /** Fixed monthly costs, rent included, irregular costs excluded. */
  fixedCosts: Decimal.Value;
  /** The monthly maintenance/irregular allowance (repairs). */
  irregularCosts: Decimal.Value;
  /** Monthly depreciation of setup costs. */
  depreciation: Decimal.Value;
  commission: CommissionTerms;
}

/**
 * Which costs a profit figure — and the break-even next to it — covers.
 * Irregular costs are included by default (BUILD_PLAN.md §4.3, decided
 * 2026-09-28); depreciation has no default: every caller states it.
 */
export interface ProfitBasis {
  includeIrregular: boolean;
  includeDepreciation: boolean;
}

export interface ModelPnl {
  nights: Decimal;
  stays: Decimal;
  accommodationRevenue: Decimal;
  cleaningFees: Decimal;
  otherIncome: Decimal;
  grossRevenue: Decimal;
  platformFees: Decimal;
  platformFeesOnCleaning: Decimal;
  netPayout: Decimal;
  perStayCosts: Decimal;
  perNightCosts: Decimal;
  fixedCosts: Decimal;
  /** Zero when the basis excludes irregular costs. */
  irregularCosts: Decimal;
  opex: Decimal;
  noi: Decimal;
  commission: Decimal;
  /** NOI − commission. */
  profitBeforeDepreciation: Decimal;
  /** Zero when the basis excludes depreciation. */
  depreciation: Decimal;
  /** Profit on the requested basis: NOI − commission − depreciation (if included). */
  profit: Decimal;
}

export function modelPnl(model: PerNightModel, nights: Decimal.Value, basis: ProfitBasis): ModelPnl {
  const n = new Decimal(nights);
  const stays = n.dividedBy(model.avgLengthOfStay);
  const feeRate = new Decimal(model.platformFeeRate);

  const accommodationRevenue = n.times(model.adr);
  const cleaningFees = stays.times(model.cleaningFeePerStay);
  const otherIncome = stays.times(model.otherIncomePerStay);
  const grossRevenue = accommodationRevenue.plus(cleaningFees).plus(otherIncome);
  const platformFees = grossRevenue.times(feeRate);
  const platformFeesOnCleaning = cleaningFees.times(feeRate);
  const netPayout = grossRevenue.minus(platformFees);

  const perStayCosts = stays.times(model.perStayCosts);
  const perNightCosts = n.times(model.perNightCosts);
  const fixedCosts = new Decimal(model.fixedCosts);
  const irregularCosts = basis.includeIrregular ? new Decimal(model.irregularCosts) : ZERO;
  const opex = perStayCosts.plus(perNightCosts).plus(fixedCosts).plus(irregularCosts);
  const noi = netPayout.minus(opex);

  const commission = computeCommission(model.commission, {
    grossRevenue,
    cleaningFees,
    platformFeesOnCleaning,
    netPayout,
    noi,
  });
  const profitBeforeDepreciation = noi.minus(commission);
  const depreciation = basis.includeDepreciation ? new Decimal(model.depreciation) : ZERO;

  return {
    nights: n,
    stays,
    accommodationRevenue,
    cleaningFees,
    otherIncome,
    grossRevenue,
    platformFees,
    platformFeesOnCleaning,
    netPayout,
    perStayCosts,
    perNightCosts,
    fixedCosts,
    irregularCosts,
    opex,
    noi,
    commission,
    profitBeforeDepreciation,
    depreciation,
    profit: profitBeforeDepreciation.minus(depreciation),
  };
}

/**
 * `contribution_per_night = gross_per_night × (1 − fee_rate) − var_per_night`
 * (before commission), where gross per night includes the cleaning fee and
 * other income spread over the average stay.
 */
export function contributionPerNight(model: PerNightModel): Decimal {
  const los = new Decimal(model.avgLengthOfStay);
  const grossPerNight = new Decimal(model.adr).plus(
    new Decimal(model.cleaningFeePerStay).plus(model.otherIncomePerStay).dividedBy(los),
  );
  const varPerNight = new Decimal(model.perStayCosts).dividedBy(los).plus(model.perNightCosts);
  return grossPerNight.times(ONE.minus(model.platformFeeRate)).minus(varPerNight);
}
