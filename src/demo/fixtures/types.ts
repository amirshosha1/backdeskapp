/**
 * Shared display shapes for `/demo` fixture data.
 *
 * Money amounts are decimal strings (rounded half-up to piastres), never JS
 * numbers. Since Phase 1 every figure is computed by the finance engine
 * from the raw sample inputs in src/demo/sample-data/ — no fixture holds a
 * hand-typed total (enforced by src/test/fixtures.test.ts). Ratios
 * (occupancy, shares) are plain numbers: they are only ever displayed.
 */

export type Localized = { ar: string; en: string };

export type OperatingModel = "owner_operated" | "rental_arbitrage" | "managed_for_owner";

/** Icon keys the UI maps to lucide icons (fixtures stay icon-library free). */
export type ExpenseIcon =
  | "rent"
  | "utilities"
  | "cleaning"
  | "compound"
  | "consumables"
  | "repairs"
  | "internet"
  | "other";

export interface UnitFixture {
  id: string;
  name: Localized;
  area: Localized;
  operatingModel: OperatingModel;
  currency: "EGP";
  /** Displayed occupancy, capped at 100% (see `availabilityConflict`). */
  occupancy: number;
  /** Booked nights exceed available nights: show a data warning (never clamped silently). */
  availabilityConflict: boolean;
  adr: string;
  revpar: string;
  /** Present for owner-operated and rental-arbitrage units only. */
  netProfit?: string;
  /** Present for managed units only. */
  managerProfit?: string;
  owner?: Localized;
  /** Present for managed units only, e.g. "20% من صافي المحوّل". */
  commissionBasis?: Localized;
  hasStatement?: boolean;
}

export interface ExpenseShare {
  id: string;
  icon: ExpenseIcon;
  name: Localized;
  amount: string;
  /** Share of the month's expenses (hand-computed, checked by the fixture tests). */
  share: number;
}
