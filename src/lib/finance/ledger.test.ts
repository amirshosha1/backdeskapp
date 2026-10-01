// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  NO_COMMISSION,
  ownerStatement,
  perNightModelFromActuals,
  splitByBearer,
  unitMonthPnl,
  type ExpenseLine,
  type StatementStay,
} from "@/lib/finance";

/** Unit-month P&L and statement behaviour beyond the worked examples. */

const stay = (checkIn: string, checkOut: string, accommodation: string, payoutDate = checkIn): StatementStay => ({
  checkIn,
  checkOut,
  accommodationRevenue: accommodation,
  cleaningFee: "300.00",
  otherFees: "0.00",
  platformFee: "0.00",
  currency: "EGP",
  payoutDate,
});

const exp = (date: string, categoryId: string, amount: string, costBehavior: ExpenseLine["costBehavior"] = "fixed"): ExpenseLine => ({
  date,
  categoryId,
  costBehavior,
  amount,
  currency: "EGP",
});

describe("unit-month P&L", () => {
  const base = {
    unitCurrency: "EGP",
    month: "2026-09",
    availability: { blockedNights: 0 },
    depreciation: "3000.00",
  };

  it("posts an expense dated in a locked month to the next open month, and groups one-off costs with irregular ones", () => {
    const r = unitMonthPnl({
      ...base,
      stays: [stay("2026-09-10", "2026-09-12", "4000.00")],
      expenses: [exp("2026-08-20", "repairs", "500.00", "one_off"), exp("2026-09-02", "repairs", "300.00", "irregular")],
      lockedMonths: new Set(["2026-08"]),
    });
    if (!r.ok) throw new Error("failed");
    expect(r.value.opexByBehavior.irregular.toFixed(2)).toBe("800.00");
    expect(r.value.expensesByCategory).toHaveLength(1);
  });

  it("applies tax, depreciation and bearer rules", () => {
    const r = unitMonthPnl({
      ...base,
      stays: [stay("2026-09-10", "2026-09-12", "10000.00")],
      expenses: [exp("2026-09-02", "consumables", "301.00", "per_stay"), exp("2026-09-03", "utilities", "1000.00")],
      commission: { ...NO_COMMISSION, basis: "fixed_monthly", fixedFee: "2000.00" },
      bearerRules: { consumables: { kind: "split", ownerShare: "0.5" }, utilities: { kind: "manager" } },
      tax: { rate: "0.10", base: "pre_tax_profit" },
    });
    if (!r.ok) throw new Error("failed");
    const v = r.value;
    // 10,300 − 1,301 − 2,000 − 3,000 = 3,999 pre-tax → tax 399.90
    expect(v.preTaxProfit.toFixed(2)).toBe("3999.00");
    expect(v.tax.toFixed(2)).toBe("399.90");
    expect(v.netProfit.toFixed(2)).toBe("3599.10");
    expect(v.ownerBorneOpex.toFixed(2)).toBe("150.50");
    expect(v.managerBorneOpex.toFixed(2)).toBe("1150.50");
    expect(v.managerProfit.toFixed(2)).toBe("849.50");
  });

  it("rejects blocked nights above the month", () => {
    const r = unitMonthPnl({ ...base, availability: { blockedNights: 31 }, stays: [], expenses: [] });
    expect(r).toMatchObject({ ok: false, error: { code: "blocked_exceeds_days" } });
  });

  it("has no per-night model without stays", () => {
    const r = unitMonthPnl({ ...base, stays: [], expenses: [] });
    if (!r.ok) throw new Error("failed");
    expect(perNightModelFromActuals(r.value)).toEqual({ ok: false, error: { code: "no_stays" } });
  });

  it("splits a shared expense with the leftover cent on the manager's line", () => {
    const { owner, manager } = splitByBearer("100.01", { kind: "split", ownerShare: "0.5" });
    expect([owner.toFixed(2), manager.toFixed(2)]).toEqual(["50.01", "50.00"]);
    expect(splitByBearer("10.00", undefined).owner.toFixed(2)).toBe("10.00");
  });
});

describe("owner statement", () => {
  it("carries the opening balance, owner payouts and only the period's payouts (cash)", () => {
    const r = ownerStatement({
      unitCurrency: "EGP",
      period: "2026-09",
      basis: "cash",
      stays: [stay("2026-08-29", "2026-09-02", "4000.00", "2026-09-03"), stay("2026-09-28", "2026-10-01", "3000.00", "2026-10-02")],
      expenses: [exp("2026-09-05", "utilities", "1000.00"), exp("2026-09-06", "repairs", "200.00")],
      commission: { ...NO_COMMISSION, basis: "gross_revenue", rate: "0.10" },
      bearerRules: { repairs: { kind: "manager" } },
      ownerPayouts: [
        { date: "2026-09-30", amount: "1000.00", currency: "EGP" },
        { date: "2026-10-01", amount: "999.00", currency: "EGP" },
      ],
      openingBalance: "500.00",
    });
    if (!r.ok) throw new Error("failed");
    const st = r.value;
    expect(st.grossRevenue.toFixed(2)).toBe("4300.00");
    expect(st.commission.toFixed(2)).toBe("430.00");
    expect(st.ownerExpenses.map((l) => l.categoryId)).toEqual(["utilities"]);
    // 4,300 − 1,000 − 430 = 2,870; 500 + 2,870 − 1,000 = 2,370
    expect(st.ownerNet.toFixed(2)).toBe("2870.00");
    expect(st.balanceDue.toFixed(2)).toBe("2370.00");
    expect(st.managerProfit.toFixed(2)).toBe("230.00");
  });

  it("rejects an owner payout in another currency", () => {
    const r = ownerStatement({
      unitCurrency: "EGP",
      period: "2026-09",
      basis: "accrual",
      stays: [],
      expenses: [],
      commission: NO_COMMISSION,
      ownerPayouts: [{ date: "2026-09-30", amount: "100.00", currency: "USD" }],
      openingBalance: 0,
    });
    expect(r).toEqual({ ok: false, error: { code: "currency_mismatch", expected: "EGP", received: "USD" } });
  });
});
