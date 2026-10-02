import type { CalculatorForm, NumberField } from "@/lib/calculator/form";
import type { Localized } from "@/demo/fixtures/types";

/**
 * The two examples the live calculator opens with (BUILD_PLAN.md Phase 1):
 * §4.6 Example B (rental arbitrage) is the default, Example A (managed,
 * 20% of net payout) the second. Values are what a host would type, as
 * strings. Figures that are not in §4.6 — the deposit, the setup cost and
 * its useful life — are SAMPLE: they carry the SAMPLE badge until the host
 * types their own number.
 */

export interface CalculatorPreset {
  id: "arbitrage" | "managed";
  /** Descriptive only until Phase 2's area benchmark uses them. */
  unit: { city: Localized; area: Localized; bedrooms: string; bathrooms: string; maxGuests: string };
  form: CalculatorForm;
  sampleFields: NumberField[];
}

const SHARED_VALUES = {
  adr: "2500",
  bookedNights: "18",
  blockedNights: "0",
  avgLengthOfStay: "3",
  cleaningFeePerStay: "400",
  platformFeePercent: "15.5",
  utilities: "2500",
  internet: "600",
  compoundFees: "1000",
  cleaningCost: "350",
  consumables: "150",
  repairs: "800",
  setupCost: "250000",
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
      // Generic on purpose: Home's Sheikh Zayed sample unit has different figures (24,000 rent).
      city: { ar: "القاهرة الكبرى", en: "Greater Cairo" },
      area: { ar: "مثال عام", en: "Generic example" },
      bedrooms: "2",
      bathrooms: "2",
      maxGuests: "4",
    },
    form: {
      operatingModel: "rental_arbitrage",
      values: { ...SHARED_VALUES, rent: "35000", deposit: "70000", commissionPercent: "20", fixedFee: "0" },
      commission: DEFAULT_COMMISSION_FORM,
    },
    sampleFields: ["deposit", "setupCost", "usefulLifeMonths"],
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
      values: { ...SHARED_VALUES, rent: "0", deposit: "0", commissionPercent: "20", fixedFee: "0" },
      commission: { basis: "net_payout", hybridMode: "max", hybridBasis: "gross_revenue", includeCleaningFees: true },
    },
    sampleFields: ["setupCost", "usefulLifeMonths"],
  },
];
