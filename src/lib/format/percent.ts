import Decimal from "decimal.js";
import type { AppLocale } from "@/i18n/routing";
import { intlLocaleTag, LRI, MINUS, PDI, type DigitStyle } from "./money";

/**
 * Occupancy is never clamped silently (CLAUDE.md §7, BUILD_PLAN.md §4.1).
 * A ratio above 1 is returned unclamped from the engine together with an
 * `availability_conflict` warning; only the *displayed* value is capped at
 * 100%, alongside a visible data warning. This helper implements that cap;
 * callers decide separately whether to also show `DataWarning`.
 */
export function capDisplayRatio(ratio: number): { display: number; isOverCapacity: boolean } {
  return {
    display: Math.min(ratio, 1),
    isOverCapacity: ratio > 1,
  };
}

/**
 * Formats a ratio (0.633) as a percentage string ("63.3%"), half-up.
 * `signDisplay: "always"` gives "+8.4%" for a change; `isolate` wraps the
 * result in LRI…PDI so "%" and the sign stay put inside Arabic sentences.
 */
export function formatPercent(
  ratio: number,
  {
    locale,
    digitStyle = "latn",
    decimals = 1,
    signDisplay = "auto",
    isolate = false,
  }: {
    locale: AppLocale;
    digitStyle?: DigitStyle;
    decimals?: number;
    signDisplay?: "auto" | "always";
    isolate?: boolean;
  },
): string {
  const percentValue = new Decimal(ratio).times(100).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
  const digits = new Intl.NumberFormat(intlLocaleTag(locale, digitStyle), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentValue.abs().toNumber());
  const sign =
    percentValue.isNegative() && !percentValue.isZero()
      ? MINUS
      : signDisplay === "always" && !percentValue.isZero()
        ? "+"
        : "";
  const text = `${sign}${digits}%`;
  return isolate ? `${LRI}${text}${PDI}` : text;
}
