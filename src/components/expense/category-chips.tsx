"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";
import type { ExpenseCategory } from "@/demo/fixtures/expense";

export interface CategoryChipsProps {
  categories: ExpenseCategory[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Most-recent-first, as the real ledger will order them (BUILD_PLAN.md Phase 5). */
export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  const locale = useLocale() as AppLocale;

  return (
    <div className="flex flex-wrap gap-2" role="group">
      {categories.map((category) => {
        const isSelected = category.id === selectedId;
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(category.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground",
            )}
          >
            {category.name[locale]}
          </button>
        );
      })}
    </div>
  );
}
