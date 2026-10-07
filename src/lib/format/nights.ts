import Decimal from "decimal.js";
import type { AppLocale } from "@/i18n/routing";
import { formatNumber } from "./money";

/**
 * An exact night count for display (a break-even point): two decimals,
 * half-up, without a ".00" on a whole number — "21.41", "22". Whole-night
 * counts ("nights needed") are integers from the engine and go through
 * ICU plurals instead.
 */
export function formatNights(nights: Decimal.Value, locale: AppLocale): string {
  const rounded = new Decimal(nights).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return formatNumber(rounded, { locale, decimals: rounded.isInteger() ? 0 : 2 });
}
