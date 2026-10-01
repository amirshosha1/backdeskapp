import Decimal from "decimal.js";

/**
 * Money primitives (CLAUDE.md §6.2). Amounts are `Decimal`, never JS
 * floats. Rounding is half-up to whole piastres (2 decimals), applied only
 * to stored amounts, statement lines and at presentation. Every split gives
 * the leftover cent(s) to the last line, so the parts always sum exactly to
 * the total (BUILD_PLAN.md §4.6 Example F).
 */

export const ZERO = new Decimal(0);
export const ONE = new Decimal(1);

/**
 * Half-up to 2 decimals: 12.345 → 12.35 (half-even would give 12.34).
 * A tiny loss that rounds to zero is plain zero, never "-0.00".
 */
export function roundMoney(value: Decimal.Value): Decimal {
  const rounded = new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return rounded.isZero() ? ZERO : rounded;
}

/** A presentation string with exactly 2 decimals, rounded half-up. */
export function toMoneyString(value: Decimal.Value): string {
  return roundMoney(value).toFixed(2);
}

export function sumMoney(values: readonly Decimal.Value[]): Decimal {
  return values.reduce<Decimal>((total, value) => total.plus(value), ZERO);
}

/**
 * Splits `total` into `parts` lines: every line but the last is the
 * half-up rounded share, and the last line takes whatever is left, so the
 * lines sum exactly to the (piastre-rounded) total. 100.00 / 3 → 33.33,
 * 33.33, 33.34.
 */
export function splitEvenly(total: Decimal.Value, parts: number): Decimal[] {
  if (!Number.isInteger(parts) || parts < 1) {
    throw new RangeError(`splitEvenly needs a whole number of parts ≥ 1, got ${parts}`);
  }
  const rounded = roundMoney(total);
  const share = roundMoney(rounded.dividedBy(parts));
  const lines = Array.from({ length: parts - 1 }, () => share);
  lines.push(rounded.minus(share.times(parts - 1)));
  return lines;
}

/**
 * Splits `total` in proportion to `weights`. Each line is rounded half-up;
 * the last line with a non-zero weight takes the leftover cent(s), so a
 * zero-weight line (e.g. no cleaning fee) always stays exactly zero. When
 * every weight is zero, the total is split evenly instead.
 */
export function allocateProportionally(total: Decimal.Value, weights: readonly Decimal.Value[]): Decimal[] {
  if (weights.length === 0) throw new RangeError("allocateProportionally needs at least one weight");
  const rounded = roundMoney(total);
  const ws = weights.map((w) => new Decimal(w));
  const weightSum = sumMoney(ws);
  if (weightSum.isZero()) return splitEvenly(rounded, ws.length);

  let lastNonZero = 0;
  ws.forEach((w, i) => {
    if (!w.isZero()) lastNonZero = i;
  });

  const lines = ws.map((w) => roundMoney(rounded.times(w).dividedBy(weightSum)));
  const others = sumMoney(lines.filter((_, i) => i !== lastNonZero));
  lines[lastNonZero] = rounded.minus(others);
  return lines;
}
