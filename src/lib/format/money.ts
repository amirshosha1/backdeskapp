import Decimal from "decimal.js";
import type { AppLocale } from "@/i18n/routing";

/**
 * Display-only money formatting (CLAUDE.md §6.2 and §7).
 *
 * This module never computes anything — it only rounds an already-final
 * amount for presentation. Rounding is half-up, done with decimal.js so it
 * never depends on IEEE-754 float behaviour. From Phase 1 onward, every
 * amount arriving here has already gone through the pure functions in
 * `src/lib/finance/`; this formatter is not a substitute for them.
 *
 * Digits are Western (`latn`) by default; Arabic-Indic (`arab`) is wired
 * here as a user setting for a later phase (CLAUDE.md §7), even though no
 * settings UI selects it yet in Phase P.
 */

export type DigitStyle = "latn" | "arab";

export type SupportedCurrency = "EGP" | "SAR" | "AED" | "USD";

const CURRENCY_LABEL: Record<SupportedCurrency, Record<AppLocale, string>> = {
  EGP: { ar: "ج.م.", en: "EGP" },
  SAR: { ar: "ر.س.", en: "SAR" },
  AED: { ar: "د.إ.", en: "AED" },
  USD: { ar: "دولار", en: "USD" },
};

function intlLocaleTag(locale: AppLocale, digitStyle: DigitStyle): string {
  const base = locale === "ar" ? "ar-EG" : "en-US";
  return `${base}-u-nu-${digitStyle}`;
}

export interface FormatMoneyOptions {
  locale: AppLocale;
  currency?: SupportedCurrency;
  digitStyle?: DigitStyle;
  /** Show a leading "+" for positive amounts (never for zero). Default: false. */
  signDisplay?: "auto" | "always";
}

/**
 * Formats a money amount for display, e.g. "24,142.40 ج.م." (ar) or
 * "EGP 24,142.40" (en). Negative amounts get a leading "-".
 *
 * `amount` accepts anything `Decimal` accepts (string, number, Decimal) so
 * callers can pass exact string literals from fixtures or engine output
 * without ever routing an amount through JS float arithmetic beforehand.
 */
export function formatMoney(
  amount: Decimal.Value,
  { locale, currency = "EGP", digitStyle = "latn", signDisplay = "auto" }: FormatMoneyOptions,
): string {
  const rounded = new Decimal(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const isNegative = rounded.isNegative();
  const isZero = rounded.isZero();
  const abs = rounded.abs();

  // The rounding that matters (half-up, exact) already happened above with
  // decimal.js. Converting to a JS number here is safe for STR-scale amounts
  // (well under 2^53) and only feeds the digit grouping and digit-style
  // rendering, which Intl.NumberFormat does not offer for arbitrary-precision
  // decimal strings.
  const digits = new Intl.NumberFormat(intlLocaleTag(locale, digitStyle), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(abs.toNumber());

  const label = CURRENCY_LABEL[currency][locale];
  const body = locale === "ar" ? `${digits} ${label}` : `${label} ${digits}`;

  const sign = isNegative ? "-" : signDisplay === "always" && !isZero ? "+" : "";
  return `${sign}${body}`;
}

/** Formats a bare number (no currency label) with the same digit rules. */
export function formatNumber(
  amount: Decimal.Value,
  {
    locale,
    digitStyle = "latn",
    decimals = 2,
  }: { locale: AppLocale; digitStyle?: DigitStyle; decimals?: number },
): string {
  const rounded = new Decimal(amount).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
  return new Intl.NumberFormat(intlLocaleTag(locale, digitStyle), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(rounded.toNumber());
}
