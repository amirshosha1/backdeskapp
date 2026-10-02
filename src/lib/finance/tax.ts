import Decimal from "decimal.js";
import { roundMoney, ZERO } from "./money";

/**
 * Tax (BUILD_PLAN.md §4.1). Rate and base are user settings on the
 * agreement; no rate is ever preset or presented as advice (CLAUDE.md §2).
 * `tax = rate × max(base, 0)`: zero when the rate is null, zero on a loss.
 */

export type TaxBase = "pre_tax_profit" | "gross_revenue" | "net_payout";

export interface TaxSettings {
  /** Null means no tax. */
  rate: Decimal.Value | null;
  base: TaxBase;
}

export const NO_TAX: TaxSettings = { rate: null, base: "pre_tax_profit" };

export interface TaxFigures {
  preTaxProfit: Decimal.Value;
  grossRevenue: Decimal.Value;
  netPayout: Decimal.Value;
}

export function computeTax(settings: TaxSettings, figures: TaxFigures): Decimal {
  if (settings.rate === null) return ZERO;
  const base =
    settings.base === "gross_revenue"
      ? figures.grossRevenue
      : settings.base === "net_payout"
        ? figures.netPayout
        : figures.preTaxProfit;
  return roundMoney(new Decimal(settings.rate).times(Decimal.max(base, ZERO)));
}
