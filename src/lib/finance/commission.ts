import Decimal from "decimal.js";
import { ZERO } from "./money";

/**
 * Commission bases (BUILD_PLAN.md §4.2). Only `managed_for_owner` units
 * carry a commission; owner-operated and rental-arbitrage units use
 * `none`. Returns the exact amount; a stored commission (statement
 * snapshot, monthly P&L line) is rounded half-up by the caller.
 */

export type PercentBasis = "gross_revenue" | "net_payout" | "noi";
export type CommissionBasis = "none" | PercentBasis | "fixed_monthly" | "hybrid";

export interface CommissionTerms {
  basis: CommissionBasis;
  /** c, as a fraction (0.20 = 20%). */
  rate: Decimal.Value;
  /** F, per month. */
  fixedFee: Decimal.Value;
  hybridMode: "sum" | "max";
  hybridBasis: PercentBasis;
  includeCleaningFees: boolean;
}

export const NO_COMMISSION: CommissionTerms = {
  basis: "none",
  rate: 0,
  fixedFee: 0,
  hybridMode: "sum",
  hybridBasis: "gross_revenue",
  includeCleaningFees: true,
};

/** The month's figures a commission can be based on, in the unit currency. */
export interface CommissionFigures {
  grossRevenue: Decimal.Value;
  cleaningFees: Decimal.Value;
  /** The part of the platform fees allocated to cleaning fees. */
  platformFeesOnCleaning: Decimal.Value;
  netPayout: Decimal.Value;
  /** Uses all unit opex, whoever bears it. */
  noi: Decimal.Value;
}

/**
 * - `gross_revenue`: gross, minus cleaning fees unless they are included.
 * - `net_payout`: net payout, minus (cleaning fees − platform fees on
 *   cleaning) unless they are included.
 * - `noi`: max(NOI, 0) — no commission on a loss.
 */
export function percentBase(basis: PercentBasis, figures: CommissionFigures, includeCleaningFees: boolean): Decimal {
  if (basis === "noi") return Decimal.max(figures.noi, ZERO);
  if (basis === "gross_revenue") {
    const gross = new Decimal(figures.grossRevenue);
    return includeCleaningFees ? gross : gross.minus(figures.cleaningFees);
  }
  const payout = new Decimal(figures.netPayout);
  return includeCleaningFees
    ? payout
    : payout.minus(new Decimal(figures.cleaningFees).minus(figures.platformFeesOnCleaning));
}

export function computeCommission(terms: CommissionTerms, figures: CommissionFigures): Decimal {
  const rate = new Decimal(terms.rate);
  const fixed = new Decimal(terms.fixedFee);
  switch (terms.basis) {
    case "none":
      return ZERO;
    case "fixed_monthly":
      return fixed;
    case "hybrid": {
      const percentPart = rate.times(percentBase(terms.hybridBasis, figures, terms.includeCleaningFees));
      return terms.hybridMode === "sum" ? fixed.plus(percentPart) : Decimal.max(fixed, percentPart);
    }
    default:
      return rate.times(percentBase(terms.basis, figures, terms.includeCleaningFees));
  }
}
