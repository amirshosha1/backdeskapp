import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { HOME_COHOST_VIEW, HOME_OWNER_VIEW } from "@/demo/fixtures/home";
import { UNITS, PORTFOLIO_OVERHEAD } from "@/demo/fixtures/units";
import { STATEMENT } from "@/demo/fixtures/statement";
import { CALCULATOR_RESULTS } from "@/demo/fixtures/calculator";
import { EXPENSE_BREAKDOWN } from "@/demo/fixtures/expense";

/**
 * Phase P fixtures carry no formulas (CLAUDE.md §6.1), but several of their
 * figures are hand-derived sums or ratios that BUILD_PLAN.md §4.6 does not
 * state. They are checked here to whole-piastre precision so the demo never
 * shows numbers that don't add up. Phase 1 re-derives all of it from the
 * real engine.
 */
function sum(...amounts: string[]): Decimal {
  return amounts.reduce((total, amount) => total.plus(amount), new Decimal(0));
}

describe("home fixtures", () => {
  it("owner-view hero total is the sum of its units' net profit", () => {
    const expected = sum(...HOME_OWNER_VIEW.units.map((u) => u.netProfit!));
    expect(new Decimal(HOME_OWNER_VIEW.heroTotal).equals(expected)).toBe(true);
  });

  it("co-host hero total is managers' profit minus portfolio overhead", () => {
    const expected = sum(...HOME_COHOST_VIEW.units.map((u) => u.managerProfit!), PORTFOLIO_OVERHEAD);
    expect(new Decimal(HOME_COHOST_VIEW.heroTotal).equals(expected)).toBe(true);
  });

  it("owner view carries only owner-run units; co-host view only managed ones", () => {
    expect(HOME_OWNER_VIEW.units.every((u) => u.operatingModel !== "managed_for_owner")).toBe(true);
    expect(HOME_COHOST_VIEW.units.every((u) => u.operatingModel === "managed_for_owner")).toBe(true);
    expect(HOME_OWNER_VIEW.units.length + HOME_COHOST_VIEW.units.length).toBe(UNITS.length);
  });

  it("break-even display values agree with booked and break-even nights", () => {
    const be = HOME_OWNER_VIEW.breakEven;
    // A fractional night doesn't clear break-even, so the whole-night target
    // rounds up (BUILD_PLAN.md §4.3), not to the nearest night.
    const target = new Decimal(be.breakEvenNights).toDecimalPlaces(0, Decimal.ROUND_UP).toNumber();
    expect(be.targetNights).toBe(target);
    expect(be.nightsShort).toBe(target - be.bookedNights);
    expect(be.progress).toBeCloseTo(be.bookedNights / Number(be.breakEvenNights), 3);
    expect(be.reached).toBe(be.bookedNights >= Number(be.breakEvenNights));
    expect(be.bookedNights / be.availableNights).toBe(HOME_OWNER_VIEW.occupancy);
  });

  it("home's top expenses are the three largest categories of the breakdown", () => {
    const topThree = [...EXPENSE_BREAKDOWN.categories]
      .sort((a, b) => new Decimal(b.amount).comparedTo(a.amount))
      .slice(0, 3);
    expect(HOME_OWNER_VIEW.topExpenses).toEqual(topThree);
  });
});

describe("expense breakdown fixture", () => {
  it("categories sum exactly to the month's total", () => {
    const expected = sum(...EXPENSE_BREAKDOWN.categories.map((c) => c.amount));
    expect(new Decimal(EXPENSE_BREAKDOWN.total).equals(expected)).toBe(true);
  });

  it("the month's total is both owner units' opex plus the arbitrage rent (§4.6 A and B)", () => {
    expect(new Decimal(EXPENSE_BREAKDOWN.total).equals(sum("7900.00", "7900.00", "35000.00"))).toBe(true);
  });

  it("bubbles cover the same total, with the tail folded into one 'other' bubble", () => {
    const expected = sum(...EXPENSE_BREAKDOWN.bubbles.map((b) => b.amount));
    expect(new Decimal(EXPENSE_BREAKDOWN.total).equals(expected)).toBe(true);
    expect(EXPENSE_BREAKDOWN.bubbles.filter((b) => b.id === "other")).toHaveLength(1);
  });

  it("every share matches its amount to a tenth of a percent", () => {
    for (const item of [...EXPENSE_BREAKDOWN.categories, ...EXPENSE_BREAKDOWN.bubbles]) {
      const exact = new Decimal(item.amount).dividedBy(EXPENSE_BREAKDOWN.total).toNumber();
      expect(Math.abs(item.share - exact), item.id).toBeLessThan(0.0005);
    }
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

  it("is not profitable at its occupancy, which is below its break-even occupancy", () => {
    expect(CALCULATOR_RESULTS.isProfitable).toBe(false);
    expect(CALCULATOR_RESULTS.occupancy).toBeLessThan(CALCULATOR_RESULTS.breakEvenOccupancy);
  });
});
