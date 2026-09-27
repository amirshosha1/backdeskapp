import type { ExpenseShare, Localized } from "./types";
import { UNITS } from "./units";

/**
 * Expense fixtures: the add-expense screen's categories (most recent
 * first, BUILD_PLAN.md Phase 5, previewed here) and September's breakdown
 * for the expense-details screen. Nothing typed into add-expense is stored.
 */

export interface ExpenseCategory {
  id: string;
  name: Localized;
}

export const RECENT_CATEGORIES: ExpenseCategory[] = [
  { id: "cleaning", name: { ar: "التنظيف", en: "Cleaning" } },
  { id: "repairs", name: { ar: "الصيانة", en: "Repairs" } },
  { id: "utilities", name: { ar: "الكهرباء والمياه", en: "Utilities" } },
  { id: "consumables", name: { ar: "مستلزمات الضيوف", en: "Guest supplies" } },
  { id: "internet", name: { ar: "الإنترنت", en: "Internet" } },
];

export const EXPENSE_UNITS = UNITS;
export const DEFAULT_EXPENSE_UNIT = UNITS[0]!;

/**
 * September across the two owner units (BUILD_PLAN.md §4.6 Examples A and
 * B: 7,900.00 of opex each, plus 35,000.00 rent on the arbitrage unit).
 * Shares are hand-computed to one decimal place of a percent and checked
 * against the amounts by fixtures.test.ts.
 */
export const EXPENSE_BREAKDOWN = {
  total: "50800.00",
  categories: [
    { id: "rent", icon: "rent", name: { ar: "الإيجار", en: "Rent" }, amount: "35000.00", share: 0.689 },
    {
      id: "utilities",
      icon: "utilities",
      name: { ar: "الكهرباء والمياه", en: "Utilities" },
      amount: "5000.00",
      share: 0.098,
    },
    { id: "cleaning", icon: "cleaning", name: { ar: "التنظيف", en: "Cleaning" }, amount: "4200.00", share: 0.083 },
    {
      id: "compound",
      icon: "compound",
      name: { ar: "مصاريف الكمبوند", en: "Compound fees" },
      amount: "2000.00",
      share: 0.039,
    },
    {
      id: "consumables",
      icon: "consumables",
      name: { ar: "مستلزمات الضيوف", en: "Guest supplies" },
      amount: "1800.00",
      share: 0.035,
    },
    { id: "repairs", icon: "repairs", name: { ar: "الصيانة", en: "Repairs" }, amount: "1600.00", share: 0.031 },
    { id: "internet", icon: "internet", name: { ar: "الإنترنت", en: "Internet" }, amount: "1200.00", share: 0.024 },
  ] satisfies ExpenseShare[],
  /**
   * What the bubble chart draws: the three largest categories plus the rest
   * folded into "other" (compound + supplies + repairs + internet =
   * 6,600.00). Pre-grouped here so no component sums money.
   */
  bubbles: [
    { id: "rent", icon: "rent", name: { ar: "الإيجار", en: "Rent" }, amount: "35000.00", share: 0.689 },
    { id: "other", icon: "other", name: { ar: "مصروفات أخرى", en: "Everything else" }, amount: "6600.00", share: 0.13 },
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
