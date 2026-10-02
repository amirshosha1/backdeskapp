// @vitest-environment node
import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  allocatePlatformFee,
  allocateStayByMonth,
  breakEvenNights,
  computeCommission,
  computeKpis,
  computeScenario,
  computeTax,
  displayOccupancy,
  modelPnl,
  nightsAvailable,
  NO_COMMISSION,
  ownerStatement,
  perNightModelFromActuals,
  platformFeeFromRate,
  splitEvenly,
  toUnitCurrency,
  unitMonthPnl,
  type CommissionTerms,
  type ExpenseLine,
  type PerNightModel,
  type ScenarioInput,
  type StatementStay,
} from "@/lib/finance";

/**
 * BUILD_PLAN.md §4.6 — every worked example, to 2 decimal places.
 * Common assumptions: 30-day month, 0 blocked nights, EGP, platform fee
 * 15.5% of gross; cleaning (350/stay) and consumables (150/stay) per stay;
 * utilities 2,500, internet 600, compound fees 1,000 and rent fixed;
 * repairs 800 irregular.
 */

const fx2 = (d: Decimal.Value | null) => (d === null ? null : new Decimal(d).toFixed(2, Decimal.ROUND_HALF_UP));
const MONTH = "2026-09";
const FEE_RATE = "0.155";

/** Example A's six stays: 3 nights each, 7,500 accommodation, 400 cleaning; fee = 15.5% of the stay's gross. */
const STAYS_A: StatementStay[] = [1, 6, 11, 16, 21, 26].map((day) => {
  const checkIn = `${MONTH}-${String(day).padStart(2, "0")}`;
  const checkOut = `${MONTH}-${String(day + 3).padStart(2, "0")}`;
  return {
    checkIn,
    checkOut,
    accommodationRevenue: "7500.00",
    cleaningFee: "400.00",
    otherFees: "0.00",
    platformFee: platformFeeFromRate("7900.00", FEE_RATE),
    currency: "EGP",
    payoutDate: checkIn,
  };
});

const expense = (categoryId: string, costBehavior: ExpenseLine["costBehavior"], amount: string, day = "05"): ExpenseLine => ({
  date: `${MONTH}-${day}`,
  categoryId,
  costBehavior,
  amount,
  currency: "EGP",
});

const OPEX_A: ExpenseLine[] = [
  ...STAYS_A.map((s) => ({ ...expense("cleaning", "per_stay", "350.00"), date: s.checkIn })),
  ...STAYS_A.map((s) => ({ ...expense("consumables", "per_stay", "150.00"), date: s.checkIn })),
  expense("utilities", "fixed", "2500.00"),
  expense("internet", "fixed", "600.00"),
  expense("compound", "fixed", "1000.00"),
  expense("repairs", "irregular", "800.00"),
];

const NET_PAYOUT_20: CommissionTerms = { ...NO_COMMISSION, basis: "net_payout", rate: "0.20" };

function pnlA(overrides: Partial<Parameters<typeof unitMonthPnl>[0]> = {}) {
  const result = unitMonthPnl({
    unitCurrency: "EGP",
    month: MONTH,
    availability: { blockedNights: 0 },
    stays: STAYS_A,
    expenses: OPEX_A,
    depreciation: 0,
    commission: NET_PAYOUT_20,
    ...overrides,
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

function statementA(commission: CommissionTerms) {
  const result = ownerStatement({
    unitCurrency: "EGP",
    period: MONTH,
    basis: "cash",
    stays: STAYS_A,
    expenses: OPEX_A,
    commission,
    ownerPayouts: [],
    openingBalance: 0,
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

/** The calculator inputs for Example B (rental arbitrage). */
const SCENARIO_B: ScenarioInput = {
  operatingModel: "rental_arbitrage",
  daysInPeriod: 30,
  blockedNights: 0,
  bookedNights: 18,
  adr: "2500.00",
  avgLengthOfStay: 3,
  cleaningFeePerStay: "400.00",
  platformFeeRate: FEE_RATE,
  rent: "35000.00",
  fixedCosts: [
    { id: "utilities", amount: "2500.00" },
    { id: "internet", amount: "600.00" },
    { id: "compound", amount: "1000.00" },
  ],
  perStayCosts: [
    { id: "cleaning", amount: "350.00" },
    { id: "consumables", amount: "150.00" },
  ],
  perNightCosts: [],
  irregularCosts: [{ id: "repairs", amount: "800.00" }],
  setupCost: 0,
  usefulLifeMonths: 0,
  deposit: 0,
  commission: NO_COMMISSION,
};

describe("Example A — managed unit, 20% of net payout, owner bears all costs", () => {
  const pnl = pnlA();

  it("KPIs: occupancy 0.60, ADR 2,500.00, RevPAR 1,500.00", () => {
    expect(fx2(pnl.kpis.occupancy)).toBe("0.60");
    expect(fx2(pnl.kpis.adr)).toBe("2500.00");
    expect(fx2(pnl.kpis.revpar)).toBe("1500.00");
    expect(pnl.kpis.warnings).toEqual([]);
  });

  it("gross 47,400.00; platform fees 7,347.00 (accommodation 6,975.00, cleaning 372.00); payout 40,053.00", () => {
    expect(fx2(pnl.grossRevenue)).toBe("47400.00");
    expect(fx2(pnl.platformFees)).toBe("7347.00");
    expect(fx2(pnl.platformFeesOnCleaning)).toBe("372.00");
    const allocation = allocatePlatformFee(pnl.platformFees, {
      accommodation: pnl.accommodationRevenue,
      cleaning: pnl.cleaningFees,
      other: pnl.otherIncome,
    });
    expect(fx2(allocation.accommodation)).toBe("6975.00");
    expect(fx2(allocation.cleaning)).toBe("372.00");
    expect(fx2(allocation.other)).toBe("0.00");
    expect(fx2(pnl.netPayout)).toBe("40053.00");
  });

  it("opex 7,900.00; NOI 32,153.00; commission 8,010.60", () => {
    expect(fx2(pnl.opex)).toBe("7900.00");
    expect(fx2(pnl.noi)).toBe("32153.00");
    expect(fx2(pnl.commission)).toBe("8010.60");
  });

  it("owner net before depreciation 24,142.40 (statement)", () => {
    const statement = statementA(NET_PAYOUT_20);
    expect(fx2(statement.commission)).toBe("8010.60");
    expect(fx2(statement.ownerExpensesTotal)).toBe("7900.00");
    expect(fx2(statement.ownerNet)).toBe("24142.40");
    expect(fx2(statement.balanceDue)).toBe("24142.40");
  });
});

describe("Example A — break-even after the 20% commission", () => {
  it("contribution after commission 1,613.47 and fixed costs 4,900.00 give 3.04 nights", () => {
    const result = computeScenario({ ...SCENARIO_B, operatingModel: "managed_for_owner", rent: 0, commission: NET_PAYOUT_20 });
    const be = result.breakEven.primary;
    if (be.kind !== "reached") throw new Error("unreachable");
    expect(fx2(result.contributionPerNight)).toBe("2058.50");
    expect(fx2(be.contributionPerNight)).toBe("1613.47");
    expect(fx2(be.fixedCosts)).toBe("4900.00");
    expect(fx2(be.nights)).toBe("3.04");
  });
});

describe("Example A2 — cleaning fees excluded from the commission base", () => {
  const terms = { ...NET_PAYOUT_20, includeCleaningFees: false };

  it("base 38,025.00 → commission 7,605.00; owner net 24,548.00", () => {
    const pnl = pnlA({ commission: terms });
    expect(fx2(pnl.commission)).toBe("7605.00");
    expect(fx2(pnl.commission.dividedBy("0.20"))).toBe("38025.00");
    expect(fx2(statementA(terms).ownerNet)).toBe("24548.00");
  });
});

describe("Example B — rental arbitrage (basis none), rent 35,000", () => {
  const pnl = pnlA({
    commission: NO_COMMISSION,
    expenses: [...OPEX_A, expense("rent", "fixed", "35000.00", "01")],
  });
  const model = perNightModelFromActuals(pnl);
  const includeIrregular = { includeIrregular: true, includeDepreciation: false };

  it("NOI: 40,053 − 7,900 − 35,000 = −2,847.00", () => {
    expect(fx2(pnl.noi)).toBe("-2847.00");
    expect(fx2(pnl.netProfit)).toBe("-2847.00");
  });

  it("from actuals: fixed 39,900, contribution 2,058.50, break-even 19.38 nights (64.6%), 20 whole nights (66.7%)", () => {
    if (!model.ok) throw new Error("no model");
    expect(fx2(new Decimal(model.value.fixedCosts).plus(model.value.irregularCosts))).toBe("39900.00");
    const be = breakEvenNights(model.value, 30, includeIrregular);
    if (be.kind !== "reached") throw new Error("unreachable");
    expect(fx2(be.nights)).toBe("19.38");
    expect(be.occupancy.toFixed(3)).toBe("0.646");
    expect(be.wholeNights).toBe(20);
    expect(be.wholeOccupancy.toFixed(3)).toBe("0.667");
  });

  it("at 19 nights the unit still loses 788.50; at 20 it is past break-even", () => {
    if (!model.ok) throw new Error("no model");
    expect(fx2(modelPnl(model.value, 19, includeIrregular).profit)).toBe("-788.50");
    expect(modelPnl(model.value, 20, includeIrregular).profit.greaterThan(0)).toBe(true);
  });

  it("from the calculator inputs: same NOI, contribution 2,058.50 and break-even 19.38", () => {
    const result = computeScenario(SCENARIO_B);
    expect(fx2(result.pnl.noi)).toBe("-2847.00");
    expect(fx2(result.profitBeforeDepreciation)).toBe("-2847.00");
    expect(fx2(result.contributionPerNight)).toBe("2058.50");
    const be = result.breakEven.primary;
    if (be.kind !== "reached") throw new Error("unreachable");
    expect(fx2(be.nights)).toBe("19.38");
    expect(be.occupancy.toFixed(3)).toBe("0.646");
    expect(be.wholeNights).toBe(20);
  });
});

describe("Example B2 — maintenance/irregular costs excluded (the per-scenario toggle)", () => {
  it("fixed 39,100, contribution 2,058.50, break-even 18.99 nights (63.3%)", () => {
    const result = computeScenario(SCENARIO_B);
    const be = result.breakEven.excludingIrregular;
    if (be.kind !== "reached") throw new Error("unreachable");
    expect(fx2(be.nights)).toBe("18.99");
    expect(be.occupancy.toFixed(3)).toBe("0.633");
    expect(be.basis).toEqual({ includeIrregular: false, includeDepreciation: false });
  });
});

describe("Example C — hybrid minimum guarantee, max(3,000, 10% × gross)", () => {
  const terms: CommissionTerms = {
    basis: "hybrid",
    rate: "0.10",
    fixedFee: "3000.00",
    hybridMode: "max",
    hybridBasis: "gross_revenue",
    includeCleaningFees: true,
  };
  const figures = (gross: string) => ({
    grossRevenue: gross,
    cleaningFees: 0,
    platformFeesOnCleaning: 0,
    netPayout: 0,
    noi: 0,
  });

  it("gross 47,400 → 4,740.00", () => expect(fx2(computeCommission(terms, figures("47400.00")))).toBe("4740.00"));
  it("gross 20,000 → 3,000.00", () => expect(fx2(computeCommission(terms, figures("20000.00")))).toBe("3000.00"));
  it("on Example A's month", () => expect(fx2(pnlA({ commission: terms }).commission)).toBe("4740.00"));
});

describe("Example D — NOI basis with a loss", () => {
  it("NOI −1,200 → commission 0.00", () => {
    const terms: CommissionTerms = { ...NO_COMMISSION, basis: "noi", rate: "0.25" };
    const figures = { grossRevenue: 1000, cleaningFees: 0, platformFeesOnCleaning: 0, netPayout: 1000, noi: "-1200.00" };
    expect(fx2(computeCommission(terms, figures))).toBe("0.00");
  });
});

describe("Example E — proration and statement basis", () => {
  const stay: StatementStay = {
    checkIn: "2027-01-30",
    checkOut: "2027-02-03",
    accommodationRevenue: "10000.00",
    cleaningFee: "0.00",
    otherFees: "0.00",
    platformFee: "1550.00",
    currency: "EGP",
    payoutDate: "2027-01-31",
  };
  const statement = (period: string, basis: "cash" | "accrual") => {
    const result = ownerStatement({
      unitCurrency: "EGP",
      period,
      basis,
      stays: [stay],
      expenses: [],
      commission: NO_COMMISSION,
      ownerPayouts: [],
      openingBalance: 0,
    });
    if (!result.ok) throw new Error("statement failed");
    return result.value;
  };

  it("accrual: January 2 nights / 5,000, February 2 nights / 5,000; fee 775.00 and net payout 4,225.00 each", () => {
    const [jan, feb] = allocateStayByMonth(stay);
    expect(jan).toMatchObject({ month: "2027-01", nights: 2 });
    expect(feb).toMatchObject({ month: "2027-02", nights: 2 });
    expect([fx2(jan!.accommodationRevenue), fx2(feb!.accommodationRevenue)]).toEqual(["5000.00", "5000.00"]);
    expect([fx2(jan!.platformFee), fx2(feb!.platformFee)]).toEqual(["775.00", "775.00"]);
    expect(fx2(statement("2027-01", "accrual").netPayout)).toBe("4225.00");
    expect(fx2(statement("2027-02", "accrual").netPayout)).toBe("4225.00");
  });

  it("cash: January 8,450.00, February 0.00; both views total 8,450.00", () => {
    const janCash = statement("2027-01", "cash").netPayout;
    const febCash = statement("2027-02", "cash").netPayout;
    expect([fx2(janCash), fx2(febCash)]).toEqual(["8450.00", "0.00"]);
    const accrualTotal = statement("2027-01", "accrual").netPayout.plus(statement("2027-02", "accrual").netPayout);
    expect(fx2(janCash.plus(febCash))).toBe("8450.00");
    expect(fx2(accrualTotal)).toBe("8450.00");
  });
});

describe("Example E2 — proration remainder", () => {
  it("3 nights, 1,000.00 → nightly 333.33, 333.33, 333.34 → January 333.33, February 666.67", () => {
    expect(splitEvenly("1000.00", 3).map(fx2)).toEqual(["333.33", "333.33", "333.34"]);
    const [jan, feb] = allocateStayByMonth({
      checkIn: "2027-01-31",
      checkOut: "2027-02-03",
      accommodationRevenue: "1000.00",
      cleaningFee: 0,
      otherFees: 0,
      platformFee: 0,
    });
    expect(fx2(jan!.accommodationRevenue)).toBe("333.33");
    expect(fx2(feb!.accommodationRevenue)).toBe("666.67");
  });
});

describe("Example F — rounding", () => {
  it("100.00 into 3 lines → 33.33, 33.33, 33.34, summing exactly", () => {
    const lines = splitEvenly("100.00", 3);
    expect(lines.map(fx2)).toEqual(["33.33", "33.33", "33.34"]);
    expect(fx2(lines.reduce((a, b) => a.plus(b)))).toBe("100.00");
  });
});

/** Examples G and H share the per-night model: ADR 2,500, cleaning 400/stay, 3-night stays, 500 per-stay costs. */
const baseModel = (overrides: Partial<PerNightModel>): PerNightModel => ({
  adr: "2500.00",
  avgLengthOfStay: 3,
  cleaningFeePerStay: "400.00",
  otherIncomePerStay: 0,
  platformFeeRate: FEE_RATE,
  perStayCosts: "500.00",
  perNightCosts: 0,
  fixedCosts: 0,
  irregularCosts: 0,
  depreciation: 0,
  commission: NO_COMMISSION,
  ...overrides,
});

describe("Example G — NOI-basis break-even with depreciation", () => {
  const model = baseModel({
    fixedCosts: "4100.00",
    irregularCosts: "800.00",
    depreciation: "3000.00",
    commission: { ...NO_COMMISSION, basis: "noi", rate: "0.25" },
  });
  const basis = { includeIrregular: false, includeDepreciation: true };

  it("contribution 2,058.50; required NOI 3,000 / (1 − 0.25) = 4,000.00", () => {
    expect(fx2(computeScenario(SCENARIO_B).contributionPerNight)).toBe("2058.50");
    expect(fx2(new Decimal(3000).dividedBy(new Decimal(1).minus("0.25")))).toBe("4000.00");
  });

  it("break-even ≈ 3.93 nights (13.1%), matching (4,100 + 4,000) / 2,058.50, not the uncorrected 3.45", () => {
    const be = breakEvenNights(model, 30, basis);
    if (be.kind !== "reached") throw new Error("unreachable");
    expect(fx2(be.nights)).toBe("3.93");
    expect(be.occupancy.toFixed(3)).toBe("0.131");
    expect(fx2(new Decimal(8100).dividedBy("2058.5"))).toBe("3.93");
    expect(fx2(be.nights)).not.toBe(fx2(new Decimal(7100).dividedBy("2058.5")));
  });
});

describe("Example H — hybrid break-even, solved piecewise", () => {
  const model = baseModel({
    fixedCosts: "30000.00",
    commission: {
      basis: "hybrid",
      rate: "0.10",
      fixedFee: "3000.00",
      hybridMode: "max",
      hybridBasis: "gross_revenue",
      includeCleaningFees: true,
    },
  });
  const basis = { includeIrregular: true, includeDepreciation: false };

  it("rejects the minimum-fee root 16.03 (10% × gross there ≈ 4,221.5 > 3,000)", () => {
    const naive = new Decimal(33000).dividedBy("2058.5");
    expect(fx2(naive)).toBe("16.03");
    const atNaive = modelPnl(model, naive, basis);
    expect(atNaive.grossRevenue.times("0.10").greaterThan(3000)).toBe(true);
    expect(atNaive.profit.lessThan(0)).toBe(true);
  });

  it("break-even ≈ 16.71 nights (55.7%), where 10% × gross ≈ 4,400.7 ≥ 3,000", () => {
    const be = breakEvenNights(model, 30, basis);
    if (be.kind !== "reached") throw new Error("unreachable");
    expect(fx2(be.nights)).toBe("16.71");
    expect(be.occupancy.toFixed(3)).toBe("0.557");
    expect(modelPnl(model, be.nights, basis).grossRevenue.times("0.10").toFixed(1)).toBe("4400.7");
  });
});

describe("Example I — FX", () => {
  it("USD 100.00 at 48.7550 → 4,875.50", () => {
    const r = toUnitCurrency({ amount: "100.00", currency: "USD", fxRate: "48.7550" }, "EGP");
    expect(r.ok && fx2(r.value)).toBe("4875.50");
  });
  it("SAR 1.00 at 12.3450 → 12.35 (half-up, not half-even's 12.34)", () => {
    const r = toUnitCurrency({ amount: "1.00", currency: "SAR", fxRate: "12.3450" }, "EGP");
    expect(r.ok && fx2(r.value)).toBe("12.35");
  });
  it("a USD amount without an FX rate → typed error", () => {
    expect(toUnitCurrency({ amount: "100.00", currency: "USD" }, "EGP")).toEqual({
      ok: false,
      error: { code: "missing_fx_rate", currency: "USD" },
    });
  });
});

describe("Example J — availability conflict", () => {
  it("30 days, 10 blocked (20 available), 25 booked → occupancy 1.25 with a warning; displayed 100%", () => {
    const available = nightsAvailable({ month: MONTH, blockedNights: 10 });
    expect(available).toEqual({ ok: true, value: 20 });
    const kpis = computeKpis({ nightsAvailable: 20, bookedNights: 25, accommodationRevenue: 50000 });
    expect(fx2(kpis.occupancy)).toBe("1.25");
    expect(kpis.warnings).toHaveLength(1);
    expect(kpis.warnings[0]!.code).toBe("availability_conflict");
    expect(fx2(displayOccupancy(kpis.occupancy))).toBe("1.00");
  });
});

describe("Example K — tax (test values only, not real rates)", () => {
  const settings = { rate: "0.10", base: "pre_tax_profit" as const };
  it("pre-tax 5,000.00 → tax 500.00, net 4,500.00", () => {
    const tax = computeTax(settings, { preTaxProfit: "5000.00", grossRevenue: 0, netPayout: 0 });
    expect(fx2(tax)).toBe("500.00");
    expect(fx2(new Decimal("5000.00").minus(tax))).toBe("4500.00");
  });
  it("pre-tax −1,000.00 → tax 0.00, net −1,000.00", () => {
    const tax = computeTax(settings, { preTaxProfit: "-1000.00", grossRevenue: 0, netPayout: 0 });
    expect(fx2(tax)).toBe("0.00");
    expect(fx2(new Decimal("-1000.00").minus(tax))).toBe("-1000.00");
  });
});
