import Decimal from "decimal.js";
import { allocateProportionally, splitEvenly, ZERO } from "./money";
import { err, ok, type Result } from "./result";
import { ENGINE_VERSION } from "./version";

/**
 * Periods, availability and revenue recognition (BUILD_PLAN.md §4.1, §4.4).
 *
 * Dates are calendar dates ("YYYY-MM-DD") and months are "YYYY-MM". There
 * is no time of day and no time-zone arithmetic here: the org's time zone
 * (CLAUDE.md §6.11) only decides what "today" is, before a date reaches the
 * engine. UTC is used internally purely as a calendar.
 */

export type IsoDate = string;
export type IsoMonth = string;

const DAY_MS = 86_400_000;

function toUtcMs(date: IsoDate): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function monthOf(date: IsoDate): IsoMonth {
  return date.slice(0, 7);
}

export function firstDayOf(month: IsoMonth): IsoDate {
  return `${month}-01`;
}

export function daysInMonth(month: IsoMonth): number {
  const [y, m] = month.split("-").map(Number) as [number, number];
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function nextMonth(month: IsoMonth): IsoMonth {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return fromUtcMs(Date.UTC(y, m, 1)).slice(0, 7);
}

export function previousMonth(month: IsoMonth): IsoMonth {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return fromUtcMs(Date.UTC(y, m - 2, 1)).slice(0, 7);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** Nights between check-in and check-out (check-out day excluded). */
export function nightsBetween(checkIn: IsoDate, checkOut: IsoDate): number {
  return Math.round((toUtcMs(checkOut) - toUtcMs(checkIn)) / DAY_MS);
}

export interface AvailabilityInput {
  month: IsoMonth;
  /** Entered by hand per unit per month (`unit_month_settings`); there is no calendar. */
  blockedNights: number;
  /** Nights are counted from this date when it falls inside the month. */
  goLiveDate?: IsoDate | null;
}

/**
 * `nights_available = days_in_period − blocked_nights`, counted from the
 * go-live date when it falls mid-period (0 before go-live). Blocked nights
 * above the nights counted are rejected rather than clamped.
 */
export function nightsAvailable(input: AvailabilityInput): Result<number> {
  const days = daysInMonth(input.month);
  let counted = days;
  if (input.goLiveDate) {
    const goLiveMonth = monthOf(input.goLiveDate);
    if (goLiveMonth > input.month) counted = 0;
    else if (goLiveMonth === input.month) counted = days - Number(input.goLiveDate.slice(8, 10)) + 1;
  }
  if (input.blockedNights > counted) {
    return err({
      code: "blocked_exceeds_days",
      month: input.month,
      blockedNights: input.blockedNights,
      days: counted,
    });
  }
  return ok(counted - input.blockedNights);
}

/** A stay's financial summary, already in the unit currency (no guest data — CLAUDE.md §2). */
export interface StayInput {
  checkIn: IsoDate;
  checkOut: IsoDate;
  accommodationRevenue: Decimal.Value;
  cleaningFee: Decimal.Value;
  otherFees: Decimal.Value;
  platformFee: Decimal.Value;
}

/** One row of `stay_month_allocations`, computed by the engine and stored so SQL only aggregates. */
export interface StayMonthAllocation {
  month: IsoMonth;
  nights: number;
  accommodationRevenue: Decimal;
  cleaningFee: Decimal;
  otherFees: Decimal;
  platformFee: Decimal;
  /** The part of `platformFee` allocated to the cleaning fee (for commission bases that exclude cleaning). */
  platformFeeOnCleaning: Decimal;
  engineVersion: string;
}

/**
 * Accrual by night (§4.4): accommodation revenue and its share of the
 * platform fee are prorated by night (leftover cents on the last night);
 * the cleaning fee, other fees and their fee shares are recognized on the
 * check-in date. The platform fee is first allocated to the components in
 * proportion to their size (`fees.ts` uses the same rule).
 */
export function allocateStayByMonth(stay: StayInput): StayMonthAllocation[] {
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  if (nights < 1) throw new RangeError("A stay needs at least one night (check-out after check-in)");

  const [feeAccommodation, feeCleaning, feeOther] = allocateProportionally(stay.platformFee, [
    stay.accommodationRevenue,
    stay.cleaningFee,
    stay.otherFees,
  ]) as [Decimal, Decimal, Decimal];
  const nightlyRevenue = splitEvenly(stay.accommodationRevenue, nights);
  const nightlyFee = splitEvenly(feeAccommodation, nights);

  const byMonth = new Map<IsoMonth, StayMonthAllocation>();
  for (let i = 0; i < nights; i++) {
    const month = monthOf(addDays(stay.checkIn, i));
    let row = byMonth.get(month);
    if (!row) {
      row = {
        month,
        nights: 0,
        accommodationRevenue: ZERO,
        cleaningFee: ZERO,
        otherFees: ZERO,
        platformFee: ZERO,
        platformFeeOnCleaning: ZERO,
        engineVersion: ENGINE_VERSION,
      };
      byMonth.set(month, row);
    }
    row.nights += 1;
    row.accommodationRevenue = row.accommodationRevenue.plus(nightlyRevenue[i]!);
    row.platformFee = row.platformFee.plus(nightlyFee[i]!);
  }

  const checkInRow = byMonth.get(monthOf(stay.checkIn))!;
  checkInRow.cleaningFee = new Decimal(stay.cleaningFee);
  checkInRow.otherFees = new Decimal(stay.otherFees);
  checkInRow.platformFee = checkInRow.platformFee.plus(feeCleaning).plus(feeOther);
  checkInRow.platformFeeOnCleaning = feeCleaning;

  return [...byMonth.values()];
}

/** The first open month at or after `month` (§4.4 "Locked months"). */
export function postingMonth(month: IsoMonth, lockedMonths: ReadonlySet<IsoMonth>): IsoMonth {
  let candidate = month;
  while (lockedMonths.has(candidate)) candidate = nextMonth(candidate);
  return candidate;
}

/**
 * Anything dated inside a locked month is posted to the first day of the
 * first open month after it; `occurredOn` keeps the original date
 * (CLAUDE.md §6.8).
 */
export function postingDate(
  date: IsoDate,
  lockedMonths: ReadonlySet<IsoMonth>,
): { date: IsoDate; occurredOn: IsoDate } {
  const month = monthOf(date);
  const posted = postingMonth(month, lockedMonths);
  return { date: posted === month ? date : firstDayOf(posted), occurredOn: date };
}

/**
 * Re-posts allocations that fall in a locked month (a stay crossing into a
 * month whose statement is already finalized) to the next open month,
 * keeping the month they belong to in `occurredMonth`.
 */
export function postAllocations(
  allocations: readonly StayMonthAllocation[],
  lockedMonths: ReadonlySet<IsoMonth>,
): (StayMonthAllocation & { occurredMonth: IsoMonth })[] {
  return allocations.map((row) => ({
    ...row,
    month: postingMonth(row.month, lockedMonths),
    occurredMonth: row.month,
  }));
}
