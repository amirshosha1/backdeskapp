// @vitest-environment node
import Decimal from "decimal.js";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  breakEvenAdr,
  breakEvenNights,
  breakEvenProgress,
  computeScenario,
  generateVerdict,
  GRID_3X3,
  GRID_7X7,
  modelPnl,
  monthOverMonthChange,
  NO_COMMISSION,
  orgProfit,
  sensitivityGrid,
  toMoneyString,
  type BreakEvenResult,
  type PerNightModel,
  type ScenarioInput,
} from "@/lib/finance";
import * as engine from "@/lib/finance";
import { projectTwelveMonths } from "@/lib/finance/projection";

const BEFORE_DEP = { includeIrregular: true, includeDepreciation: false };

/** §4.6 Example B's per-night model (rent 35,000 + 4,100 fixed, 800 repairs). */
const MODEL_B: PerNightModel = {
  adr: "2500.00",
  avgLengthOfStay: 3,
  cleaningFeePerStay: "400.00",
  otherIncomePerStay: 0,
  platformFeeRate: "0.155",
  perStayCosts: "500.00",
  perNightCosts: 0,
  fixedCosts: "39100.00",
  irregularCosts: "800.00",
  depreciation: 0,
  commission: NO_COMMISSION,
};

describe("breakEvenNights — unreachable and boundary cases", () => {
  it("no available nights", () => {
    expect(breakEvenNights(MODEL_B, 0, BEFORE_DEP)).toEqual({ kind: "unreachable", reason: "no_available_nights", basis: BEFORE_DEP });
  });

  it("contribution ≤ 0 → never profitable", () => {
    const model = { ...MODEL_B, perStayCosts: "9000.00" };
    expect(breakEvenNights(model, 30, BEFORE_DEP)).toMatchObject({ kind: "unreachable", reason: "never_profitable" });
  });

  it("break-even beyond the available nights → exceeds_available_nights", () => {
    expect(breakEvenNights(MODEL_B, 15, BEFORE_DEP)).toMatchObject({ kind: "unreachable", reason: "exceeds_available_nights" });
  });

  it("a commission that eats the whole contribution → never profitable", () => {
    const model = { ...MODEL_B, commission: { ...NO_COMMISSION, basis: "gross_revenue" as const, rate: "0.95" } };
    expect(breakEvenNights(model, 30, BEFORE_DEP)).toMatchObject({ kind: "unreachable", reason: "never_profitable" });
  });

  it("no costs at all → break-even at 0 nights", () => {
    const model = { ...MODEL_B, fixedCosts: 0, irregularCosts: 0 };
    expect(breakEvenNights(model, 30, BEFORE_DEP)).toMatchObject({ kind: "reached", wholeNights: 0 });
  });

  it("an exact whole-night break-even stays exact", () => {
    // contribution 2,058.50 × 20 = 41,170.00
    const model = { ...MODEL_B, fixedCosts: "40370.00" };
    const be = breakEvenNights(model, 30, BEFORE_DEP);
    expect(be).toMatchObject({ kind: "reached", wholeNights: 20 });
    if (be.kind === "reached") expect(be.nights.toFixed()).toBe("20");
  });

  it("in a sub-half-piastre tie, the whole-night target is the night whose profit already displays as 0.00", () => {
    // Break-even 20.0000019…: profit at 20 nights is −0.004, which displays as 0.00.
    const model = { ...MODEL_B, fixedCosts: "40370.004" };
    const be = breakEvenNights(model, 30, BEFORE_DEP);
    if (be.kind !== "reached") throw new Error("unreachable");
    expect(be.nights.greaterThan(20)).toBe(true);
    expect(be.wholeNights).toBe(20);
    expect(modelPnl(model, 20, BEFORE_DEP).profit.lessThan(0)).toBe(true);
    expect(toMoneyString(modelPnl(model, 20, BEFORE_DEP).profit)).toBe("0.00");
  });

  it("finds kinks on the net-payout and NOI hybrid bases", () => {
    for (const hybridBasis of ["net_payout", "noi"] as const) {
      for (const hybridMode of ["max", "sum"] as const) {
        const model = {
          ...MODEL_B,
          fixedCosts: "20000.00",
          commission: { basis: "hybrid" as const, rate: "0.20", fixedFee: "3000.00", hybridMode, hybridBasis, includeCleaningFees: false },
        };
        const be = breakEvenNights(model, 30, BEFORE_DEP);
        if (be.kind !== "reached") throw new Error(`${hybridBasis}/${hybridMode} unreachable`);
        expect(modelPnl(model, be.nights, BEFORE_DEP).profit.abs().lessThan("0.01")).toBe(true);
      }
    }
  });
});

describe("breakEvenAdr", () => {
  it("the ADR at which Example B breaks even at 18 nights", () => {
    const result = breakEvenAdr(MODEL_B, 18, BEFORE_DEP);
    if (result.kind !== "reached") throw new Error("unreachable");
    expect(modelPnl({ ...MODEL_B, adr: result.adr }, 18, BEFORE_DEP).profit.abs().lessThan("0.01")).toBe(true);
    expect(result.adr.toFixed(2)).toBe("2687.18");
  });

  it("is unreachable with no booked nights or when no rate can cover the costs", () => {
    expect(breakEvenAdr(MODEL_B, 0, BEFORE_DEP)).toMatchObject({ kind: "unreachable", reason: "no_booked_nights" });
    const model = { ...MODEL_B, platformFeeRate: 1 };
    expect(breakEvenAdr(model, 18, BEFORE_DEP)).toMatchObject({ kind: "unreachable", reason: "never_profitable" });
  });

  it("is 0 when cleaning fees alone already cover every cost", () => {
    const model = { ...MODEL_B, fixedCosts: 0, irregularCosts: 0, perStayCosts: 0, cleaningFeePerStay: "900.00" };
    const result = breakEvenAdr(model, 18, BEFORE_DEP);
    expect(result.kind === "reached" && result.adr.isZero()).toBe(true);
  });
});

describe("breakEvenProgress", () => {
  const reached = breakEvenNights(MODEL_B, 30, BEFORE_DEP);

  it("Sheikh Zayed-style tile: 18 booked of 19.38 → target 20, 2 short", () => {
    expect(breakEvenProgress(18, reached)).toMatchObject({ targetNights: 20, nightsShort: 2, reached: false });
    expect(breakEvenProgress(18, reached)!.progress.toFixed(3)).toBe("0.929");
  });

  it("caps progress at 1 once past break-even, and handles a zero break-even", () => {
    expect(breakEvenProgress(25, reached)).toMatchObject({ nightsShort: 0, reached: true });
    expect(breakEvenProgress(25, reached)!.progress.toFixed()).toBe("1");
    const zero: BreakEvenResult = { ...(reached as Extract<BreakEvenResult, { kind: "reached" }>), nights: new Decimal(0), wholeNights: 0 };
    expect(breakEvenProgress(0, zero)!.progress.toFixed()).toBe("1");
  });

  it("is null when break-even is unreachable", () => {
    expect(breakEvenProgress(10, breakEvenNights(MODEL_B, 0, BEFORE_DEP))).toBeNull();
  });
});

describe("verdict", () => {
  const be = breakEvenNights(MODEL_B, 30, BEFORE_DEP);
  const occ = new Decimal("0.6");

  it("covers every rule", () => {
    expect(generateVerdict({ profit: "-2847.00", occupancy: occ, breakEven: be })).toMatchObject({ kind: "loss" });
    expect(generateVerdict({ profit: "100.00", occupancy: occ, breakEven: be })).toMatchObject({ kind: "profitable" });
    expect(generateVerdict({ profit: "0.004", occupancy: occ, breakEven: be })).toEqual({ kind: "at_break_even", occupancy: occ });
    const unreachable = breakEvenNights(MODEL_B, 15, BEFORE_DEP);
    expect(generateVerdict({ profit: -1, occupancy: occ, breakEven: unreachable })).toEqual({
      kind: "unreachable",
      occupancy: occ,
      reason: "exceeds_available_nights",
    });
    expect(generateVerdict({ profit: 100, occupancy: occ, breakEven: unreachable })).toEqual({
      kind: "profitable",
      occupancy: occ,
      breakEvenOccupancy: null,
    });
    expect(generateVerdict({ profit: -1, occupancy: null, breakEven: breakEvenNights(MODEL_B, 0, BEFORE_DEP) })).toEqual({
      kind: "no_available_nights",
    });
  });
});

describe("org profit", () => {
  const units = [
    { operatingModel: "owner_operated" as const, currency: "EGP", netProfit: "1000.00" },
    { operatingModel: "rental_arbitrage" as const, currency: "EGP", netProfit: "-300.00" },
    { operatingModel: "managed_for_owner" as const, currency: "EGP", managerProfit: "500.00" },
    { operatingModel: "managed_for_owner" as const, currency: "SAR", managerProfit: "50.00" },
    { operatingModel: "owner_operated" as const, currency: "SAR" },
  ];
  const overhead = [
    { currency: "EGP", amount: "150.00" },
    { currency: "AED", amount: "10.00" },
  ];

  it("one total per currency: owner-run net profit + manager profit − overhead", () => {
    const totals = orgProfit(units, overhead);
    expect(totals.map((t) => [t.currency, t.total.toFixed(2)])).toEqual([
      ["EGP", "1050.00"],
      ["SAR", "50.00"],
      ["AED", "-10.00"],
    ]);
  });

  it("owner view: owner-run units only, no overhead; co-host view: managed units minus overhead", () => {
    expect(orgProfit(units, overhead, "owner").map((t) => [t.currency, t.total.toFixed(2)])).toEqual([
      ["EGP", "700.00"],
      ["SAR", "0.00"],
    ]);
    expect(orgProfit(units, overhead, "cohost").map((t) => [t.currency, t.total.toFixed(2)])).toEqual([
      ["EGP", "350.00"],
      ["SAR", "50.00"],
      ["AED", "-10.00"],
    ]);
  });

  it("month-over-month change, hidden on a zero or negative base", () => {
    expect(monthOverMonthChange("110.00", "100.00")!.toFixed(2)).toBe("0.10");
    expect(monthOverMonthChange("90.00", "100.00")!.toFixed(2)).toBe("-0.10");
    expect(monthOverMonthChange("100.00", "0.00")).toBeNull();
    expect(monthOverMonthChange("100.00", "-50.00")).toBeNull();
  });
});

const SCENARIO: ScenarioInput = {
  operatingModel: "rental_arbitrage",
  daysInPeriod: 30,
  blockedNights: 0,
  bookedNights: 18,
  adr: "2500.00",
  avgLengthOfStay: 3,
  cleaningFeePerStay: "400.00",
  platformFeeRate: "0.155",
  rent: "35000.00",
  fixedCosts: [{ id: "utilities", amount: "4100.00" }],
  perStayCosts: [{ id: "cleaning", amount: "500.00" }],
  perNightCosts: [],
  irregularCosts: [{ id: "repairs", amount: "800.00" }],
  setupCost: "250000.00",
  usefulLifeMonths: 60,
  deposit: "70000.00",
  commission: NO_COMMISSION,
};

describe("scenario", () => {
  it("separates profit before depreciation from net profit, each with its own break-even", () => {
    const r = computeScenario(SCENARIO);
    expect(r.profitBeforeDepreciation.toFixed(2)).toBe("-2847.00");
    expect(r.depreciation.toFixed(2)).toBe("4166.67");
    expect(r.netProfit.toFixed(2)).toBe("-7013.67");
    expect(r.rent.toFixed(2)).toBe("35000.00");
    expect(r.opexExcludingRent.toFixed(2)).toBe("7900.00");
    const withDep = r.breakEven.includingDepreciation;
    if (withDep.kind !== "reached") throw new Error("unreachable");
    expect(withDep.nights.toFixed(2)).toBe("21.41");
    expect(withDep.basis).toEqual({ includeIrregular: true, includeDepreciation: true });
    expect(r.investment.totalCashInvested.toFixed(2)).toBe("320000.00");
    expect(r.investment.paybackMonths).toBeNull();
    expect(r.investment.cashOnCash!.toFixed(4)).toBe("-0.1068");
    expect(r.verdict.kind).toBe("loss");
  });

  it("ignores commission terms on units that are not managed", () => {
    const r = computeScenario({ ...SCENARIO, commission: { ...NO_COMMISSION, basis: "gross_revenue", rate: "0.5" } });
    expect(r.pnl.commission.isZero()).toBe(true);
  });

  it("flags booked nights above the available nights and still computes", () => {
    const r = computeScenario({ ...SCENARIO, blockedNights: 10, bookedNights: 25 });
    expect(r.kpis.occupancy!.toFixed(2)).toBe("1.25");
    expect(r.kpis.warnings).toHaveLength(1);
  });
});

describe("sensitivity grid", () => {
  const model = MODEL_B;

  it("3 × 3 and 7 × 7, with the base case in the middle", () => {
    for (const axes of [GRID_3X3, GRID_7X7]) {
      const grid = sensitivityGrid(model, 30, { occupancy: "0.6", adr: "2500" }, axes, BEFORE_DEP);
      const mid = (axes.size - 1) / 2;
      expect(grid.profits).toHaveLength(axes.size);
      expect(grid.profits.every((row) => row.length === axes.size)).toBe(true);
      expect(grid.profits[mid]![mid]!.toFixed(2)).toBe("-2847.00");
    }
  });

  it("keeps occupancy inside 0–100% and ADR ≥ 0", () => {
    const grid = sensitivityGrid(model, 30, { occupancy: "0.95", adr: "10" }, { size: 7, occupancyStep: "0.5", adrStep: "0.5" }, BEFORE_DEP);
    expect(grid.occupancies.map((o) => o.toFixed(2))).toEqual(["0.00", "0.00", "0.45", "0.95", "1.00", "1.00", "1.00"]);
    expect(grid.adrs[0]!.isZero()).toBe(true);
  });

  it("rejects an even or empty grid", () => {
    expect(() => sensitivityGrid(model, 30, { occupancy: 0.5, adr: 1 }, { ...GRID_3X3, size: 4 }, BEFORE_DEP)).toThrow(RangeError);
    expect(() => sensitivityGrid(model, 30, { occupancy: 0.5, adr: 1 }, { ...GRID_3X3, size: 0 }, BEFORE_DEP)).toThrow(RangeError);
  });
});

describe("projection (server-only)", () => {
  const flat = Array.from({ length: 12 }, () => ({ occupancy: 1, adr: 1 }));

  it("projects 12 months from the start month, with real month lengths", () => {
    const p = projectTwelveMonths({ model: MODEL_B, startMonth: "2026-11", baseOccupancy: "0.6", multipliers: flat, basis: BEFORE_DEP });
    expect(p.months.map((m) => m.month)).toEqual([
      "2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04",
      "2027-05", "2027-06", "2027-07", "2027-08", "2027-09", "2027-10",
    ]);
    expect(p.months[3]!.nightsAvailable.toNumber()).toBe(28);
    expect(p.months[0]!.pnl.profit.toFixed(2)).toBe("-2847.00");
    expect(p.totals.profit.equals(p.months.reduce((t, m) => t.plus(m.pnl.profit), new Decimal(0)))).toBe(true);
  });

  it("applies seasonal multipliers and warns, never clamps, above 100%", () => {
    const peak = flat.map((m, i) => (i === 0 ? { occupancy: 2, adr: "1.2" } : m));
    const p = projectTwelveMonths({
      model: MODEL_B,
      startMonth: "2026-07",
      baseOccupancy: "0.6",
      multipliers: peak,
      blockedNights: [1],
      basis: BEFORE_DEP,
    });
    expect(p.months[0]!.bookedNights.toFixed(1)).toBe("36.0");
    expect(p.months[0]!.adr.toFixed(2)).toBe("3000.00");
    expect(p.months[0]!.warnings.map((w) => w.code)).toEqual(["availability_conflict"]);
  });

  it("needs exactly 12 multipliers", () => {
    expect(() => projectTwelveMonths({ model: MODEL_B, startMonth: "2026-01", baseOccupancy: 1, multipliers: [], basis: BEFORE_DEP })).toThrow(RangeError);
  });

  it("is marked server-only and is not re-exported by the engine index", () => {
    const source = readFileSync(new URL("./projection.ts", import.meta.url), "utf8");
    expect(source.startsWith('import "server-only";')).toBe(true);
    expect("projectTwelveMonths" in engine).toBe(false);
  });
});
