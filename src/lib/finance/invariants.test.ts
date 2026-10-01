// @vitest-environment node
import Decimal from "decimal.js";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  allocatePlatformFee,
  allocateProportionally,
  allocateStayByMonth,
  breakEvenNights,
  computeCommission,
  computeKpis,
  computeScenario,
  computeTax,
  displayOccupancy,
  modelPnl,
  NO_COMMISSION,
  ownerStatement,
  roundMoney,
  splitEvenly,
  sumMoney,
  unitMonthPnl,
  type BreakEvenResult,
  type CommissionTerms,
  type ExpenseLine,
  type PerNightModel,
  type ProfitBasis,
  type ScenarioInput,
  type StatementStay,
} from "@/lib/finance";

/** BUILD_PLAN.md §4.7 — invariants as property-based tests. */

const RUNS = { numRuns: 300 };

const cents = (min: number, max: number) => fc.integer({ min, max }).map((c) => new Decimal(c).dividedBy(100));
const rate = (maxBasisPoints: number) => fc.integer({ min: 0, max: maxBasisPoints }).map((bp) => new Decimal(bp).dividedBy(10_000));
const isPiastres = (d: Decimal) => d.decimalPlaces() <= 2;

const commissionTerms: fc.Arbitrary<CommissionTerms> = fc.record({
  basis: fc.constantFrom("none", "gross_revenue", "net_payout", "noi", "fixed_monthly", "hybrid"),
  rate: rate(5000),
  fixedFee: cents(0, 1_000_000),
  hybridMode: fc.constantFrom("sum", "max"),
  hybridBasis: fc.constantFrom("gross_revenue", "net_payout", "noi"),
  includeCleaningFees: fc.boolean(),
});

const perNightModel: fc.Arbitrary<PerNightModel> = fc.record({
  adr: cents(5_000, 2_000_000),
  avgLengthOfStay: fc.integer({ min: 10, max: 100 }).map((t) => new Decimal(t).dividedBy(10)),
  cleaningFeePerStay: cents(0, 200_000),
  otherIncomePerStay: cents(0, 50_000),
  platformFeeRate: rate(3000),
  perStayCosts: cents(0, 150_000),
  perNightCosts: cents(0, 30_000),
  fixedCosts: cents(0, 10_000_000),
  irregularCosts: cents(0, 500_000),
  depreciation: cents(0, 1_000_000),
  commission: commissionTerms,
});

const basis: fc.Arbitrary<ProfitBasis> = fc.record({ includeIrregular: fc.boolean(), includeDepreciation: fc.boolean() });

const displayed = (d: Decimal) => roundMoney(d);

/**
 * The same-basis rule (Phase 1 review, 2026-10-01): any break-even shown
 * next to a profit figure is checked against `profitAt`, the function that
 * produces that displayed profit. At the whole-night target the displayed
 * profit is ≥ 0; one night fewer it is < 0.
 */
function expectSameBasisBreakEven(result: BreakEvenResult, profitAt: (n: Decimal.Value) => Decimal) {
  if (result.kind !== "reached") return;
  const ceil = result.nights.toDecimalPlaces(0, Decimal.ROUND_UP).toNumber();
  const floor = result.nights.toDecimalPlaces(0, Decimal.ROUND_DOWN).toNumber();

  // ceil(break_even_nights): displayed profit ≥ 0.
  expect(displayed(profitAt(ceil)).greaterThanOrEqualTo(0)).toBe(true);
  // floor (for a fractional break-even): the profit is < 0, and never displays as a gain.
  if (floor !== ceil) {
    expect(profitAt(floor).lessThan(0)).toBe(true);
    expect(displayed(profitAt(floor)).lessThanOrEqualTo(0)).toBe(true);
  } else if (floor >= 1) {
    expect(profitAt(floor - 1).lessThan(0)).toBe(true);
  }
  // The whole-night target the UI shows: displayed ≥ 0 there, displayed < 0 one night earlier.
  expect(displayed(profitAt(result.wholeNights)).greaterThanOrEqualTo(0)).toBe(true);
  if (result.wholeNights >= 1) expect(displayed(profitAt(result.wholeNights - 1)).lessThan(0)).toBe(true);
  expect([floor, ceil]).toContain(result.wholeNights);
}

describe("break-even (§4.3, §4.7)", () => {
  it("when reached: profit there is 0 (± 0.01) and negative for every n below it", () => {
    fc.assert(
      fc.property(perNightModel, fc.integer({ min: 1, max: 31 }), basis, (model, available, b) => {
        const result = breakEvenNights(model, available, b);
        const profit = (n: Decimal.Value) => modelPnl(model, n, b).profit;
        if (result.kind === "unreachable") {
          expect(profit(available).lessThan(0)).toBe(true);
          return;
        }
        expect(result.nights.greaterThanOrEqualTo(0)).toBe(true);
        expect(result.nights.lessThanOrEqualTo(available)).toBe(true);
        expect(profit(result.nights).abs().lessThanOrEqualTo("0.01")).toBe(true);
        for (let i = 0; i < 20; i++) {
          const n = result.nights.times(i).dividedBy(20);
          if (n.lessThan(result.nights.minus("1e-6"))) expect(profit(n).lessThan(0)).toBe(true);
        }
      }),
      RUNS,
    );
  });

  it("same basis: at ceil(break-even) the displayed profit is ≥ 0, at floor it is < 0", () => {
    fc.assert(
      fc.property(perNightModel, fc.integer({ min: 1, max: 31 }), basis, (model, available, b) => {
        expectSameBasisBreakEven(breakEvenNights(model, available, b), (n) => modelPnl(model, n, b).profit);
      }),
      RUNS,
    );
  });

  it("is never negative or infinite", () => {
    fc.assert(
      fc.property(perNightModel, fc.integer({ min: 0, max: 31 }), basis, (model, available, b) => {
        const result = breakEvenNights(model, available, b);
        if (result.kind === "reached") {
          expect(result.nights.isFinite()).toBe(true);
          expect(result.nights.isNegative()).toBe(false);
        }
      }),
      RUNS,
    );
  });
});

const scenarioInput: fc.Arbitrary<ScenarioInput> = fc
  .record({
    operatingModel: fc.constantFrom("owner_operated", "rental_arbitrage", "managed_for_owner"),
    daysInPeriod: fc.constantFrom(28, 29, 30, 31),
    blockedNights: fc.integer({ min: 0, max: 10 }),
    bookedNights: fc.integer({ min: 0, max: 31 }),
    adr: cents(5_000, 2_000_000),
    avgLengthOfStay: fc.integer({ min: 10, max: 60 }).map((t) => new Decimal(t).dividedBy(10)),
    cleaningFeePerStay: cents(0, 100_000),
    platformFeeRate: rate(3000),
    rent: cents(0, 6_000_000),
    utilities: cents(0, 600_000),
    cleaning: cents(0, 100_000),
    perNight: cents(0, 20_000),
    repairs: cents(0, 300_000),
    setupCost: cents(0, 50_000_000),
    usefulLifeMonths: fc.integer({ min: 1, max: 120 }),
    deposit: cents(0, 10_000_000),
    commission: commissionTerms,
  })
  .map((r) => ({
    operatingModel: r.operatingModel,
    daysInPeriod: r.daysInPeriod,
    blockedNights: r.blockedNights,
    bookedNights: r.bookedNights,
    adr: r.adr,
    avgLengthOfStay: r.avgLengthOfStay,
    cleaningFeePerStay: r.cleaningFeePerStay,
    platformFeeRate: r.platformFeeRate,
    rent: r.operatingModel === "rental_arbitrage" ? r.rent : 0,
    fixedCosts: [{ id: "utilities", amount: r.utilities }],
    perStayCosts: [{ id: "cleaning", amount: r.cleaning }],
    perNightCosts: [{ id: "laundry", amount: r.perNight }],
    irregularCosts: [{ id: "repairs", amount: r.repairs }],
    setupCost: r.setupCost,
    usefulLifeMonths: r.usefulLifeMonths,
    deposit: r.operatingModel === "rental_arbitrage" ? r.deposit : 0,
    commission: r.operatingModel === "managed_for_owner" ? r.commission : NO_COMMISSION,
  }));

describe("calculator: every break-even sits on the basis of the profit it is shown with", () => {
  it("primary break-even ↔ profit before depreciation; with-depreciation break-even ↔ net profit", () => {
    fc.assert(
      fc.property(scenarioInput, (input) => {
        const result = computeScenario(input);
        expectSameBasisBreakEven(result.breakEven.primary, (n) =>
          computeScenario({ ...input, bookedNights: n }).profitBeforeDepreciation,
        );
        expectSameBasisBreakEven(result.breakEven.includingDepreciation, (n) =>
          computeScenario({ ...input, bookedNights: n }).netProfit,
        );
      }),
      { numRuns: 150 },
    );
  });

  it("the verdict agrees with the sign of the displayed headline profit", () => {
    fc.assert(
      fc.property(scenarioInput, (input) => {
        const { verdict, profitBeforeDepreciation } = computeScenario(input);
        const shown = displayed(profitBeforeDepreciation);
        if (verdict.kind === "profitable") expect(shown.greaterThan(0)).toBe(true);
        if (verdict.kind === "loss" || verdict.kind === "unreachable") expect(shown.lessThan(0)).toBe(true);
        if (verdict.kind === "at_break_even") expect(shown.isZero()).toBe(true);
      }),
      { numRuns: 150 },
    );
  });
});

describe("occupancy, commission and tax bounds (§4.7)", () => {
  it("occupancy ≥ 0; > 1 only with an availability_conflict warning; displayed ≤ 100%", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 31 }), fc.integer({ min: 0, max: 40 }), cents(0, 10_000_000), (available, booked, revenue) => {
        const kpis = computeKpis({ nightsAvailable: available, bookedNights: booked, accommodationRevenue: revenue });
        if (kpis.occupancy === null) return;
        expect(kpis.occupancy.isNegative()).toBe(false);
        if (kpis.occupancy.greaterThan(1)) expect(kpis.warnings.map((w) => w.code)).toEqual(["availability_conflict"]);
        expect(displayOccupancy(kpis.occupancy)!.lessThanOrEqualTo(1)).toBe(true);
      }),
      RUNS,
    );
  });

  it("commission ≥ 0 and tax ≥ 0", () => {
    fc.assert(
      fc.property(commissionTerms, cents(0, 10_000_000), cents(0, 1_000_000), rate(3000), cents(-5_000_000, 5_000_000), (terms, gross, cleaning, feeRate, noi) => {
        const total = gross.plus(cleaning);
        const fees = total.times(feeRate);
        const commission = computeCommission(terms, {
          grossRevenue: total,
          cleaningFees: cleaning,
          platformFeesOnCleaning: cleaning.times(feeRate),
          netPayout: total.minus(fees),
          noi,
        });
        expect(commission.isNegative()).toBe(false);
        const tax = computeTax({ rate: "0.2", base: "pre_tax_profit" }, { preTaxProfit: noi, grossRevenue: total, netPayout: 0 });
        expect(tax.isNegative()).toBe(false);
      }),
      RUNS,
    );
  });
});

describe("splits sum exactly to the whole (§4.7)", () => {
  it("splitEvenly", () => {
    fc.assert(
      fc.property(cents(-10_000_000, 10_000_000), fc.integer({ min: 1, max: 60 }), (total, parts) => {
        const lines = splitEvenly(total, parts);
        expect(lines).toHaveLength(parts);
        expect(sumMoney(lines).equals(total)).toBe(true);
        expect(lines.every(isPiastres)).toBe(true);
      }),
      RUNS,
    );
  });

  it("allocateProportionally; zero-weight lines stay zero", () => {
    fc.assert(
      fc.property(cents(0, 10_000_000), fc.array(cents(0, 1_000_000), { minLength: 1, maxLength: 8 }), (total, weights) => {
        const lines = allocateProportionally(total, weights);
        expect(sumMoney(lines).equals(total)).toBe(true);
        expect(lines.every(isPiastres)).toBe(true);
        if (!sumMoney(weights).isZero()) weights.forEach((w, i) => w.isZero() && expect(lines[i]!.isZero()).toBe(true));
      }),
      RUNS,
    );
  });

  it("platform-fee allocation conserves the total fee", () => {
    fc.assert(
      fc.property(cents(0, 1_000_000), cents(0, 5_000_000), cents(0, 200_000), cents(0, 100_000), (fee, a, c, o) => {
        const allocation = allocatePlatformFee(fee, { accommodation: a, cleaning: c, other: o });
        expect(sumMoney([allocation.accommodation, allocation.cleaning, allocation.other]).equals(fee)).toBe(true);
      }),
      RUNS,
    );
  });
});

const stayArb: fc.Arbitrary<StatementStay> = fc
  .record({
    startDay: fc.integer({ min: 0, max: 120 }),
    nights: fc.integer({ min: 1, max: 40 }),
    accommodation: cents(10_000, 5_000_000),
    cleaning: cents(0, 100_000),
    other: cents(0, 50_000),
    feeRate: rate(2000),
    payoutLag: fc.integer({ min: -5, max: 40 }),
  })
  .map((r) => {
    const day = (offset: number) => new Date(Date.UTC(2026, 0, 1 + offset)).toISOString().slice(0, 10);
    const gross = r.accommodation.plus(r.cleaning).plus(r.other);
    return {
      checkIn: day(r.startDay),
      checkOut: day(r.startDay + r.nights),
      accommodationRevenue: r.accommodation,
      cleaningFee: r.cleaning,
      otherFees: r.other,
      platformFee: roundMoney(gross.times(r.feeRate)),
      currency: "EGP",
      payoutDate: day(r.startDay + r.payoutLag),
    };
  });

const MONTHS_2026 = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`);
const MONTHS_SPAN = [...MONTHS_2026, "2025-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06"];

describe("revenue recognition (§4.4, §4.7)", () => {
  it("proration conserves nights, revenue and fees across months", () => {
    fc.assert(
      fc.property(stayArb, (stay) => {
        const rows = allocateStayByMonth(stay);
        const nights = Math.round((Date.parse(stay.checkOut) - Date.parse(stay.checkIn)) / 86_400_000);
        expect(rows.reduce((n, r) => n + r.nights, 0)).toBe(nights);
        expect(sumMoney(rows.map((r) => r.accommodationRevenue)).equals(stay.accommodationRevenue)).toBe(true);
        expect(sumMoney(rows.map((r) => r.platformFee)).equals(stay.platformFee)).toBe(true);
        expect(rows.every((r) => isPiastres(r.accommodationRevenue) && isPiastres(r.platformFee))).toBe(true);
      }),
      RUNS,
    );
  });

  it("cash and accrual views reconcile over full closed stays", () => {
    fc.assert(
      fc.property(fc.array(stayArb, { minLength: 1, maxLength: 5 }), (stays) => {
        const total = (basis: "cash" | "accrual") =>
          sumMoney(
            MONTHS_SPAN.map((period) => {
              const r = ownerStatement({
                unitCurrency: "EGP",
                period,
                basis,
                stays,
                expenses: [],
                commission: NO_COMMISSION,
                ownerPayouts: [],
                openingBalance: 0,
              });
              return r.ok ? r.value.netPayout : new Decimal(NaN);
            }),
          );
        const expected = sumMoney(stays.map((s) => new Decimal(s.accommodationRevenue).plus(s.cleaningFee).plus(s.otherFees).minus(s.platformFee)));
        expect(total("cash").equals(expected)).toBe(true);
        expect(total("accrual").equals(expected)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

const expenseArb: fc.Arbitrary<ExpenseLine> = fc.record({
  date: fc.integer({ min: 1, max: 30 }).map((d) => `2026-09-${String(d).padStart(2, "0")}`),
  categoryId: fc.constantFrom("cleaning", "utilities", "repairs", "rent"),
  costBehavior: fc.constantFrom("fixed", "per_stay", "irregular", "per_night", "one_off"),
  amount: cents(1, 5_000_000),
  currency: fc.constant("EGP"),
});

describe("statements and P&L", () => {
  const setup = fc.record({
    stays: fc.array(stayArb, { maxLength: 6 }),
    expenses: fc.array(expenseArb, { maxLength: 10 }),
    terms: commissionTerms,
    ownerShare: rate(10_000),
    payouts: fc.array(cents(0, 5_000_000), { maxLength: 3 }),
    opening: cents(-5_000_000, 5_000_000),
  });

  it("statement lines sum exactly to the statement totals, in whole piastres", () => {
    fc.assert(
      fc.property(setup, fc.constantFrom("cash", "accrual") as fc.Arbitrary<"cash" | "accrual">, (s, basisKind) => {
        const r = ownerStatement({
          unitCurrency: "EGP",
          period: "2026-09",
          basis: basisKind,
          stays: s.stays,
          expenses: s.expenses,
          commission: s.terms,
          bearerRules: { cleaning: { kind: "split", ownerShare: s.ownerShare }, repairs: { kind: "manager" } },
          ownerPayouts: s.payouts.map((amount) => ({ date: "2026-09-15", amount, currency: "EGP" })),
          openingBalance: s.opening,
        });
        if (!r.ok) throw new Error("statement failed");
        const st = r.value;
        expect(sumMoney(st.ownerExpenses.map((l) => l.amount)).equals(st.ownerExpensesTotal)).toBe(true);
        expect(st.netPayout.minus(st.ownerExpensesTotal).minus(st.commission).equals(st.ownerNet)).toBe(true);
        expect(st.openingBalance.plus(st.ownerNet).minus(st.ownerPayouts).equals(st.balanceDue)).toBe(true);
        expect(st.ownerExpensesTotal.plus(st.managerBorneOpex).equals(sumMoney(s.expenses.map((e) => e.amount)))).toBe(true);
        for (const d of [st.grossRevenue, st.platformFees, st.commission, st.ownerNet, st.balanceDue]) expect(isPiastres(d)).toBe(true);
      }),
      { numRuns: 150 },
    );
  });

  it("results are independent of transaction order", () => {
    fc.assert(
      fc.property(setup, fc.integer(), (s, seed) => {
        const shuffle = <T,>(xs: readonly T[]) => {
          const copy = [...xs];
          let x = seed;
          for (let i = copy.length - 1; i > 0; i--) {
            x = (x * 1103515245 + 12345) & 0x7fffffff;
            const j = x % (i + 1);
            [copy[i], copy[j]] = [copy[j]!, copy[i]!];
          }
          return copy;
        };
        const run = (stays: readonly StatementStay[], expenses: readonly ExpenseLine[]) => {
          const r = unitMonthPnl({
            unitCurrency: "EGP",
            month: "2026-09",
            availability: { blockedNights: 0 },
            stays,
            expenses,
            depreciation: 0,
            commission: s.terms,
          });
          if (!r.ok) throw new Error("pnl failed");
          const { expensesByCategory, ...rest } = r.value;
          return {
            ...rest,
            expensesByCategory: [...expensesByCategory].sort((a, b) => a.categoryId.localeCompare(b.categoryId)),
          };
        };
        expect(JSON.stringify(run(shuffle(s.stays), shuffle(s.expenses)))).toBe(JSON.stringify(run(s.stays, s.expenses)));
      }),
      { numRuns: 150 },
    );
  });

  it("inputs in a currency other than the unit currency are rejected with a typed error", () => {
    fc.assert(
      fc.property(stayArb, expenseArb, fc.constantFrom("USD", "SAR", "AED", "EUR"), fc.boolean(), (stay, exp, currency, onStay) => {
        const r = unitMonthPnl({
          unitCurrency: "EGP",
          month: "2026-09",
          availability: { blockedNights: 0 },
          stays: [onStay ? { ...stay, currency } : stay],
          expenses: [onStay ? exp : { ...exp, currency }],
          depreciation: 0,
        });
        expect(r).toEqual({ ok: false, error: { code: "currency_mismatch", expected: "EGP", received: currency } });
      }),
      RUNS,
    );
  });
});
