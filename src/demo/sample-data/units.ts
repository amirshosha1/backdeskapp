import { NO_COMMISSION, type Bearer, type CapexAsset, type CommissionTerms, type IsoDate, type IsoMonth } from "@/lib/finance";
import type { Localized, OperatingModel } from "@/demo/fixtures/types";
import type { CategoryId } from "./categories";

/**
 * Raw sample inputs for `/demo`: what a host would actually enter — stays,
 * per-stay costs, monthly bills, the agreement, setup costs. There are no
 * totals here. Every figure a screen shows is computed from these by the
 * finance engine (src/demo/fixtures/, CLAUDE.md §6.1).
 *
 * These are invented sample units behind the "بيانات تجريبية" banner, not
 * market data or benchmarks (CLAUDE.md §2). Setup costs are SAMPLE figures.
 *
 * September 2026 is the month shown; August 2026 exists only to compute
 * the month-over-month change on Home. Downtown Cairo's September is
 * BUILD_PLAN.md §4.6 Example A exactly, so its statement can be checked by
 * hand against the spec. The other units were set in the Phase 1 plan
 * review (2026-10-01): Madinaty 20 nights at about 2,033; Sheikh Zayed 17
 * nights at about 1,759 against 24,000 rent; Rehab about 1,600 a night,
 * where 10% of gross stays under the 3,000 minimum.
 */

export const SAMPLE_MONTH: IsoMonth = "2026-09";
export const PREVIOUS_MONTH: IsoMonth = "2026-08";
export const SAMPLE_MONTHS: readonly IsoMonth[] = [PREVIOUS_MONTH, SAMPLE_MONTH];

/** Platform fee on every sample stay: 15.5% of the stay's gross, as in §4.6. */
export const SAMPLE_PLATFORM_FEE_RATE = "0.155";

export interface SampleStay {
  checkIn: IsoDate;
  nights: number;
  accommodation: string;
}

export interface SampleCost {
  categoryId: CategoryId;
  amount: string;
}

export interface SampleUnit {
  id: string;
  name: Localized;
  area: Localized;
  operatingModel: OperatingModel;
  currency: "EGP";
  owner?: Localized;
  /** The agreement in words, e.g. "20% من صافي المحوّل" (checked against `commission` by the fixture tests). */
  commissionBasis?: Localized;
  hasStatement?: boolean;
  /** Charged to the guest once per stay. */
  cleaningFeePerStay: string;
  /** Paid once per stay, on the check-in date. */
  perStayCosts: SampleCost[];
  /** Paid every month (fixed bills and the repairs allowance), on the 5th. */
  monthlyCosts: SampleCost[];
  commission: CommissionTerms;
  bearerRules?: Record<string, Bearer>;
  /** SAMPLE setup costs, depreciated monthly. */
  capex: CapexAsset[];
  stays: SampleStay[];
  /** Real money sent to the owner (managed units). */
  ownerPayouts?: { date: IsoDate; amount: string }[];
  /** The owner's opening balance on their first statement. */
  openingBalance?: string;
}

export const SAMPLE_UNITS: SampleUnit[] = [
  {
    id: "madinaty",
    name: { ar: "شقة مدينتي", en: "Madinaty apartment" },
    area: { ar: "مدينتي، القاهرة الجديدة", en: "Madinaty, New Cairo" },
    operatingModel: "owner_operated",
    currency: "EGP",
    cleaningFeePerStay: "450.00",
    perStayCosts: [
      { categoryId: "cleaning", amount: "400.00" },
      { categoryId: "consumables", amount: "180.00" },
    ],
    monthlyCosts: [
      { categoryId: "utilities", amount: "3100.00" },
      { categoryId: "internet", amount: "600.00" },
      { categoryId: "compound", amount: "1800.00" },
      { categoryId: "repairs", amount: "1200.00" },
    ],
    commission: NO_COMMISSION,
    capex: [{ cost: "180000.00", usefulLifeMonths: 60, purchaseDate: "2025-03-01" }],
    stays: [
      { checkIn: "2026-08-02", nights: 3, accommodation: "6000.00" },
      { checkIn: "2026-08-06", nights: 4, accommodation: "8200.00" },
      { checkIn: "2026-08-11", nights: 2, accommodation: "4100.00" },
      { checkIn: "2026-08-15", nights: 5, accommodation: "9900.00" },
      { checkIn: "2026-08-21", nights: 3, accommodation: "6050.00" },
      { checkIn: "2026-08-27", nights: 3, accommodation: "6100.00" },
      { checkIn: "2026-09-02", nights: 3, accommodation: "6150.00" },
      { checkIn: "2026-09-06", nights: 2, accommodation: "4000.00" },
      { checkIn: "2026-09-10", nights: 4, accommodation: "7900.00" },
      { checkIn: "2026-09-15", nights: 3, accommodation: "6100.00" },
      { checkIn: "2026-09-19", nights: 2, accommodation: "4200.00" },
      { checkIn: "2026-09-24", nights: 5, accommodation: "10250.00" },
      // Crosses into October: one night (and the cleaning fee) falls in September.
      { checkIn: "2026-09-30", nights: 2, accommodation: "4100.00" },
    ],
  },
  {
    id: "sheikh-zayed",
    name: { ar: "شقة الشيخ زايد", en: "Sheikh Zayed apartment" },
    area: { ar: "الشيخ زايد، الجيزة", en: "Sheikh Zayed, Giza" },
    operatingModel: "rental_arbitrage",
    currency: "EGP",
    cleaningFeePerStay: "350.00",
    perStayCosts: [
      { categoryId: "cleaning", amount: "300.00" },
      { categoryId: "consumables", amount: "130.00" },
    ],
    monthlyCosts: [
      { categoryId: "rent", amount: "24000.00" },
      { categoryId: "utilities", amount: "1800.00" },
      { categoryId: "internet", amount: "600.00" },
      { categoryId: "compound", amount: "800.00" },
      { categoryId: "repairs", amount: "600.00" },
    ],
    commission: NO_COMMISSION,
    capex: [{ cost: "250000.00", usefulLifeMonths: 60, purchaseDate: "2026-01-10" }],
    stays: [
      { checkIn: "2026-08-02", nights: 3, accommodation: "5100.00" },
      { checkIn: "2026-08-06", nights: 2, accommodation: "3300.00" },
      { checkIn: "2026-08-10", nights: 4, accommodation: "6800.00" },
      { checkIn: "2026-08-16", nights: 3, accommodation: "5000.00" },
      { checkIn: "2026-08-21", nights: 2, accommodation: "3300.00" },
      { checkIn: "2026-08-26", nights: 3, accommodation: "5000.00" },
      { checkIn: "2026-09-01", nights: 3, accommodation: "5400.00" },
      { checkIn: "2026-09-05", nights: 2, accommodation: "3500.00" },
      { checkIn: "2026-09-09", nights: 4, accommodation: "7000.00" },
      { checkIn: "2026-09-15", nights: 3, accommodation: "5300.00" },
      { checkIn: "2026-09-20", nights: 2, accommodation: "3600.00" },
      { checkIn: "2026-09-25", nights: 3, accommodation: "5100.00" },
    ],
  },
  {
    id: "downtown-cairo",
    name: { ar: "شقة وسط البلد", en: "Downtown Cairo apartment" },
    area: { ar: "وسط البلد، القاهرة", en: "Downtown, Cairo" },
    operatingModel: "managed_for_owner",
    currency: "EGP",
    owner: { ar: "أحمد يوسف", en: "Ahmed Youssef" },
    // §4.6 Example A: 20% commission on net payout, cleaning fees included, owner bears all costs.
    commissionBasis: { ar: "20% من صافي المحوّل", en: "20% of net payout" },
    hasStatement: true,
    cleaningFeePerStay: "400.00",
    perStayCosts: [
      { categoryId: "cleaning", amount: "350.00" },
      { categoryId: "consumables", amount: "150.00" },
    ],
    monthlyCosts: [
      { categoryId: "utilities", amount: "2500.00" },
      { categoryId: "internet", amount: "600.00" },
      { categoryId: "compound", amount: "1000.00" },
      { categoryId: "repairs", amount: "800.00" },
    ],
    commission: { ...NO_COMMISSION, basis: "net_payout", rate: "0.20", includeCleaningFees: true },
    capex: [],
    stays: [
      { checkIn: "2026-08-01", nights: 3, accommodation: "7500.00" },
      { checkIn: "2026-08-05", nights: 4, accommodation: "10000.00" },
      { checkIn: "2026-08-11", nights: 3, accommodation: "7500.00" },
      { checkIn: "2026-08-17", nights: 3, accommodation: "7500.00" },
      { checkIn: "2026-08-23", nights: 4, accommodation: "10000.00" },
      { checkIn: "2026-09-01", nights: 3, accommodation: "7500.00" },
      { checkIn: "2026-09-06", nights: 3, accommodation: "7500.00" },
      { checkIn: "2026-09-11", nights: 3, accommodation: "7500.00" },
      { checkIn: "2026-09-16", nights: 3, accommodation: "7500.00" },
      { checkIn: "2026-09-21", nights: 3, accommodation: "7500.00" },
      { checkIn: "2026-09-26", nights: 3, accommodation: "7500.00" },
    ],
    // A sample transfer to the owner (not part of §4.6).
    ownerPayouts: [{ date: "2026-09-28", amount: "20000.00" }],
    openingBalance: "0.00",
  },
  {
    id: "rehab",
    name: { ar: "شقة الرحاب", en: "Rehab apartment" },
    area: { ar: "الرحاب، القاهرة الجديدة", en: "Rehab, New Cairo" },
    operatingModel: "managed_for_owner",
    currency: "EGP",
    // Spelled with ya (مني), not alif maksura (منى): at UI sizes the nun's dot
    // sits against alif maksura's tail and reads as invisible in every font
    // tested. Sample data, so no real name is affected (docs/PROGRESS.md P.1).
    owner: { ar: "مني عزيز", en: "Mona Aziz" },
    // §4.6 Example C's terms: hybrid minimum guarantee, mode max, basis gross revenue.
    commissionBasis: { ar: "10% من الإيرادات، بحد أدنى 3,000", en: "10% of revenue, minimum 3,000" },
    hasStatement: false,
    cleaningFeePerStay: "300.00",
    perStayCosts: [
      { categoryId: "cleaning", amount: "250.00" },
      { categoryId: "consumables", amount: "120.00" },
    ],
    monthlyCosts: [
      { categoryId: "utilities", amount: "1500.00" },
      { categoryId: "internet", amount: "500.00" },
      { categoryId: "compound", amount: "700.00" },
      { categoryId: "repairs", amount: "500.00" },
    ],
    commission: {
      basis: "hybrid",
      rate: "0.10",
      fixedFee: "3000.00",
      hybridMode: "max",
      hybridBasis: "gross_revenue",
      includeCleaningFees: true,
    },
    // The co-host supplies the guest amenities; the owner bears everything else.
    bearerRules: { consumables: { kind: "manager" } },
    capex: [],
    stays: [
      { checkIn: "2026-08-03", nights: 3, accommodation: "4650.00" },
      { checkIn: "2026-08-08", nights: 2, accommodation: "3100.00" },
      { checkIn: "2026-08-12", nights: 3, accommodation: "4700.00" },
      { checkIn: "2026-08-18", nights: 4, accommodation: "6300.00" },
      { checkIn: "2026-08-25", nights: 3, accommodation: "4800.00" },
      { checkIn: "2026-09-02", nights: 2, accommodation: "3200.00" },
      { checkIn: "2026-09-05", nights: 3, accommodation: "4800.00" },
      { checkIn: "2026-09-10", nights: 2, accommodation: "3250.00" },
      { checkIn: "2026-09-14", nights: 4, accommodation: "6400.00" },
      { checkIn: "2026-09-20", nights: 3, accommodation: "4750.00" },
      { checkIn: "2026-09-26", nights: 2, accommodation: "3200.00" },
    ],
  },
];

/** Portfolio-level manager overhead (no unit): never charged to owners. Paid every sample month. */
export const SAMPLE_OVERHEAD: { categoryId: string; name: Localized; amount: string }[] = [
  { categoryId: "software", name: { ar: "برنامج الحجوزات والمحاسبة", en: "Booking and accounting software" }, amount: "600.00" },
  { categoryId: "transport", name: { ar: "مواصلات واتصالات", en: "Transport and phone" }, amount: "900.00" },
];
