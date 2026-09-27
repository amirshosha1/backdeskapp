"use client";

import { useLocale, useTranslations } from "next-intl";
import { currencyLabel } from "@/lib/format/money";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface AmountKeypadProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * The amount step of add-expense: a large field that brings up the
 * phone's own numeric keypad (`inputMode="decimal"`, CLAUDE.md §7). Digits
 * typed here don't count toward the 4-tap budget (BUILD_PLAN.md Phase 5).
 */
export function AmountKeypad({ value, onChange, invalid, describedBy }: AmountKeypadProps) {
  const t = useTranslations("expense");
  const locale = useLocale() as AppLocale;

  return (
    <label className="flex flex-col items-center gap-2 py-6">
      <span className="text-sm text-muted">{t("amountLabel")}</span>
      {/* Laid out left-to-right so the currency sits on the left in both
          languages — after the number in Arabic reading order, before it in
          English — exactly as <Money /> renders amounts. */}
      <span className="flex items-baseline gap-2" dir="ltr">
        <bdi dir={locale === "ar" ? "rtl" : "ltr"} className="text-lg text-muted">
          {currencyLabel("EGP", locale)}
        </bdi>
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          value={value}
          // Sized to its digits so the currency label stays beside them.
          style={{ width: `${Math.max(1, value.length) + 0.25}ch` }}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))}
          className={cn(
            "tabular-nums-money max-w-[calc(100vw-7rem)] border-none bg-transparent text-center text-[3.5rem] leading-none font-medium tracking-tight outline-none placeholder:text-fill-strong",
            invalid && "text-loss",
          )}
        />
      </span>
    </label>
  );
}
