"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";
import type { Localized } from "@/demo/fixtures/types";

/** A tickable checklist with a live count. Ticks reset on reload — nothing is stored. */
export function Checklist({ items }: { items: Localized[] }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("guide");
  const [done, setDone] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{t("checklistTitle")}</h2>
        <span className="text-sm text-muted" data-testid="checklist-progress">
          <bdi dir="ltr">{t("checklistProgress", { done: done.size, total: items.length })}</bdi>
        </span>
      </div>
      <ul className="mt-2">
        {items.map((item, index) => {
          const isDone = done.has(index);
          return (
            <li key={item.en}>
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-pressed={isDone}
                className="tap flex w-full items-center gap-3 py-3 text-start text-[0.9375rem]"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isDone ? "bg-brand text-white" : "bg-fill text-transparent",
                  )}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className={cn(isDone && "text-muted line-through")}>{item[locale]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
