"use client";

import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

export interface AmountKeypadProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * The amount step of add-expense. CLAUDE.md §7 calls for native numeric
 * keypads (`inputMode="decimal"`) rather than a custom on-screen grid, so
 * this brings up the device's own numeric keyboard. Digits typed here are
 * explicitly excluded from the 4-tap budget (BUILD_PLAN.md Phase 5).
 */
export function AmountKeypad({ value, onChange }: AmountKeypadProps) {
  const t = useTranslations("expense");
  const locale = useLocale() as AppLocale;
  const currencyLabel = locale === "ar" ? "ج.م." : "EGP";

  return (
    <label className="flex flex-col items-center gap-1 rounded-card border border-border bg-surface p-6">
      <span className="text-sm text-foreground-muted">{t("amountLabel")}</span>
      <span className="flex items-baseline gap-2">
        <input
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          placeholder="0.00"
          value={value}
          onChange={(event) => {
            const next = event.target.value.replace(/[^0-9.]/g, "");
            onChange(next);
          }}
          className="tabular-nums-money w-40 border-none bg-transparent text-center text-4xl font-bold outline-none placeholder:text-foreground-subtle"
        />
        <span className="text-lg text-foreground-muted">{currencyLabel}</span>
      </span>
    </label>
  );
}
