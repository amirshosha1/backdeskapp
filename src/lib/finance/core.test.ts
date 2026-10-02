// @vitest-environment node
import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  aggregateKpis,
  allocateProportionally,
  allocateStayByMonth,
  cashOnCash,
  computeKpis,
  computeTax,
  daysInMonth,
  expenseBreakdown,
  monthlyDepreciation,
  nextMonth,
  nightsAvailable,
  paybackMonths,
  postAllocations,
  postingDate,
  previousMonth,
  requireUnitCurrency,
  roundMoney,
  splitEvenly,
  straightLineMonthly,
  toMoneyString,
  totalCashInvested,
  toUnitCurrency,
} from "@/lib/finance";

const s = (d: Decimal | null) => (d === null ? null : d.toFixed(2));

describe("money", () => {
  it("rounds half-up to piastres", () => {
    expect(roundMoney("12.345").toFixed()).toBe("12.35");
    expect(roundMoney("-12.345").toFixed()).toBe("-12.35");
    expect(toMoneyString("7")).toBe("7.00");
  });

  it("rejects a split into no parts", () => {
    expect(() => splitEvenly(10, 0)).toThrow(RangeError);
    expect(() => splitEvenly(10, 1.5)).toThrow(RangeError);
    expect(() => allocateProportionally(10, [])).toThrow(RangeError);
  });

  it("splits evenly when every weight is zero", () => {
    expect(allocateProportionally("10.00", [0, 0, 0]).map((d) => d.toFixed(2))).toEqual(["3.33", "3.33", "3.34"]);
  });

  it("gives the leftover cent to the last non-zero line", () => {
    expect(allocateProportionally("1.00", [1, 1, 1, 0]).map((d) => d.toFixed(2))).toEqual(["0.33", "0.33", "0.34", "0.00"]);
  });
});

describe("fx", () => {
  it("accepts the unit currency with no rate or a rate of 1", () => {
    expect(toUnitCurrency({ amount: "5.00", currency: "EGP" }, "EGP")).toEqual({ ok: true, value: new Decimal("5.00") });
    expect(toUnitCurrency({ amount: "5.00", currency: "EGP", fxRate: "1.0000" }, "EGP").ok).toBe(true);
  });

  it("rejects a rate other than 1 for the unit currency, and a non-positive rate", () => {
    expect(toUnitCurrency({ amount: 5, currency: "EGP", fxRate: 2 }, "EGP")).toEqual({
      ok: false,
      error: { code: "invalid_fx_rate", currency: "EGP" },
    });
    expect(toUnitCurrency({ amount: 5, currency: "USD", fxRate: 0 }, "EGP")).toEqual({
      ok: false,
      error: { code: "invalid_fx_rate", currency: "USD" },
    });
  });

  it("requireUnitCurrency passes a match and types a mismatch", () => {
    expect(requireUnitCurrency("EGP", "EGP")).toEqual({ ok: true, value: true });
    expect(requireUnitCurrency("USD", "EGP")).toEqual({
      ok: false,
      error: { code: "currency_mismatch", expected: "EGP", received: "USD" },
    });
  });
});

describe("period", () => {
  it("knows month lengths, including leap years", () => {
    expect(daysInMonth("2026-09")).toBe(30);
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
    expect(nextMonth("2026-12")).toBe("2027-01");
    expect(previousMonth("2027-01")).toBe("2026-12");
  });

  it("counts available nights from a mid-month go-live date", () => {
    expect(nightsAvailable({ month: "2026-09", blockedNights: 0, goLiveDate: "2026-09-16" })).toEqual({ ok: true, value: 15 });
    expect(nightsAvailable({ month: "2026-09", blockedNights: 2, goLiveDate: "2026-09-16" })).toEqual({ ok: true, value: 13 });
    expect(nightsAvailable({ month: "2026-09", blockedNights: 0, goLiveDate: "2026-10-01" })).toEqual({ ok: true, value: 0 });
    expect(nightsAvailable({ month: "2026-09", blockedNights: 0, goLiveDate: "2025-01-01" })).toEqual({ ok: true, value: 30 });
  });

  it("zero available nights when every night is blocked; rejects blocked nights above the nights counted", () => {
    expect(nightsAvailable({ month: "2026-09", blockedNights: 30 })).toEqual({ ok: true, value: 0 });
    expect(nightsAvailable({ month: "2026-09", blockedNights: 20, goLiveDate: "2026-09-16" })).toEqual({
      ok: false,
      error: { code: "blocked_exceeds_days", month: "2026-09", blockedNights: 20, days: 15 },
    });
  });

  it("recognizes the cleaning fee and its fee share on the check-in month", () => {
    const [aug, sep] = allocateStayByMonth({
      checkIn: "2026-08-30",
      checkOut: "2026-09-02",
      accommodationRevenue: "3000.00",
      cleaningFee: "300.00",
      otherFees: "0.00",
      platformFee: "330.00",
    });
    expect(aug).toMatchObject({ month: "2026-08", nights: 2 });
    expect(s(aug!.cleaningFee)).toBe("300.00");
    expect(s(aug!.platformFeeOnCleaning)).toBe("30.00");
    expect(s(aug!.platformFee)).toBe("230.00");
    expect(s(sep!.cleaningFee)).toBe("0.00");
    expect(s(sep!.platformFee)).toBe("100.00");
  });

  it("rejects a stay without nights", () => {
    expect(() =>
      allocateStayByMonth({ checkIn: "2026-09-02", checkOut: "2026-09-02", accommodationRevenue: 1, cleaningFee: 0, otherFees: 0, platformFee: 0 }),
    ).toThrow(RangeError);
  });

  it("posts anything dated in a locked month to the first open month, keeping the original date", () => {
    const locked = new Set(["2026-08", "2026-09"]);
    expect(postingDate("2026-08-20", locked)).toEqual({ date: "2026-10-01", occurredOn: "2026-08-20" });
    expect(postingDate("2026-10-05", locked)).toEqual({ date: "2026-10-05", occurredOn: "2026-10-05" });
  });

  it("re-posts the locked part of a stay crossing into a locked month", () => {
    const rows = allocateStayByMonth({
      checkIn: "2026-08-30",
      checkOut: "2026-09-03",
      accommodationRevenue: "4000.00",
      cleaningFee: 0,
      otherFees: 0,
      platformFee: 0,
    });
    const posted = postAllocations(rows, new Set(["2026-08"]));
    expect(posted.map((r) => [r.month, r.occurredMonth, r.nights])).toEqual([
      ["2026-09", "2026-08", 2],
      ["2026-09", "2026-09", 2],
    ]);
  });
});

describe("kpis", () => {
  it("zero available nights → null occupancy and RevPAR; zero stays → null ADR", () => {
    expect(computeKpis({ nightsAvailable: 0, bookedNights: 0, accommodationRevenue: 0 })).toMatchObject({
      occupancy: null,
      adr: null,
      revpar: null,
      warnings: [],
    });
    const none = computeKpis({ nightsAvailable: 30, bookedNights: 0, accommodationRevenue: 0 });
    expect(s(none.occupancy)).toBe("0.00");
    expect(none.adr).toBeNull();
  });

  it("aggregates a portfolio weighted by nights", () => {
    const kpis = aggregateKpis([
      { nightsAvailable: 30, bookedNights: 20, accommodationRevenue: 40000 },
      { nightsAvailable: 30, bookedNights: 10, accommodationRevenue: 10000 },
    ]);
    expect(kpis.occupancy!.toFixed(4)).toBe("0.5000");
    expect(s(kpis.adr)).toBe("1666.67");
    expect(s(kpis.revpar)).toBe("833.33");
  });

  it("ranks expense categories, keeps ties in order, and folds the tail", () => {
    const b = expenseBreakdown(
      [
        { id: "a", amount: 100 },
        { id: "b", amount: 300 },
        { id: "c", amount: 100 },
        { id: "d", amount: 500 },
      ],
      2,
    );
    expect(b.categories.map((c) => c.id)).toEqual(["d", "b", "a", "c"]);
    expect(b.top.map((c) => c.id)).toEqual(["d", "b"]);
    expect(b.rest).toMatchObject({ id: "other", ids: ["a", "c"] });
    expect(s(b.rest!.amount)).toBe("200.00");
    expect(b.rest!.share.toFixed(2)).toBe("0.20");
  });

  it("has no tail when everything fits, and zero shares on a zero total", () => {
    const b = expenseBreakdown([{ id: "a", amount: 0 }], 3);
    expect(b.rest).toBeNull();
    expect(b.categories[0]!.share.isZero()).toBe(true);
  });
});

describe("tax bases", () => {
  it("taxes gross revenue or net payout when configured", () => {
    const figures = { preTaxProfit: -500, grossRevenue: "10000.00", netPayout: "8450.00" };
    expect(s(computeTax({ rate: "0.05", base: "gross_revenue" }, figures))).toBe("500.00");
    expect(s(computeTax({ rate: "0.05", base: "net_payout" }, figures))).toBe("422.50");
    expect(s(computeTax({ rate: null, base: "gross_revenue" }, figures))).toBe("0.00");
  });
});

describe("investment", () => {
  it("depreciates straight line within the asset's life only", () => {
    const assets = [
      { cost: "250000.00", usefulLifeMonths: 60, purchaseDate: "2026-01-15" },
      { cost: "12000.00", salvageValue: "2000.00", usefulLifeMonths: 10, purchaseDate: "2026-09-01" },
    ];
    expect(s(monthlyDepreciation(assets, "2025-12"))).toBe("0.00");
    expect(s(monthlyDepreciation(assets, "2026-01"))).toBe("4166.67");
    expect(s(monthlyDepreciation(assets, "2026-09"))).toBe("5166.67");
    expect(s(monthlyDepreciation(assets, "2027-07"))).toBe("4166.67");
    expect(s(monthlyDepreciation(assets, "2031-01"))).toBe("0.00");
    expect(straightLineMonthly(1000, 0, 0).isZero()).toBe(true);
  });

  it("payback and cash-on-cash", () => {
    const invested = totalCashInvested({ capex: 250000, deposits: 70000, preOpeningCosts: 5000 });
    expect(s(invested)).toBe("325000.00");
    expect(s(paybackMonths(invested, 25000))).toBe("13.00");
    expect(paybackMonths(invested, 0)).toBeNull();
    expect(paybackMonths(invested, -100)).toBeNull();
    expect(paybackMonths(0, 1000)).toBeNull();
    expect(cashOnCash(invested, 65000)!.toFixed(2)).toBe("0.20");
    expect(cashOnCash(0, 65000)).toBeNull();
  });
});
