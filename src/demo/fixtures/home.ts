import type { ExpenseShare, Localized, SampleChange } from "./types";
import { PORTFOLIO_OVERHEAD, UNITS } from "./units";

/**
 * Home dashboard fixtures. CLAUDE.md §7: the first element on Home answers
 * "كم ربحت فعلاً هذا الشهر؟" per the operating model — the owner view shows
 * net profit, the co-host view shows commission minus manager-borne costs.
 * The prototype shows both behind a switch; the real product shows one
 * number per the org's actual mix (CLAUDE.md §9 "Org profit").
 *
 * The month-over-month changes are sample values requested for the design
 * review (not in §4.6); every /demo screen carries the sample-data banner.
 */

const ownerUnits = UNITS.filter(
  (u) => u.operatingModel === "owner_operated" || u.operatingModel === "rental_arbitrage",
);
const managedUnits = UNITS.filter((u) => u.operatingModel === "managed_for_owner");

export const HOME_PERIOD: Localized = { ar: "سبتمبر 2026", en: "September 2026" };

export const HOME_OWNER_VIEW = {
  // 32153.00 + (-2847.00) — checked by fixtures.test.ts
  heroTotal: "29306.00",
  change: { ratio: 0.084, isSample: true } satisfies SampleChange,
  occupancy: 0.6,
  adr: "2500.00",
  revpar: "1500.00",
  units: ownerUnits,
  breakEven: {
    unitName: { ar: "شقة الشيخ زايد", en: "Sheikh Zayed apartment" } as Localized,
    bookedNights: 18,
    // BUILD_PLAN.md §4.3 (decided 2026-09-28): break-even includes the
    // monthly maintenance/irregular allowance by default. 18.99 is the
    // excluded-toggle variant (Example B2), shown as the secondary figure
    // on the calculator; Home shows only the primary (included) figure.
    breakEvenNights: "19.38",
    availableNights: 30,
    reached: false,
    // Display values derived by hand from the two above (the engine provides
    // them from Phase 1): a night isn't divisible, so the target rounds up
    // (19.38 → 20), not to the nearest night — at 19 nights the unit still
    // loses money. 20 − 18 booked = 2 nights short.
    targetNights: 20,
    nightsShort: 2,
    progress: 0.929,
  },
  // Top three of the month's 50,800.00 of expenses (see EXPENSE_BREAKDOWN).
  topExpenses: [
    { id: "rent", icon: "rent", name: { ar: "الإيجار", en: "Rent" }, amount: "35000.00", share: 0.689 },
    {
      id: "utilities",
      icon: "utilities",
      name: { ar: "الكهرباء والمياه", en: "Utilities" },
      amount: "5000.00",
      share: 0.098,
    },
    { id: "cleaning", icon: "cleaning", name: { ar: "التنظيف", en: "Cleaning" }, amount: "4200.00", share: 0.083 },
  ] satisfies ExpenseShare[],
};

export const HOME_COHOST_VIEW = {
  // 8010.60 + 4740.00 - 1500.00 — checked by fixtures.test.ts
  heroTotal: "11250.60",
  change: { ratio: 0.052, isSample: true } satisfies SampleChange,
  occupancy: 0.6,
  adr: "2500.00",
  revpar: "1500.00",
  units: managedUnits,
  overhead: PORTFOLIO_OVERHEAD,
};
