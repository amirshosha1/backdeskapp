import type { Localized } from "./types";
import { UNITS } from "./units";

/**
 * Add-expense fixtures. Category chips are ordered most-recent-first
 * (BUILD_PLAN.md Phase 5 scope, previewed here in Phase P); nothing typed
 * into this screen is stored anywhere.
 */

export interface ExpenseCategory {
  id: string;
  name: Localized;
}

export const RECENT_CATEGORIES: ExpenseCategory[] = [
  { id: "cleaning", name: { ar: "التنظيف", en: "Cleaning" } },
  { id: "maintenance", name: { ar: "الصيانة", en: "Maintenance" } },
  { id: "utilities", name: { ar: "المرافق", en: "Utilities" } },
  { id: "consumables", name: { ar: "المستلزمات", en: "Consumables" } },
  { id: "internet", name: { ar: "الإنترنت", en: "Internet" } },
];

export const DEFAULT_EXPENSE_UNIT = UNITS[0]!;
