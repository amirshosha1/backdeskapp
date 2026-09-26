import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { HOME_COHOST_VIEW, HOME_OWNER_VIEW } from "@/demo/fixtures/home";
import { UNITS } from "@/demo/fixtures/units";
import { STATEMENT } from "@/demo/fixtures/statement";
import { CALCULATOR_RESULTS } from "@/demo/fixtures/calculator";

/**
 * Phase P fixtures carry no formulas (CLAUDE.md §6.1) but their totals are
 * still hand-checked here to whole-piastre precision, since several of
 * them (the two hero totals, the statement's derived lines) are sums that
 * BUILD_PLAN.md §4.6 does not itself state — see docs/PROGRESS.md and the
 * Phase P plan. Phase 1 re-derives all of this from the real engine.
 */
function sum(...amounts: string[]): Decimal {
  return amounts.reduce((total, amount) => total.plus(amount), new Decimal(0));
}

describe("home fixtures", () => {
  it("owner-view hero total is the sum of its units' net profit", () => {
    const expected = sum(
      ...UNITS.filter((u) => u.netProfit !== undefined).map((u) => u.netProfit!),
    );
    expect(new Decimal(HOME_OWNER_VIEW.heroTotal).equals(expected)).toBe(true);
  });

  it("co-host hero total is the sum of its breakdown lines", () => {
    const expected = sum(...HOME_COHOST_VIEW.lines.map((line) => line.amount));
    expect(new Decimal(HOME_COHOST_VIEW.heroTotal).equals(expected)).toBe(true);
  });

  it("owner-view occupancy matches the break-even booked nights over a 30-day month", () => {
    expect(HOME_OWNER_VIEW.breakEven.bookedNights / HOME_OWNER_VIEW.breakEven.availableNights).toBe(
      HOME_OWNER_VIEW.occupancy,
    );
  });

  it("the arbitrage unit has not reached break-even (booked < break-even nights)", () => {
    expect(HOME_OWNER_VIEW.breakEven.bookedNights).toBeLessThan(
      Number(HOME_OWNER_VIEW.breakEven.breakEvenNights),
    );
    expect(HOME_OWNER_VIEW.breakEven.reached).toBe(false);
  });
});

describe("owner statement fixture (BUILD_PLAN.md §4.6 Example A)", () => {
  it("net payout equals gross revenue plus platform fees", () => {
    const expected = sum(STATEMENT.grossRevenue, STATEMENT.platformFees);
    expect(new Decimal(STATEMENT.netPayout).equals(expected)).toBe(true);
  });

  it("owner-borne expense lines sum exactly to the stated total", () => {
    const expected = sum(...STATEMENT.ownerExpenses.map((line) => line.amount));
    expect(new Decimal(STATEMENT.ownerExpensesTotal).equals(expected)).toBe(true);
  });

  it("owner net equals net payout minus owner expenses minus commission", () => {
    const expected = sum(STATEMENT.netPayout, STATEMENT.ownerExpensesTotal, STATEMENT.commission);
    expect(new Decimal(STATEMENT.ownerNet).equals(expected)).toBe(true);
  });

  it("balance due carries the opening balance forward correctly", () => {
    const expected = sum(STATEMENT.openingBalance, STATEMENT.ownerNet, STATEMENT.ownerPayouts);
    expect(new Decimal(STATEMENT.balanceDue).equals(expected)).toBe(true);
  });

  it("commission matches the stated rate applied to net payout (cleaning included)", () => {
    const expected = new Decimal(STATEMENT.netPayout)
      .times(STATEMENT.commissionRate)
      .negated()
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    expect(new Decimal(STATEMENT.commission).equals(expected)).toBe(true);
  });
});

describe("calculator fixture (BUILD_PLAN.md §4.6 Example B)", () => {
  it("NOI equals gross revenue plus platform fees plus opex plus rent", () => {
    const expected = sum(
      CALCULATOR_RESULTS.grossRevenue,
      CALCULATOR_RESULTS.platformFees,
      CALCULATOR_RESULTS.opex,
      CALCULATOR_RESULTS.rent,
    );
    expect(new Decimal(CALCULATOR_RESULTS.noi).equals(expected)).toBe(true);
  });

  it("is not profitable at 60% occupancy, below its own break-even occupancy", () => {
    expect(CALCULATOR_RESULTS.isProfitable).toBe(false);
    expect(0.6).toBeLessThan(CALCULATOR_RESULTS.breakEvenOccupancy);
  });
});
