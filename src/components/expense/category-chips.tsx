"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";
import type { ExpenseCategory } from "@/demo/fixtures/expense";

export interface CategoryChipsProps {
  categories: ExpenseCategory[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
}

/** Most-recent-first category chips, a single-choice radio group. */
export function CategoryChips({ categories, selectedId, onSelect, label }: CategoryChipsProps) {
  const locale = useLocale() as AppLocale;

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {categories.map((category) => {
        const isSelected = category.id === selectedId;
        return (
          <button
            key={category.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(category.id)}
            className={cn(
              "tap h-11 rounded-full px-4 text-sm font-medium",
              isSelected ? "bg-ink text-white" : "bg-fill text-ink",
            )}
          >
            {category.name[locale]}
          </button>
        );
      })}
    </div>
  );
}
