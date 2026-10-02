import Decimal from "decimal.js";
import { allocateProportionally, roundMoney } from "./money";

/**
 * Platform fees (BUILD_PLAN.md §4.1). Imported stays carry the actual fee;
 * a manual entry derives it as `gross × fee_rate` (rounded half-up to
 * piastres, since it is a stored amount). Either way the fee is allocated
 * to accommodation, cleaning and other income in proportion to each
 * component, with the leftover cent on the last non-zero component, so the
 * allocation always sums exactly to the fee.
 */

export interface RevenueComponents {
  accommodation: Decimal.Value;
  cleaning: Decimal.Value;
  other: Decimal.Value;
}

export interface FeeAllocation {
  accommodation: Decimal;
  cleaning: Decimal;
  other: Decimal;
}

export function platformFeeFromRate(grossRevenue: Decimal.Value, feeRate: Decimal.Value): Decimal {
  return roundMoney(new Decimal(grossRevenue).times(feeRate));
}

export function allocatePlatformFee(fee: Decimal.Value, components: RevenueComponents): FeeAllocation {
  const [accommodation, cleaning, other] = allocateProportionally(fee, [
    components.accommodation,
    components.cleaning,
    components.other,
  ]) as [Decimal, Decimal, Decimal];
  return { accommodation, cleaning, other };
}
