/**
 * Shared shapes for `/demo` fixture data (BUILD_PLAN.md Phase P).
 *
 * All money amounts are decimal strings, never JS numbers — the same
 * discipline CLAUDE.md §6.2 requires of the real engine, even though these
 * fixtures involve no formulas of their own (every total here is either
 * copied from a worked example in BUILD_PLAN.md §4.6 or hand-summed and
 * checked by `fixtures.test.ts`).
 */

export type Localized = { ar: string; en: string };

export type OperatingModel = "owner_operated" | "rental_arbitrage" | "managed_for_owner";

export interface UnitFixture {
  id: string;
  name: Localized;
  area: Localized;
  operatingModel: OperatingModel;
  currency: "EGP";
  occupancy: number;
  adr: string;
  revpar: string;
  /** Present for owner-operated and rental-arbitrage units only. */
  netProfit?: string;
  /** Present for managed units only. */
  managerProfit?: string;
  owner?: Localized;
  hasStatement?: boolean;
}
