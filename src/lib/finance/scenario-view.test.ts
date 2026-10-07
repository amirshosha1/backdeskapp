// @vitest-environment node
import Decimal from "decimal.js";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  computeScenario,
  NO_COMMISSION,
  roundMoney,
  scenarioView,
  unitMonthPnl,
  type CommissionTerms,
  type ScenarioInput,
} from "@/lib/finance";

/**
 * The calculator's view of a scenario (P.2 slice 1): rows that reconcile as
 * displayed, the uncapped after-depreciation break-even, and the sentence
 * case. Example B is §4.6's rental-arbitrage example with the calculator
 * preset's SAMPLE setup cost (250,000 over 60 months).
 */

const EXAMPLE_B: ScenarioInput = {
  operatingModel: "rental_arbitrage",
  daysInPeriod: 30,
  blockedNights: 0,
  bookedNights: 18,
  adr: 2500,
  avgLengthOfStay: 3,
  cleaningFeePerStay: 400,
  platformFeeRate: "0.155",
  rent: 35000,
  fixedCosts: [
    { id: "utilities", amount: 2500 },
    { id: "internet", amount: 600 },
    { id: "compound", amount: 1000 },
  ],
  perStayCosts: [
    { id: "cleaning", amount: 350 },
    { id: "consumables", amount: 150 },
  ],
  perNightCosts: [],
  irregularCosts: [{ id: "repairs", amount: 800 }],
  setupCost: 250000,
  usefulLifeMonths: 60,
  deposit: 70000,
  commission: NO_COMMISSION,
};

const MANAGED_20_NET_PAYOUT: CommissionTerms = {
  basis: "net_payout",
  rate: "0.2",
  fixedFee: 0,
  hybridMode: "max",
  hybridBasis: "gross_revenue",
  includeCleaningFees: true,
};

const EXAMPLE_A: ScenarioInput = { ...EXAMPLE_B, operatingModel: "managed_for_owner", rent: 0, deposit: 0, commission: MANAGED_20_NET_PAYOUT };

const money = (d: Decimal | null) => (d === null ? null : d.toFixed(2));

describe("scenarioView — Example B (rental arbitrage, 18 of 30 nights)", () => {
  const view = scenarioView(EXAMPLE_B);

  it("headline is the net after depreciation; the summary rows add up as displayed", () => {
    expect(money(view.netAfterDepreciation)).toBe("-7013.67");
    expect(money(view.revenue)).toBe("47400.00");
    expect(money(view.totalCostsWithDepreciation)).toBe("54413.67");
    expect(view.revenue.minus(view.totalCostsWithDepreciation).equals(view.netAfterDepreciation)).toBe(true);
    expect(view.outcome).toBe("loss");
  });

  it("section totals match the engine's lines and reconcile to profit before depreciation and net", () => {
    const s = view.sections;
    expect([s.revenue, s.platformFees, s.operatingExpenses, s.rent, s.profitBeforeDepreciation, s.depreciation].map(money)).toEqual([
      "47400.00",
      "7347.00",
      "7900.00",
      "35000.00",
      "-2847.00",
      "4166.67",
    ]);
    expect(s.managementCommission).toBeNull();
  });

  it("break-even after depreciation: 21.41 nights inside the month, 22 whole nights, 4 short", () => {
    expect(view.breakEven).toMatchObject({ status: "within_month", wholeNights: 22 });
    expect(view.breakEven.status !== "no_break_even" && view.breakEven.nights.toFixed(2)).toBe("21.41");
    expect(view.sentence).toMatchObject({ kind: "short", nightsShort: 4 });
    expect(view.managerProfit).toBeNull();
  });

  it("at 21 nights it still loses and is 1 night short; at 22 it is at the first profitable night", () => {
    const at21 = scenarioView({ ...EXAMPLE_B, bookedNights: 21 });
    expect(money(at21.netAfterDepreciation)).toBe("-838.17");
    expect(at21.sentence).toMatchObject({ kind: "short", nightsShort: 1 });

    const at22 = scenarioView({ ...EXAMPLE_B, bookedNights: 22 });
    expect(at22.outcome).toBe("profit");
    expect(at22.sentence).toMatchObject({ kind: "at_first_profitable_night", wholeNights: 22 });

    const at25 = scenarioView({ ...EXAMPLE_B, bookedNights: 25 });
    expect(at25.sentence).toMatchObject({ kind: "above", nightsAbove: 3 });
  });
});

describe("scenarioView — Example A (managed, 20% of net payout)", () => {
  const view = scenarioView(EXAMPLE_A);

  it("the owner's net after depreciation is the headline; manager profit is the commission", () => {
    expect(money(view.netAfterDepreciation)).toBe("19975.73");
    expect(money(view.sections.managementCommission)).toBe("8010.60");
    expect(money(view.managerProfit)).toBe("8010.60");
    expect(view.sections.rent).toBeNull();
    expect(view.breakEven.status !== "no_break_even" && view.breakEven.nights.toFixed(2)).toBe("5.62");
    expect(view.sentence).toMatchObject({ kind: "above", nightsAbove: 12 });
  });

  it("manager profit matches the ledger engine for the same month with no manager-borne costs", () => {
    // Downtown Cairo, §4.6 Example A: 6 stays of 3 nights at 2,500 + 400 cleaning, 20% of net payout.
    const stays = Array.from({ length: 6 }, (_, i) => ({
      checkIn: `2026-09-${String(1 + i * 5).padStart(2, "0")}`,
      checkOut: `2026-09-${String(4 + i * 5).padStart(2, "0")}`,
      accommodationRevenue: 7500,
      cleaningFee: 400,
      otherFees: 0,
      platformFee: "1224.50",
      currency: "EGP" as const,
      payoutDate: `2026-09-${String(2 + i * 5).padStart(2, "0")}`,
    }));
    const ledger = unitMonthPnl({
      unitCurrency: "EGP",
      month: "2026-09",
      availability: { blockedNights: 0 },
      stays,
      expenses: [],
      depreciation: 0,
      commission: MANAGED_20_NET_PAYOUT,
      bearerRules: {},
    });
    expect(ledger.ok && ledger.value.managerProfit.toFixed(2)).toBe("8010.60");
  });
});

describe("scenarioView — break-even status and sentence edge cases", () => {
  it("beyond the month: rent 60,000 needs 33.55 nights, more than the 30 available", () => {
    const view = scenarioView({ ...EXAMPLE_B, rent: 60000 });
    expect(view.breakEven).toMatchObject({ status: "beyond_available_nights", wholeNights: 34 });
    expect(view.breakEven.status !== "no_break_even" && view.breakEven.nights.toFixed(2)).toBe("33.55");
    expect(view.sentence.kind).toBe("beyond_month");
    // The capped engine result stays as it was.
    expect(computeScenario({ ...EXAMPLE_B, rent: 60000 }).breakEven.includingDepreciation).toMatchObject({
      kind: "unreachable",
      reason: "exceeds_available_nights",
    });
  });

  it("no break-even when a night earns nothing: ADR and cleaning fee 0", () => {
    const view = scenarioView({ ...EXAMPLE_B, adr: 0, cleaningFeePerStay: 0 });
    expect(view.breakEven.status).toBe("no_break_even");
    expect(view.sentence.kind).toBe("no_break_even");
  });

  it("no break-even when the per-night contribution is negative, even with no fixed costs (root at 0 nights)", () => {
    const input: ScenarioInput = {
      ...EXAMPLE_B,
      operatingModel: "owner_operated",
      rent: 0,
      deposit: 0,
      adr: 100,
      cleaningFeePerStay: 0,
      fixedCosts: [],
      irregularCosts: [],
      setupCost: 0,
    };
    expect(computeScenario(input).breakEven.includingDepreciation.kind).toBe("reached");
    expect(scenarioView(input).breakEven.status).toBe("no_break_even");
    // With no available nights, the wider search meets the same falling line.
    expect(scenarioView({ ...input, blockedNights: 30 }).breakEven.status).toBe("no_break_even");
  });

  it("no available nights: its own sentence, while the uncapped break-even is still known", () => {
    const view = scenarioView({ ...EXAMPLE_B, blockedNights: 30 });
    expect(view.sentence.kind).toBe("no_available_nights");
    expect(view.breakEven.status).toBe("beyond_available_nights");
  });

  it("no available nights and no break-even at all", () => {
    expect(scenarioView({ ...EXAMPLE_B, blockedNights: 30, adr: 0, cleaningFeePerStay: 0 }).breakEven.status).toBe("no_break_even");
  });

  it("booked above the available nights (a data conflict): the sentence follows the profit, not the capped search", () => {
    const view = scenarioView({ ...EXAMPLE_B, blockedNights: 10, bookedNights: 25 });
    expect(view.outcome).toBe("profit");
    expect(view.breakEven.status).toBe("beyond_available_nights");
    expect(view.sentence).toMatchObject({ kind: "above", nightsAbove: 3 });
  });
});

// ---------------------------------------------------------------- properties

const RUNS = { numRuns: 300 };
const cents = (min: number, max: number) => fc.integer({ min, max }).map((c) => new Decimal(c).dividedBy(100));
const rate = (maxBasisPoints: number) => fc.integer({ min: 0, max: maxBasisPoints }).map((bp) => new Decimal(bp).dividedBy(10_000));

const commissionTerms: fc.Arbitrary<CommissionTerms> = fc.record({
  basis: fc.constantFrom("gross_revenue", "net_payout", "noi", "fixed_monthly", "hybrid"),
  rate: rate(5000),
  fixedFee: cents(0, 3_000_000),
  hybridMode: fc.constantFrom("sum", "max"),
  hybridBasis: fc.constantFrom("gross_revenue", "net_payout", "noi"),
  includeCleaningFees: fc.boolean(),
});

const scenarioInput: fc.Arbitrary<ScenarioInput> = fc
  .record({
    operatingModel: fc.constantFrom("owner_operated", "rental_arbitrage", "managed_for_owner"),
    blockedNights: fc.integer({ min: 0, max: 30 }),
    bookedNights: fc.integer({ min: 0, max: 35 }),
    adr: cents(0, 2_000_000),
    avgLengthOfStay: fc.integer({ min: 10, max: 60 }).map((t) => new Decimal(t).dividedBy(10)),
    cleaningFeePerStay: cents(0, 100_000),
    platformFeeRate: rate(3000),
    rent: cents(0, 8_000_000),
    utilities: cents(0, 600_000),
    cleaning: cents(0, 100_000),
    repairs: cents(0, 300_000),
    setupCost: cents(0, 50_000_000),
    usefulLifeMonths: fc.integer({ min: 1, max: 120 }),
    commission: commissionTerms,
  })
  .map((r) => ({
    operatingModel: r.operatingModel,
    daysInPeriod: 30,
    blockedNights: r.blockedNights,
    bookedNights: r.bookedNights,
    adr: r.adr,
    avgLengthOfStay: r.avgLengthOfStay,
    cleaningFeePerStay: r.cleaningFeePerStay,
    platformFeeRate: r.platformFeeRate,
    rent: r.operatingModel === "rental_arbitrage" ? r.rent : 0,
    fixedCosts: [{ id: "utilities", amount: r.utilities }],
    perStayCosts: [{ id: "cleaning", amount: r.cleaning }],
    perNightCosts: [],
    irregularCosts: [{ id: "repairs", amount: r.repairs }],
    setupCost: r.setupCost,
    usefulLifeMonths: r.usefulLifeMonths,
    deposit: 0,
    commission: r.operatingModel === "managed_for_owner" ? r.commission : NO_COMMISSION,
  }));

describe("scenarioView — properties", () => {
  it("summary rows and section totals reconcile exactly at displayed precision", () => {
    fc.assert(
      fc.property(scenarioInput, (input) => {
        const view = scenarioView(input);
        const s = view.sections;
        expect(view.revenue.minus(view.totalCostsWithDepreciation).equals(view.netAfterDepreciation)).toBe(true);
        const before = s.revenue
          .minus(s.platformFees)
          .minus(s.operatingExpenses)
          .minus(s.rent ?? 0)
          .minus(s.managementCommission ?? 0);
        expect(before.equals(s.profitBeforeDepreciation)).toBe(true);
        expect(s.profitBeforeDepreciation.minus(s.depreciation).equals(view.netAfterDepreciation)).toBe(true);
        for (const d of [s.revenue, s.platformFees, s.operatingExpenses, s.profitBeforeDepreciation, s.depreciation]) {
          expect(d.decimalPlaces()).toBeLessThanOrEqual(2);
        }
      }),
      RUNS,
    );
  });

  it("every line stays within two piastres of its own value; a line that needed no rounding is shown exactly", () => {
    fc.assert(
      fc.property(scenarioInput, (input) => {
        const { sections: s } = scenarioView(input);
        const r = computeScenario(input);
        const lines: [Decimal | null, Decimal.Value][] = [
          [s.platformFees, r.pnl.platformFees],
          [s.operatingExpenses, r.opexExcludingRent],
          [s.managementCommission, r.pnl.commission],
          [s.depreciation, r.depreciation],
        ];
        for (const [shown, exact] of lines) {
          if (shown === null) continue;
          expect(shown.minus(roundMoney(exact)).abs().lessThanOrEqualTo("0.02")).toBe(true);
          // A line already in whole piastres (e.g. one typed amount) never takes the leftover.
          if (new Decimal(exact).decimalPlaces() <= 2) expect(shown.equals(exact)).toBe(true);
        }
        // Typed amounts are shown as typed.
        if (s.rent) expect(s.rent.equals(input.rent)).toBe(true);
        if (input.commission.basis === "fixed_monthly") expect(s.managementCommission!.equals(input.commission.fixedFee)).toBe(true);
      }),
      RUNS,
    );
  });

  it("the outcome follows the sign of the displayed net; the sentence agrees with it", () => {
    fc.assert(
      fc.property(scenarioInput, (input) => {
        const view = scenarioView(input);
        expect(view.outcome).toBe(view.netAfterDepreciation.isNegative() ? "loss" : "profit");
        const kind = view.sentence.kind;
        if (kind === "short" || kind === "beyond_month") expect(view.outcome).toBe("loss");
        if (kind === "above" || kind === "at_first_profitable_night") expect(view.outcome).toBe("profit");
        if (view.sentence.kind === "short") expect(view.sentence.nightsShort).toBeGreaterThanOrEqual(1);
        if (view.sentence.kind === "above") expect(view.sentence.nightsAbove).toBeGreaterThanOrEqual(1);
      }),
      RUNS,
    );
  });

  it("the uncapped break-even is a real root of the net profit, inside the month exactly when the engine's is", () => {
    fc.assert(
      fc.property(scenarioInput, (input) => {
        const view = scenarioView(input);
        const capped = computeScenario(input).breakEven.includingDepreciation;
        if (view.breakEven.status === "no_break_even") return;
        const atRoot = computeScenario({ ...input, bookedNights: view.breakEven.nights }).netProfit;
        expect(atRoot.abs().lessThan("0.000001")).toBe(true);
        const available = computeScenario(input).nightsAvailable;
        if (view.breakEven.status === "within_month") {
          expect(capped.kind).toBe("reached");
          expect(view.breakEven.nights.lessThanOrEqualTo(available)).toBe(true);
        } else {
          expect(capped.kind).toBe("unreachable");
          expect(view.breakEven.nights.greaterThan(available)).toBe(true);
        }
        // The first whole night at break-even shows a profit ≥ 0; the one before does not.
        const net = (n: number) => roundMoney(computeScenario({ ...input, bookedNights: n }).netProfit);
        expect(net(view.breakEven.wholeNights).greaterThanOrEqualTo(0)).toBe(true);
        if (view.breakEven.wholeNights > 0) expect(net(view.breakEven.wholeNights - 1).lessThan(0)).toBe(true);
      }),
      { numRuns: 150 },
    );
  });
});
