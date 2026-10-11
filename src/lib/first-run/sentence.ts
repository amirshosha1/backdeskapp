import type { AppLocale } from "@/i18n/routing";
import type { ScenarioSentence } from "@/lib/finance";
import { formatNights } from "@/lib/format/nights";

/**
 * The verdict's one-line explanation as a message key under `firstRun` and
 * its values: shared by the first-run verdict and the landing page's example
 * card, so both always say the same thing about the same numbers.
 */
export function flowSentence(
  sentence: ScenarioSentence,
  booked: number,
  available: number,
  locale: AppLocale,
): { key: string; values: Record<string, string | number> } {
  switch (sentence.kind) {
    case "no_available_nights":
      return { key: "sentence.noNights", values: {} };
    case "no_break_even":
      return { key: "sentence.noBreakEven", values: {} };
    case "beyond_month":
      return { key: "sentence.beyond", values: { breakEven: formatNights(sentence.nights, locale), available } };
    case "short":
      return { key: "sentence.short", values: { breakEven: formatNights(sentence.nights, locale), booked, short: sentence.nightsShort } };
    case "at_first_profitable_night":
      return { key: "sentence.atFirst", values: { breakEven: formatNights(sentence.nights, locale), booked } };
    case "above":
      return { key: "sentence.above", values: { breakEven: formatNights(sentence.nights, locale), booked, above: sentence.nightsAbove } };
  }
}
