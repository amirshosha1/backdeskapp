"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";
import type { Localized } from "@/demo/fixtures/types";

/** Ticks reset on reload — this prototype stores nothing. */
export function Checklist({ items }: { items: Localized[] }) {
  const locale = useLocale() as AppLocale;
  const [done, setDone] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => {
        const isDone = done.has(index);
        return (
          <li key={item.en}>
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-pressed={isDone}
              className="flex w-full items-center gap-3 rounded-md border border-border bg-surface p-3 text-start text-sm"
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  isDone ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {isDone && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              </span>
              <span className={cn(isDone && "text-foreground-muted line-through")}>
                {item[locale]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
