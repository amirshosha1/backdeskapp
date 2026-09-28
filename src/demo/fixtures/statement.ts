import type { Localized } from "./types";

/**
 * Owner statement fixture for the Downtown Cairo unit — Example A from
 * §4.6 exactly (managed, 20% commission on net payout, cleaning fees
 * included, owner bears all costs). The owner-payout and balance-due lines
 * are hand-picked sample figures, not part of §4.6; `fixtures.test.ts`
 * checks every line still sums to its stated total.
 */

export const STATEMENT = {
  unitName: { ar: "شقة وسط البلد", en: "Downtown Cairo apartment" } as Localized,
  ownerName: { ar: "أحمد يوسف", en: "Ahmed Youssef" } as Localized,
  period: { ar: "سبتمبر 2026", en: "September 2026" } as Localized,
  number: "0001",
  basis: "cash" as const,
  status: "finalized" as const,
  openingBalance: "0.00",
  grossRevenue: "47400.00",
  platformFees: "-7347.00",
  netPayout: "40053.00",
  ownerExpenses: [
    { category: { ar: "التنظيف", en: "Cleaning" } as Localized, amount: "-2100.00" },
    { category: { ar: "مستلزمات الضيوف", en: "Guest supplies" } as Localized, amount: "-900.00" },
    { category: { ar: "الكهرباء والمياه", en: "Utilities" } as Localized, amount: "-2500.00" },
    { category: { ar: "الإنترنت", en: "Internet" } as Localized, amount: "-600.00" },
    { category: { ar: "مصاريف الكمبوند", en: "Compound fees" } as Localized, amount: "-1000.00" },
    { category: { ar: "الصيانة", en: "Repairs" } as Localized, amount: "-800.00" },
  ],
  ownerExpensesTotal: "-7900.00",
  commissionRate: 0.2,
  commission: "-8010.60",
  ownerNet: "24142.40",
  ownerPayouts: "-20000.00",
  balanceDue: "4142.40",
};
