import { useLocale } from "next-intl";
import { formatMoneyParts, type SupportedCurrency } from "@/lib/format/money";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface MoneyProps {
  amount: string;
  currency?: SupportedCurrency;
  /** Colors the text green/red by sign (profit/loss). Default: false. */
  colorBySign?: boolean;
  signDisplay?: "auto" | "always";
  /** Hide the currency label (e.g. in a column whose header names it). */
  hideCurrency?: boolean;
  decimals?: number;
  className?: string;
  currencyClassName?: string;
}

/**
 * A money amount. The signed number sits in an LTR isolate so Arabic text
 * never flips its minus sign to the wrong side ("7,347.00-"); the currency
 * label follows the number in reading order in both languages.
 */
export function Money({
  amount,
  currency = "EGP",
  colorBySign,
  signDisplay,
  hideCurrency,
  decimals,
  className,
  currencyClassName,
}: MoneyProps) {
  const locale = useLocale() as AppLocale;
  const parts = formatMoneyParts(amount, { locale, currency, signDisplay, decimals });
  const number = (
    <bdi dir="ltr" className="tabular-nums-money">
      {parts.sign}
      {parts.integer}
      {parts.fraction}
    </bdi>
  );
  const label = hideCurrency ? null : (
    <span className={cn("text-[0.8em] font-normal opacity-70", currencyClassName)}>{parts.currency}</span>
  );

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 whitespace-nowrap",
        colorBySign && (parts.isNegative ? "text-loss" : "text-profit"),
        className,
      )}
    >
      {locale === "ar" ? (
        <>
          {number}
          {label}
        </>
      ) : (
        <>
          {label}
          {number}
        </>
      )}
    </span>
  );
}
