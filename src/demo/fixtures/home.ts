import type { Localized } from "./types";
import { PORTFOLIO_OVERHEAD, UNITS } from "./units";

/**
 * Home dashboard fixtures. CLAUDE.md §7: the first element on the home
 * dashboard answers "كم ربحت فعلاً هذا الشهر؟" per the operating model —
 * owner view shows net profit, co-host view shows commission minus
 * manager-borne costs. Phase P shows both behind a switch for review; the
 * real product shows one number per the org's actual mix (see §6 "Org
 * profit").
 */

const ownerOperatedUnits = UNITS.filter(
  (u) => u.operatingModel === "owner_operated" || u.operatingModel === "rental_arbitrage",
);
const managedUnits = UNITS.filter((u) => u.operatingModel === "managed_for_owner");

export const HOME_OWNER_VIEW = {
  // 32153.00 + (-2847.00) — checked by fixtures.test.ts
  heroTotal: "29306.00",
  occupancy: 0.6,
  adr: "2500.00",
  revpar: "1500.00",
  units: ownerOperatedUnits,
  topExpenses: [
    { category: { ar: "الإيجار", en: "Rent" } as Localized, amount: "35000.00" },
    { category: { ar: "المرافق", en: "Utilities" } as Localized, amount: "5000.00" },
    { category: { ar: "التنظيف", en: "Cleaning" } as Localized, amount: "4200.00" },
  ],
  breakEven: {
    unitName: { ar: "شقة الشيخ زايد", en: "Sheikh Zayed apartment" } as Localized,
    bookedNights: 18,
    breakEvenNights: "18.99",
    availableNights: 30,
    reached: false,
  },
};

export const HOME_COHOST_VIEW = {
  // 8010.60 + 4740.00 - 1500.00 — checked by fixtures.test.ts
  heroTotal: "11250.60",
  lines: [
    ...managedUnits.map((unit) => ({
      label: unit.name,
      amount: unit.managerProfit!,
    })),
    {
      label: { ar: "تكاليف إدارية عامة", en: "Portfolio overhead" } as Localized,
      amount: PORTFOLIO_OVERHEAD,
    },
  ],
};
