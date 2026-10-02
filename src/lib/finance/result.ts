/**
 * Typed results for the finance engine. Input-dependent failures (a
 * currency mismatch, a missing FX rate, an unreachable break-even) are
 * returned as values, never thrown, so callers must handle them — the same
 * shape `parseAmount` (src/lib/format/amount.ts) already uses.
 */

export type Result<T, E = FinanceError> = { ok: true; value: T } | { ok: false; error: E };

export type FinanceError =
  | { code: "currency_mismatch"; expected: string; received: string }
  | { code: "missing_fx_rate"; currency: string }
  | { code: "invalid_fx_rate"; currency: string }
  | { code: "blocked_exceeds_days"; month: string; blockedNights: number; days: number }
  | { code: "invalid_input"; issues: string[] };

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function err<E>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}
