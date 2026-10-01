import { CATEGORIES } from "@/demo/sample-data/categories";
import type { ExpenseShare, Localized } from "./types";
import { OWNER_EXPENSES, toExpenseShare } from "./home";
import { UNITS } from "./units";
import { toMoneyString } from "@/lib/finance";

/**
 * Expense fixtures: the add-expense screen's categories (most recent
 * first, BUILD_PLAN.md Phase 5, previewed here) and September's breakdown
 * for the expense-details screen. Nothing typed into add-expense is stored.
 */

export interface ExpenseCategory {
  id: string;
  name: Localized;
}

// Every category the sample units use, plus "other" for anything that
// doesn't fit one of the named categories (BUILD_PLAN.md Phase P.1.1).
export const RECENT_CATEGORIES: ExpenseCategory[] = (
  ["cleaning", "repairs", "utilities", "consumables", "internet", "rent", "compound", "other"] as const
).map((id) => ({ id, name: CATEGORIES[id].name }));

export const EXPENSE_UNITS = UNITS;
export const DEFAULT_EXPENSE_UNIT = UNITS[0]!;

const EVERYTHING_ELSE: Localized = { ar: "مصروفات أخرى", en: "Everything else" };

/**
 * September across the owner-run units (the owner view's expenses), ranked
 * by the engine. The bubble chart draws the three largest categories plus
 * the rest folded into one "everything else" bubble, largest first.
 */
export const EXPENSE_BREAKDOWN = {
  total: toMoneyString(OWNER_EXPENSES.total),
  categories: OWNER_EXPENSES.categories.map((c) => toExpenseShare(c)),
  bubbles: [
    ...OWNER_EXPENSES.top.map((c) => toExpenseShare(c)),
    ...(OWNER_EXPENSES.rest ? [toExpenseShare(OWNER_EXPENSES.rest, EVERYTHING_ELSE)] : []),
  ].sort((a, b) => b.share - a.share) satisfies ExpenseShare[],
};
