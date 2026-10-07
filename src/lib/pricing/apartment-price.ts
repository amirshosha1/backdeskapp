import Decimal from "decimal.js";

/**
 * Backdesk's own plan pricing (what a host pays us), not a host's financial
 * figure, so it lives outside `src/lib/finance/`. One plan price covers one
 * apartment; each extra apartment costs half of it, rounded up to a whole
 * pound.
 */

/** Half the plan price, rounded up to a whole pound: 249.00 → 125.00. */
export function extraApartmentPrice(planPrice: Decimal.Value): Decimal {
  return new Decimal(planPrice).div(2).toDecimalPlaces(0, Decimal.ROUND_CEIL);
}

/** The monthly total for `apartments` apartments: the plan price plus the extras. */
export function monthlyTotal(planPrice: Decimal.Value, apartments: number): Decimal {
  if (!Number.isInteger(apartments) || apartments < 1) {
    throw new RangeError(`apartments must be a whole number of at least 1, got ${apartments}`);
  }
  return new Decimal(planPrice).plus(extraApartmentPrice(planPrice).times(apartments - 1));
}

export interface ApartmentTotal {
  apartments: number;
  /** A money string with two decimals, e.g. "374.00". */
  total: string;
}

/** The totals listed under the plan: 2 apartments up to `maxApartments`. */
export function listedTotals(planPrice: Decimal.Value, maxApartments: number): ApartmentTotal[] {
  const totals: ApartmentTotal[] = [];
  for (let apartments = 2; apartments <= maxApartments; apartments++) {
    totals.push({ apartments, total: monthlyTotal(planPrice, apartments).toFixed(2) });
  }
  return totals;
}
