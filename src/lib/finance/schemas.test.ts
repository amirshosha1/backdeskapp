// @vitest-environment node
import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  allocateStayByMonth,
  breakEvenNights,
  computeScenario,
  GRID_3X3,
  NO_COMMISSION,
  orgProfit,
  ownerStatement,
  perNightModelFromActuals,
  scenarioModel,
  sensitivityGrid,
  unitMonthPnl,
  type ScenarioInput,
} from "@/lib/finance";
import {
  breakEvenResultSchema,
  capexAssetSchema,
  currencyTotalSchema,
  expenseLineSchema,
  foreignAmountSchema,
  ownerStatementSchema,
  parseWith,
  perNightModelSchema,
  scenarioInputSchema,
  scenarioResultSchema,
  sensitivityGridSchema,
  statementInputSchema,
  stayInputSchema,
  stayMonthAllocationSchema,
  unitMonthInputSchema,
  unitMonthPnlSchema,
  verdictSchema,
} from "@/lib/finance/schemas";

/** Raw, untrusted Example B calculator input — strings as a form would send them. */
const RAW_B = {
  operatingModel: "rental_arbitrage",
  daysInPeriod: 30,
  blockedNights: 0,
  bookedNights: "18",
  adr: "2500.00",
  avgLengthOfStay: "3",
  cleaningFeePerStay: "400",
  platformFeeRate: "0.155",
  rent: "35000",
  fixedCosts: [{ id: "utilities", amount: "2500" }],
  perStayCosts: [{ id: "cleaning", amount: "350" }],
  perNightCosts: [],
  irregularCosts: [{ id: "repairs", amount: "800" }],
  setupCost: "250000",
  usefulLifeMonths: 60,
  deposit: "70000",
  commission: { ...NO_COMMISSION, rate: "0", fixedFee: "0" },
};

const issuesOf = (raw: unknown) => {
  const r = parseWith(scenarioInputSchema, raw);
  return r.ok ? [] : r.error.code === "invalid_input" ? r.error.issues : [r.error.code];
};

describe("scenario input schema", () => {
  it("accepts strings and numbers and produces Decimals the engine can use", () => {
    const parsed = parseWith(scenarioInputSchema, RAW_B);
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.error));
    expect(Decimal.isDecimal(parsed.value.adr)).toBe(true);
    const result = computeScenario(parsed.value as ScenarioInput);
    expect(scenarioResultSchema.safeParse(result).success).toBe(true);
    expect(verdictSchema.safeParse(result.verdict).success).toBe(true);
    expect(perNightModelSchema.safeParse(scenarioModel(parsed.value as ScenarioInput)).success).toBe(true);
  });

  it.each([
    ["more than 2 decimals", { adr: "2500.001" }, "adr"],
    ["a negative amount", { adr: "-1" }, "adr"],
    ["not a number", { adr: "abc" }, "adr"],
    ["an infinite number", { adr: Infinity }, "adr"],
    ["an amount above numeric(14,2)", { adr: "1000000000000" }, "adr"],
    ["a rate above 1", { platformFeeRate: "1.5" }, "platformFeeRate"],
    ["a rate with 5 decimals", { platformFeeRate: "0.15551" }, "platformFeeRate"],
    ["a zero average stay", { avgLengthOfStay: "0" }, "avgLengthOfStay"],
    ["blocked nights above the days", { blockedNights: 31 }, "blockedNights"],
    ["rent on an owner-operated unit", { operatingModel: "owner_operated" }, "rent"],
    ["a commission on a non-managed unit", { commission: { ...NO_COMMISSION, basis: "noi", rate: "0.2" } }, "commission"],
    ["a setup cost without a useful life", { usefulLifeMonths: 0 }, "usefulLifeMonths"],
  ])("rejects %s", (_, override, path) => {
    const issues = issuesOf({ ...RAW_B, ...override });
    expect(issues.some((i) => i.startsWith(path))).toBe(true);
  });

  it("accepts booked nights above the available nights (a warning, not an error)", () => {
    expect(issuesOf({ ...RAW_B, blockedNights: 10, bookedNights: "25" })).toEqual([]);
  });

  it("reports root-level issues", () => {
    expect(issuesOf(null)).toEqual(["(root): Invalid input: expected object, received null"]);
  });
});

describe("other input schemas", () => {
  it("stays: calendar dates only, check-out after check-in", () => {
    const stay = {
      checkIn: "2026-09-01",
      checkOut: "2026-09-04",
      accommodationRevenue: "7500.00",
      cleaningFee: "400",
      otherFees: "0",
      platformFee: "1224.50",
      currency: "EGP",
    };
    expect(stayInputSchema.safeParse(stay).success).toBe(true);
    expect(stayInputSchema.safeParse({ ...stay, checkOut: "2026-09-01" }).success).toBe(false);
    expect(stayInputSchema.safeParse({ ...stay, checkIn: "2026-02-30" }).success).toBe(false);
    expect(stayInputSchema.safeParse({ ...stay, currency: "egp" }).success).toBe(false);
  });

  it("expenses, FX amounts and assets", () => {
    expect(expenseLineSchema.safeParse({ date: "2026-09-05", categoryId: "rent", costBehavior: "fixed", amount: "100", currency: "EGP" }).success).toBe(true);
    expect(foreignAmountSchema.safeParse({ amount: "100.00", currency: "USD", fxRate: "48.7550" }).success).toBe(true);
    expect(foreignAmountSchema.safeParse({ amount: "100.00", currency: "USD", fxRate: "0" }).success).toBe(false);
    expect(foreignAmountSchema.safeParse({ amount: "100.00", currency: "USD", fxRate: "1.123456789" }).success).toBe(false);
    expect(capexAssetSchema.safeParse({ cost: "250000", usefulLifeMonths: 60, purchaseDate: "2026-01-15" }).success).toBe(true);
    expect(capexAssetSchema.safeParse({ cost: "250000", usefulLifeMonths: 0, purchaseDate: "2026-01-15" }).success).toBe(false);
  });

  it("unit-month and statement inputs turn locked months into a set", () => {
    const unitMonth = unitMonthInputSchema.parse({
      unitCurrency: "EGP",
      month: "2026-09",
      availability: { blockedNights: 0 },
      stays: [],
      expenses: [],
      depreciation: "0",
      bearerRules: { cleaning: { kind: "split", ownerShare: "0.5" } },
      lockedMonths: ["2026-08"],
    });
    expect(unitMonth.lockedMonths).toEqual(new Set(["2026-08"]));
    const statement = statementInputSchema.parse({
      unitCurrency: "EGP",
      period: "2026-09",
      basis: "cash",
      stays: [],
      expenses: [],
      commission: NO_COMMISSION,
      ownerPayouts: [{ date: "2026-09-30", amount: "20000", currency: "EGP" }],
      openingBalance: "-150.25",
    });
    expect(statement.openingBalance.toFixed(2)).toBe("-150.25");
    expect(statementInputSchema.safeParse({ ...statement, period: "2026-13" }).success).toBe(false);
  });
});

describe("output schemas match what the engine returns", () => {
  const stays = [
    {
      checkIn: "2026-09-01",
      checkOut: "2026-09-04",
      accommodationRevenue: "7500.00",
      cleaningFee: "400.00",
      otherFees: "0.00",
      platformFee: "1224.50",
      currency: "EGP",
      payoutDate: "2026-09-01",
    },
  ];

  it("allocations, unit-month P&L, statements, break-even, org profit and the grid", () => {
    for (const row of allocateStayByMonth(stays[0]!)) expect(stayMonthAllocationSchema.safeParse(row).success).toBe(true);

    const pnl = unitMonthPnl({ unitCurrency: "EGP", month: "2026-09", availability: { blockedNights: 0 }, stays, expenses: [], depreciation: 0 });
    if (!pnl.ok) throw new Error("pnl");
    expect(unitMonthPnlSchema.safeParse(pnl.value).success).toBe(true);

    const st = ownerStatement({ unitCurrency: "EGP", period: "2026-09", basis: "cash", stays, expenses: [], commission: NO_COMMISSION, ownerPayouts: [], openingBalance: 0 });
    if (!st.ok) throw new Error("statement");
    expect(ownerStatementSchema.safeParse(st.value).success).toBe(true);

    const model = perNightModelFromActuals(pnl.value);
    if (!model.ok) throw new Error("model");
    const basis = { includeIrregular: true, includeDepreciation: false };
    expect(breakEvenResultSchema.safeParse(breakEvenNights(model.value, 30, basis)).success).toBe(true);
    expect(breakEvenResultSchema.safeParse(breakEvenNights(model.value, 0, basis)).success).toBe(true);
    expect(sensitivityGridSchema.safeParse(sensitivityGrid(model.value, 30, { occupancy: "0.1", adr: "2500" }, GRID_3X3, basis)).success).toBe(true);

    for (const total of orgProfit([{ operatingModel: "owner_operated", currency: "EGP", netProfit: 1 }], [])) {
      expect(currencyTotalSchema.safeParse(total).success).toBe(true);
    }
  });

  it("rejects something that is not a Decimal", () => {
    expect(currencyTotalSchema.safeParse({ currency: "EGP", ownerRunNetProfit: 1, managedManagerProfit: 0, overhead: 0, total: 1 }).success).toBe(false);
  });
});
