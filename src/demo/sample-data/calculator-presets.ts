import type { CalculatorForm, NumberField } from "@/lib/calculator/form";
import type { Localized } from "@/demo/fixtures/types";

/**
 * The arbitrage examples use the furnished and empty 3BR offers in
 * docs/FINANCIAL_BASELINE.md §§2, 4, 7 and 13. These are example inputs,
 * not actual monthly results. The managed example retains the finance
 * engine's worked Example A from docs/BUILD_PLAN.md §4.6.
 */

export interface CalculatorPreset {
  id: "arbitrage" | "arbitrage-empty" | "managed";
  /** Descriptive only until Phase 2's area benchmark uses them. */
  unit: { city: Localized; area: Localized; bedrooms: string; bathrooms: string; maxGuests: string };
  form: CalculatorForm;
  sampleFields: NumberField[];
}

const SHARED_VALUES = {
  adr: "2450", // PriceLabs booked rate, not the listed 3,200 (baseline §2.1).
  bookedNights: "14", // Conservative example within New Cairo's 34–52% range (§2.2).
  blockedNights: "0",
  avgLengthOfStay: "2.5",
  cleaningFeePerStay: "600",
  platformFeePercent: "15.5",
  utilities: "2150", // Electricity 2,000 + water 150 (§§4.2, 11).
  internet: "600",
  compoundFees: "0", // Owner pays by default unless the lease shifts it (§13).
  cleaningCost: "550", // 3BR turnover (§13).
  laundryCost: "250", // 3BR turnover (§13).
  consumables: "180",
  repairs: "800",
  setupCost: "0",
  usefulLifeMonths: "60",
} satisfies Partial<Record<NumberField, string>>;

/** Commission terms kept (hidden) while the model is not managed, so switching to "managed" starts sensibly. */
const DEFAULT_COMMISSION_FORM: CalculatorForm["commission"] = {
  basis: "net_payout",
  hybridMode: "max",
  hybridBasis: "gross_revenue",
  includeCleaningFees: true,
};

export const CALCULATOR_PRESETS: CalculatorPreset[] = [
  {
    id: "arbitrage",
    unit: {
      // The offers are from Madinaty, but this is an illustrative 3BR, not a market benchmark.
      city: { ar: "القاهرة الكبرى", en: "Greater Cairo" },
      area: { ar: "مثال عام", en: "Generic example" },
      bedrooms: "3",
      bathrooms: "2",
      maxGuests: "6",
    },
    form: {
      operatingModel: "rental_arbitrage",
      values: { ...SHARED_VALUES, rent: "35000", deposit: "35000", commissionPercent: "20", fixedFee: "0" },
      commission: DEFAULT_COMMISSION_FORM,
    },
    sampleFields: ["bookedNights", "avgLengthOfStay", "cleaningFeePerStay", "cleaningCost", "laundryCost", "consumables", "repairs"],
  },
  {
    id: "arbitrage-empty",
    unit: {
      city: { ar: "القاهرة الكبرى", en: "Greater Cairo" },
      area: { ar: "مثال عام", en: "Generic example" },
      bedrooms: "3",
      bathrooms: "2",
      maxGuests: "6",
    },
    form: {
      operatingModel: "rental_arbitrage",
      values: { ...SHARED_VALUES, rent: "18000", deposit: "18000", setupCost: "334000", commissionPercent: "20", fixedFee: "0" },
      commission: DEFAULT_COMMISSION_FORM,
    },
    sampleFields: ["deposit", "bookedNights", "avgLengthOfStay", "cleaningFeePerStay", "cleaningCost", "laundryCost", "consumables", "repairs", "setupCost", "usefulLifeMonths"],
  },
  {
    id: "managed",
    unit: {
      city: { ar: "القاهرة", en: "Cairo" },
      area: { ar: "وسط البلد", en: "Downtown" },
      bedrooms: "2",
      bathrooms: "1",
      maxGuests: "4",
    },
    form: {
      operatingModel: "managed_for_owner",
      values: { ...SHARED_VALUES, adr: "2500", bookedNights: "18", avgLengthOfStay: "3", cleaningFeePerStay: "400", utilities: "2500", compoundFees: "1000", cleaningCost: "350", laundryCost: "0", consumables: "150", setupCost: "250000", rent: "0", deposit: "0", commissionPercent: "20", fixedFee: "0" },
      commission: { basis: "net_payout", hybridMode: "max", hybridBasis: "gross_revenue", includeCleaningFees: true },
    },
    sampleFields: ["setupCost", "usefulLifeMonths"],
  },
];
