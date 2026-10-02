import type Decimal from "decimal.js";
import { ownerStatement, toMoneyString } from "@/lib/finance";
import { CATEGORIES, type CategoryId } from "@/demo/sample-data/categories";
import { SAMPLE_MONTH, SAMPLE_UNITS } from "@/demo/sample-data/units";
import { monthLabel, sampleExpenses, sampleStays } from "./build";
import type { Localized } from "./types";

/**
 * Owner statement for the Downtown Cairo unit, computed by the engine
 * (cash basis, the default). Its September is §4.6 Example A exactly
 * (managed, 20% of net payout, cleaning fees included, owner bears all
 * costs); the 20,000 owner payout is a sample transfer, not part of §4.6.
 * Deductions are shown as negative amounts.
 */

const unit = SAMPLE_UNITS.find((u) => u.id === "downtown-cairo")!;

const result = ownerStatement({
  unitCurrency: unit.currency,
  period: SAMPLE_MONTH,
  basis: "cash",
  stays: sampleStays(unit),
  expenses: sampleExpenses(unit),
  commission: unit.commission,
  bearerRules: unit.bearerRules,
  ownerPayouts: (unit.ownerPayouts ?? []).map((p) => ({ ...p, currency: unit.currency })),
  openingBalance: unit.openingBalance ?? 0,
});
if (!result.ok) throw new Error(`Sample statement: ${JSON.stringify(result.error)}`);
const st = result.value;

/** A deduction, shown with its minus sign (a zero stays "0.00"). */
const negative = (amount: Decimal) => toMoneyString(amount.negated());

export const STATEMENT = {
  unitName: unit.name,
  ownerName: unit.owner!,
  period: monthLabel(SAMPLE_MONTH),
  number: "0001",
  basis: st.basis,
  status: "finalized" as const,
  openingBalance: toMoneyString(st.openingBalance),
  grossRevenue: toMoneyString(st.grossRevenue),
  platformFees: negative(st.platformFees),
  netPayout: toMoneyString(st.netPayout),
  ownerExpenses: st.ownerExpenses.map((line) => ({
    category: CATEGORIES[line.categoryId as CategoryId].name as Localized,
    amount: negative(line.amount),
  })),
  ownerExpensesTotal: negative(st.ownerExpensesTotal),
  commissionBasis: unit.commissionBasis!,
  commission: negative(st.commission),
  ownerNet: toMoneyString(st.ownerNet),
  ownerPayouts: negative(st.ownerPayouts),
  balanceDue: toMoneyString(st.balanceDue),
};
