import Decimal from "decimal.js";
import { roundMoney } from "./money";
import { err, ok, type Result } from "./result";

/**
 * Currency handling (CLAUDE.md §6.3, BUILD_PLAN.md §4.1 "Currency"). The
 * engine calculates in the unit currency only. A transaction in another
 * currency carries an explicit FX rate and is converted once, half-up to
 * piastres; there is never an implicit or automatic rate.
 */

export type CurrencyCode = string;

export interface ForeignAmount {
  amount: Decimal.Value;
  currency: CurrencyCode;
  /** Units of the unit currency per 1 unit of `currency`. Required when the currencies differ. */
  fxRate?: Decimal.Value | null;
}

/** `amount_unit = round_half_up(amount_original × fx_rate, 2)`; `fx_rate = 1` when currencies match. */
export function toUnitCurrency(input: ForeignAmount, unitCurrency: CurrencyCode): Result<Decimal> {
  if (input.currency === unitCurrency) {
    if (input.fxRate != null && !new Decimal(input.fxRate).equals(1)) {
      return err({ code: "invalid_fx_rate", currency: input.currency });
    }
    return ok(roundMoney(input.amount));
  }
  if (input.fxRate == null) return err({ code: "missing_fx_rate", currency: input.currency });
  const rate = new Decimal(input.fxRate);
  if (!rate.isFinite() || rate.lessThanOrEqualTo(0)) {
    return err({ code: "invalid_fx_rate", currency: input.currency });
  }
  return ok(roundMoney(new Decimal(input.amount).times(rate)));
}

/** Rejects any amount that is not already in the unit currency. */
export function requireUnitCurrency(currency: CurrencyCode, unitCurrency: CurrencyCode): Result<true> {
  if (currency !== unitCurrency) {
    return err({ code: "currency_mismatch", expected: unitCurrency, received: currency });
  }
  return ok(true);
}
