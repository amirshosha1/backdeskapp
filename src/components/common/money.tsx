import Decimal from "decimal.js";
import { useLocale } from "next-intl";
import { formatMoney, type SupportedCurrency } from "@/lib/format/money";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface MoneyProps {
  amount: string;
  currency?: SupportedCurrency;
  /** Colors the text green/red by sign (profit/loss). Default: false. */
  colorBySign?: boolean;
  signDisplay?: "auto" | "always";
  className?: string;
}

/** Renders a money amount with tabular numerals, half-up rounded for display. */
export function Money({ amount, currency = "EGP", colorBySign, signDisplay, className }: MoneyProps) {
  const locale = useLocale() as AppLocale;
  const isNegative = new Decimal(amount).isNegative();

  return (
    <span
      className={cn(
        "tabular-nums-money",
        colorBySign && (isNegative ? "text-loss" : "text-profit"),
        className,
      )}
    >
      {formatMoney(amount, { locale, currency, signDisplay })}
    </span>
  );
}
