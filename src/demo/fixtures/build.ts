import {
  addDays,
  monthlyDepreciation,
  platformFeeFromRate,
  sumMoney,
  unitMonthPnl,
  type ExpenseLine,
  type IsoMonth,
  type StatementStay,
  type UnitMonthPnl,
} from "@/lib/finance";
import { CATEGORIES } from "@/demo/sample-data/categories";
import { SAMPLE_MONTHS, SAMPLE_PLATFORM_FEE_RATE, type SampleUnit } from "@/demo/sample-data/units";
import type { Localized } from "./types";

/**
 * Turns the raw sample inputs (src/demo/sample-data/) into the stays and
 * expense transactions a ledger would hold, and runs them through the
 * finance engine. Nothing here computes a financial figure itself: fees
 * come from `platformFeeFromRate`, totals from `unitMonthPnl` and friends.
 */

/** Payouts land the day after check-in, as Airbnb typically releases them. */
const PAYOUT_LAG_DAYS = 1;
/** Monthly bills (and the repairs allowance) are paid on the 5th. */
const MONTHLY_BILL_DAY = "05";

export function sampleStays(unit: SampleUnit): StatementStay[] {
  return unit.stays.map((stay) => ({
    checkIn: stay.checkIn,
    checkOut: addDays(stay.checkIn, stay.nights),
    accommodationRevenue: stay.accommodation,
    cleaningFee: unit.cleaningFeePerStay,
    otherFees: 0,
    platformFee: platformFeeFromRate(sumMoney([stay.accommodation, unit.cleaningFeePerStay]), SAMPLE_PLATFORM_FEE_RATE),
    currency: unit.currency,
    payoutDate: addDays(stay.checkIn, PAYOUT_LAG_DAYS),
  }));
}

export function sampleExpenses(unit: SampleUnit): ExpenseLine[] {
  const perStay = unit.stays.flatMap((stay) =>
    unit.perStayCosts.map((cost) => ({
      date: stay.checkIn,
      categoryId: cost.categoryId,
      costBehavior: CATEGORIES[cost.categoryId].costBehavior,
      amount: cost.amount,
      currency: unit.currency,
    })),
  );
  const monthly = SAMPLE_MONTHS.flatMap((month) =>
    unit.monthlyCosts.map((cost) => ({
      date: `${month}-${MONTHLY_BILL_DAY}`,
      categoryId: cost.categoryId,
      costBehavior: CATEGORIES[cost.categoryId].costBehavior,
      amount: cost.amount,
      currency: unit.currency,
    })),
  );
  return [...perStay, ...monthly];
}

/** One unit's month through the engine; sample data that fails validation is a bug, so it throws. */
export function samplePnl(unit: SampleUnit, month: IsoMonth): UnitMonthPnl {
  const result = unitMonthPnl({
    unitCurrency: unit.currency,
    month,
    availability: { blockedNights: 0 },
    stays: sampleStays(unit),
    expenses: sampleExpenses(unit),
    depreciation: monthlyDepreciation(unit.capex, month),
    commission: unit.commission,
    bearerRules: unit.bearerRules,
  });
  if (!result.ok) throw new Error(`Sample unit ${unit.id} (${month}): ${JSON.stringify(result.error)}`);
  return result.value;
}

/** "سبتمبر 2026" / "September 2026", from the month itself. */
export function monthLabel(month: IsoMonth): Localized {
  const date = new Date(`${month}-01T00:00:00Z`);
  const format = (locale: string) =>
    new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  return { ar: format("ar-EG-u-nu-latn"), en: format("en-GB") };
}
