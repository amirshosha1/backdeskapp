import Decimal from "decimal.js";

/**
 * Shared amount parser for every numeric input in `/demo` (BUILD_PLAN.md
 * Phase P.1.1; reused by the live calculator from Phase 1). Hosts type
 * amounts with Arabic-Indic or Persian digits, an Arabic decimal separator,
 * or thousands separators copied from a bank statement — this is the one
 * place that turns all of that into a `Decimal` or a typed error, so no
 * screen re-implements its own number parsing (CLAUDE.md §6.1).
 */

export type ParseAmountErrorCode = "empty" | "invalid" | "non_positive";

export type ParseAmountResult =
  | { ok: true; value: Decimal }
  | { ok: false; error: ParseAmountErrorCode };

// U+0660-U+0669 (Arabic-Indic) and U+06F0-U+06F9 (Extended Arabic-Indic /
// Persian) digits, in order, mapped to "0"-"9".
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** A strict "-?123" or "-?123.45" or "-?123.4" shape — nothing else. */
const NUMERIC_SHAPE = /^-?[0-9]+(\.[0-9]+)?$/;

function normalizeDigits(input: string): string {
  return Array.from(input)
    .map((char) => {
      const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(char);
      if (arabicIndex !== -1) return String(arabicIndex);
      const persianIndex = PERSIAN_DIGITS.indexOf(char);
      if (persianIndex !== -1) return String(persianIndex);
      return char;
    })
    .join("");
}

/**
 * Parses a host-typed amount into a positive `Decimal`, or a typed error:
 * - `empty` — nothing was typed (after trimming).
 * - `invalid` — not a well-formed number: letters, more than one decimal
 *   point, or more than 2 decimal places.
 * - `non_positive` — a well-formed number that is zero or negative.
 */
export function parseAmount(input: string): ParseAmountResult {
  if (input.trim().length === 0) return { ok: false, error: "empty" };

  let normalized = normalizeDigits(input.trim());
  // ٫ (U+066B) is the Arabic decimal separator.
  normalized = normalized.replace(/٫/g, ".");
  // ٬ (U+066C, Arabic) and "," (Western) are thousands separators — dropped.
  normalized = normalized.replace(/[٬,]/g, "");

  if (!NUMERIC_SHAPE.test(normalized)) return { ok: false, error: "invalid" };

  const decimalPart = normalized.split(".")[1];
  if (decimalPart && decimalPart.length > 2) return { ok: false, error: "invalid" };

  const value = new Decimal(normalized);
  if (value.isZero() || value.isNegative()) return { ok: false, error: "non_positive" };

  return { ok: true, value };
}
