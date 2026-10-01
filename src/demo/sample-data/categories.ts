import type { CostBehavior } from "@/lib/finance";
import type { ExpenseIcon, Localized } from "@/demo/fixtures/types";

/**
 * The expense categories `/demo` uses, with the default cost behaviour of
 * each (BUILD_PLAN.md §4.1 "Cost types": cleaning and consumables per stay;
 * utilities, internet, compound fees and rent fixed; repairs irregular).
 * Phase 5 seeds the same chart of accounts into `categories`.
 */
export interface SampleCategory {
  id: string;
  name: Localized;
  icon: ExpenseIcon;
  costBehavior: CostBehavior;
}

export const CATEGORIES = {
  rent: { id: "rent", name: { ar: "الإيجار", en: "Rent" }, icon: "rent", costBehavior: "fixed" },
  utilities: { id: "utilities", name: { ar: "الكهرباء والمياه", en: "Utilities" }, icon: "utilities", costBehavior: "fixed" },
  internet: { id: "internet", name: { ar: "الإنترنت", en: "Internet" }, icon: "internet", costBehavior: "fixed" },
  compound: { id: "compound", name: { ar: "مصاريف الكمبوند", en: "Compound fees" }, icon: "compound", costBehavior: "fixed" },
  cleaning: { id: "cleaning", name: { ar: "التنظيف", en: "Cleaning" }, icon: "cleaning", costBehavior: "per_stay" },
  consumables: {
    id: "consumables",
    name: { ar: "مستلزمات الضيوف", en: "Guest supplies" },
    icon: "consumables",
    costBehavior: "per_stay",
  },
  repairs: { id: "repairs", name: { ar: "الصيانة", en: "Repairs" }, icon: "repairs", costBehavior: "irregular" },
  other: { id: "other", name: { ar: "أخرى", en: "Other" }, icon: "other", costBehavior: "irregular" },
} as const satisfies Record<string, SampleCategory>;

export type CategoryId = keyof typeof CATEGORIES;
