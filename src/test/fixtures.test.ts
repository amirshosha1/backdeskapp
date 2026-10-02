import Decimal from "decimal.js";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { modelPnl, perNightModelFromActuals, toMoneyString } from "@/lib/finance";
import { HOME_COHOST_VIEW, HOME_OWNER_VIEW, NET_PROFIT_BASIS } from "@/demo/fixtures/home";
import { PORTFOLIO_OVERHEAD, UNIT_RESULTS, UNITS } from "@/demo/fixtures/units";
import { STATEMENT } from "@/demo/fixtures/statement";
import { EXPENSE_BREAKDOWN } from "@/demo/fixtures/expense";

/**
 * Phase 1: every `/demo` figure comes from the finance engine. These tests
 * (1) forbid hand-typed amounts in the fixture modules, (2) re-check the
 * engine's totals with independent Decimal arithmetic, (3) pin the sample
 * units agreed in the Phase 1 plan review, and (4) check that the Home
 * break-even tile uses the same cost basis as the net profit it sits with.
 */

const sum = (...amounts: Decimal.Value[]) => amounts.reduce<Decimal>((t, a) => t.plus(a), new Decimal(0));
const byId = (id: string) => UNITS.find((u) => u.id === id)!;
const resultFor = (id: string) => UNIT_RESULTS.find((r) => r.unit.id === id)!;

describe("no hand-typed totals in fixture modules", () => {
  const dir = join(process.cwd(), "src/demo/fixtures");
  // pricing.ts holds SAMPLE plan prices (inputs, not computed figures) and guide.ts holds no money.
  const exempt = new Set(["pricing.ts", "guide.ts"]);
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !exempt.has(f));

  it.each(files)("%s contains no decimal amount literals", (file) => {
    const code = readFileSync(join(dir, file), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(code.match(/["'`]-?\d[\d,]*\.\d+["'`]/g) ?? []).toEqual([]);
    expect(code.match(/(?<![\w.])\d+\.\d+(?![\w.])/g) ?? []).toEqual([]);
  });
});

describe("sample units (Phase 1 plan review, 2026-10-01)", () => {
  it("Madinaty: 20 nights (66.7%) at about 2,033", () => {
    const m = resultFor("madinaty").pnl;
    expect(m.kpis.bookedNights.toNumber()).toBe(20);
    expect(m.kpis.occupancy!.toFixed(3)).toBe("0.667");
    expect(toMoneyString(m.kpis.adr!)).toBe("2032.50");
  });

  it("Sheikh Zayed: rental arbitrage at 24,000 rent, 17 nights at about 1,759", () => {
    const s = resultFor("sheikh-zayed").pnl;
    expect(s.kpis.bookedNights.toNumber()).toBe(17);
    expect(toMoneyString(s.kpis.adr!)).toBe("1758.82");
    expect(s.opexByBehavior.fixed.greaterThanOrEqualTo(24000)).toBe(true);
  });

  it("Downtown Cairo is §4.6 Example A exactly", () => {
    const d = resultFor("downtown-cairo").pnl;
    expect(toMoneyString(d.grossRevenue)).toBe("47400.00");
    expect(toMoneyString(d.platformFees)).toBe("7347.00");
    expect(toMoneyString(d.noi)).toBe("32153.00");
    expect(toMoneyString(d.commission)).toBe("8010.60");
    expect(byId("downtown-cairo").managerProfit).toBe("8010.60");
  });

  it("Rehab: about 1,600 a night, and the 3,000 minimum applies (10% of gross is less)", () => {
    const r = resultFor("rehab").pnl;
    expect(toMoneyString(r.kpis.adr!)).toBe("1600.00");
    expect(r.grossRevenue.times("0.10").lessThan(3000)).toBe(true);
    expect(toMoneyString(r.commission)).toBe("3000.00");
    expect(toMoneyString(r.managerProfit)).toBe(toMoneyString(r.commission.minus(r.managerBorneOpex)));
  });

  it("the units differ: no two share both occupancy and ADR", () => {
    const keys = UNITS.map((u) => `${u.occupancy.toFixed(3)}@${u.adr}`);
    expect(new Set(keys).size).toBe(UNITS.length);
  });

  it("the commission wording on each managed unit matches its agreement", () => {
    for (const { unit } of UNIT_RESULTS.filter((r) => r.unit.operatingModel === "managed_for_owner")) {
      const rate = new Decimal(unit.commission.rate).times(100).toString();
      expect(unit.commissionBasis!.en).toContain(`${rate}%`);
      expect(unit.commissionBasis!.ar).toContain(`${rate}%`);
      if (new Decimal(unit.commission.fixedFee).greaterThan(0)) {
        const fee = new Decimal(unit.commission.fixedFee).toNumber().toLocaleString("en-US");
        expect(unit.commissionBasis!.en).toContain(fee);
        expect(unit.commissionBasis!.ar).toContain(fee);
      }
    }
  });

  it("no sample unit triggers an availability warning", () => {
    expect(UNITS.every((u) => !u.availabilityConflict && u.occupancy <= 1)).toBe(true);
  });
});

describe("home totals, re-added independently", () => {
  it("owner view: Σ net profit of owner-run units", () => {
    expect(HOME_OWNER_VIEW.heroTotal).toBe(toMoneyString(sum(...HOME_OWNER_VIEW.units.map((u) => u.netProfit!))));
  });

  it("co-host view: Σ manager profit − portfolio overhead", () => {
    expect(HOME_COHOST_VIEW.heroTotal).toBe(
      toMoneyString(sum(...HOME_COHOST_VIEW.units.map((u) => u.managerProfit!), PORTFOLIO_OVERHEAD)),
    );
  });

  it("the month-over-month chips compare with the sample August, not made-up values", () => {
    const owner = UNIT_RESULTS.filter((r) => r.unit.operatingModel !== "managed_for_owner");
    const managed = UNIT_RESULTS.filter((r) => r.unit.operatingModel === "managed_for_owner");
    const ownerNow = sum(...owner.map((r) => r.pnl.netProfit));
    const ownerBefore = sum(...owner.map((r) => r.previous.netProfit));
    expect(HOME_OWNER_VIEW.change).toBeCloseTo(ownerNow.minus(ownerBefore).dividedBy(ownerBefore).toNumber(), 10);
    const overhead = new Decimal(PORTFOLIO_OVERHEAD);
    const coNow = sum(...managed.map((r) => r.pnl.managerProfit), overhead);
    const coBefore = sum(...managed.map((r) => r.previous.managerProfit), overhead);
    expect(HOME_COHOST_VIEW.change).toBeCloseTo(coNow.minus(coBefore).dividedBy(coBefore).toNumber(), 10);
  });

  it("view KPIs are weighted by nights", () => {
    const owner = UNIT_RESULTS.filter((r) => r.unit.operatingModel !== "managed_for_owner");
    const booked = sum(...owner.map((r) => r.pnl.kpis.bookedNights));
    const available = sum(...owner.map((r) => r.pnl.kpis.nightsAvailable));
    expect(HOME_OWNER_VIEW.occupancy).toBeCloseTo(booked.dividedBy(available).toNumber(), 10);
    expect(HOME_OWNER_VIEW.adr).toBe(toMoneyString(sum(...owner.map((r) => r.pnl.accommodationRevenue)).dividedBy(booked)));
  });
});

describe("Home break-even tile: the same cost basis as the profit shown (Phase 1 review)", () => {
  const be = HOME_OWNER_VIEW.breakEven;
  const result = UNIT_RESULTS.find((r) => r.unit.name.en === be.unitName.en)!;
  const model = perNightModelFromActuals(result.pnl, result.unit.commission);
  if (!model.ok) throw new Error("no model");
  const profitAt = (n: number) => modelPnl(model.value, n, be.basis).profit;

  it("covers the costs in net profit: repairs and setup depreciation", () => {
    expect(be.basis).toEqual(NET_PROFIT_BASIS);
    expect(result.pnl.depreciation.greaterThan(0)).toBe(true);
  });

  it("at the unit's booked nights it reproduces the net profit on its card, to the piastre", () => {
    expect(toMoneyString(profitAt(be.bookedNights))).toBe(UNITS.find((u) => u.id === result.unit.id)!.netProfit);
  });

  it("at the whole-night target profit is ≥ 0; one night fewer it is < 0", () => {
    expect(new Decimal(toMoneyString(profitAt(be.targetNights))).greaterThanOrEqualTo(0)).toBe(true);
    expect(new Decimal(toMoneyString(profitAt(be.targetNights - 1))).lessThan(0)).toBe(true);
    expect(be.targetNights).toBe(new Decimal(be.breakEvenNights).toDecimalPlaces(0, Decimal.ROUND_UP).toNumber());
    expect(be.nightsShort).toBe(be.targetNights - be.bookedNights);
    expect(be.reached).toBe(false);
  });
});

describe("expense breakdown", () => {
  it("categories and bubbles each sum exactly to the month's total", () => {
    expect(EXPENSE_BREAKDOWN.total).toBe(toMoneyString(sum(...EXPENSE_BREAKDOWN.categories.map((c) => c.amount))));
    expect(EXPENSE_BREAKDOWN.total).toBe(toMoneyString(sum(...EXPENSE_BREAKDOWN.bubbles.map((b) => b.amount))));
    expect(EXPENSE_BREAKDOWN.bubbles.filter((b) => b.id === "other")).toHaveLength(1);
  });

  it("the total is the owner-run units' opex (depreciation is not an expense transaction)", () => {
    const owner = UNIT_RESULTS.filter((r) => r.unit.operatingModel !== "managed_for_owner");
    expect(EXPENSE_BREAKDOWN.total).toBe(toMoneyString(sum(...owner.map((r) => r.pnl.opex))));
  });

  it("every share matches its amount; Home's top expenses are the three largest", () => {
    for (const item of [...EXPENSE_BREAKDOWN.categories, ...EXPENSE_BREAKDOWN.bubbles]) {
      expect(item.share).toBeCloseTo(new Decimal(item.amount).dividedBy(EXPENSE_BREAKDOWN.total).toNumber(), 10);
    }
    expect(HOME_OWNER_VIEW.topExpenses).toEqual(EXPENSE_BREAKDOWN.categories.slice(0, 3));
  });
});

describe("owner statement (§4.6 Example A, cash basis)", () => {
  it("lines sum exactly to every total", () => {
    expect(STATEMENT.netPayout).toBe(toMoneyString(sum(STATEMENT.grossRevenue, STATEMENT.platformFees)));
    expect(STATEMENT.ownerExpensesTotal).toBe(toMoneyString(sum(...STATEMENT.ownerExpenses.map((l) => l.amount))));
    expect(STATEMENT.ownerNet).toBe(toMoneyString(sum(STATEMENT.netPayout, STATEMENT.ownerExpensesTotal, STATEMENT.commission)));
    expect(STATEMENT.balanceDue).toBe(toMoneyString(sum(STATEMENT.openingBalance, STATEMENT.ownerNet, STATEMENT.ownerPayouts)));
  });

  it("matches Example A: commission 8,010.60, owner net 24,142.40, balance due 4,142.40 after the 20,000 payout", () => {
    expect(STATEMENT.commission).toBe("-8010.60");
    expect(STATEMENT.ownerNet).toBe("24142.40");
    expect(STATEMENT.ownerPayouts).toBe("-20000.00");
    expect(STATEMENT.balanceDue).toBe("4142.40");
  });
});
