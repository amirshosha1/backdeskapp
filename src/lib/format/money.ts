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
 * here as a user setting for a later phase (CLAUDE.md §7).
 *
 * A negative amount is written with the true minus sign (U+2212, GTM.md §5),
 * never the ASCII hyphen. Right-to-left safety: a signed number dropped into
 * Arabic text reorders badly ("7,347.00−"). Components render the number part inside an LTR
 * isolate (`<bdi dir="ltr">`, see `formatMoneyParts`); plain strings that
 * get interpolated into sentences use `isolate: true`, which wraps the
 * number in Unicode isolate marks (U+2066 … U+2069).
 */

export type DigitStyle = "latn" | "arab";

export type SupportedCurrency = "EGP" | "SAR" | "AED" | "USD";

const CURRENCY_LABEL: Record<SupportedCurrency, Record<AppLocale, string>> = {
  EGP: { ar: "ج.م.", en: "EGP" },
  SAR: { ar: "ر.س.", en: "SAR" },
  AED: { ar: "د.إ.", en: "AED" },
  USD: { ar: "دولار", en: "USD" },
};

/** The localised label for a currency, e.g. "ج.م." or "EGP". */
export function currencyLabel(currency: SupportedCurrency, locale: AppLocale): string {
  return CURRENCY_LABEL[currency][locale];
}

/** The true minus sign (U+2212) used for every displayed negative amount or percent. */
export const MINUS = "\u2212";

/** Left-to-right isolate and pop-directional-isolate marks. */
export const LRI = "⁦";
export const PDI = "⁩";

export function intlLocaleTag(locale: AppLocale, digitStyle: DigitStyle): string {
  const base = locale === "ar" ? "ar-EG" : "en-US";
  return `${base}-u-nu-${digitStyle}`;
}

export interface FormatMoneyOptions {
  locale: AppLocale;
  currency?: SupportedCurrency;
  digitStyle?: DigitStyle;
  /** Show a leading "+" for positive amounts (never for zero). Default: false. */
  signDisplay?: "auto" | "always";
  /** Number of decimals shown. Default: 2. */
  decimals?: number;
}

export interface MoneyParts {
  /** "−" (U+2212), "+" or "". The true minus sign, never the ASCII hyphen. */
  sign: string;
  /** Integer part with group separators, e.g. "29,306". */
  integer: string;
  /** Decimal separator plus fraction, e.g. ".00"; empty when decimals = 0. */
  fraction: string;
  /** Localised currency label, e.g. "ج.م." or "EGP". */
  currency: string;
  isNegative: boolean;
}

/** Splits a money amount into display parts (half-up rounded). */
export function formatMoneyParts(
  amount: Decimal.Value,
  {
    locale,
    currency = "EGP",
    digitStyle = "latn",
    signDisplay = "auto",
    decimals = 2,
  }: FormatMoneyOptions,
): MoneyParts {
  const rounded = new Decimal(amount).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
  const isNegative = rounded.isNegative() && !rounded.isZero();
  const isZero = rounded.isZero();

  // The rounding that matters (half-up, exact) already happened above with
  // decimal.js. Converting the absolute value to a JS number is safe for
  // STR-scale amounts (well under 2^53) and only feeds digit grouping.
  const parts = new Intl.NumberFormat(intlLocaleTag(locale, digitStyle), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).formatToParts(rounded.abs().toNumber());

  let integer = "";
  let fraction = "";
  for (const part of parts) {
    if (part.type === "integer" || part.type === "group") integer += part.value;
    else if (part.type === "decimal" || part.type === "fraction") fraction += part.value;
  }

  const sign = isNegative ? MINUS : signDisplay === "always" && !isZero ? "+" : "";
  return { sign, integer, fraction, currency: CURRENCY_LABEL[currency][locale], isNegative };
}

/**
 * Formats a money amount as one string, e.g. "24,142.40 ج.م." (ar) or
 * "EGP 24,142.40" (en). With `isolate`, the signed number is wrapped in
 * LRI…PDI so it keeps its sign on the correct side inside Arabic text.
 */
export function formatMoney(
  amount: Decimal.Value,
  options: FormatMoneyOptions & { isolate?: boolean },
): string {
  const { sign, integer, fraction, currency } = formatMoneyParts(amount, options);
  const number = `${sign}${integer}${fraction}`;
  const shown = options.isolate ? `${LRI}${number}${PDI}` : number;
  return options.locale === "ar" ? `${shown} ${currency}` : `${currency} ${shown}`;
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
