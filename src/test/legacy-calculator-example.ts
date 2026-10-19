import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";

/** BUILD_PLAN Example B, retained as a regression fixture after the baseline preset changes. */
export const LEGACY_EXAMPLE_FORM = {
  ...CALCULATOR_PRESETS[0]!.form,
  values: {
    ...CALCULATOR_PRESETS[0]!.form.values,
    adr: "2500",
    bookedNights: "18",
    avgLengthOfStay: "3",
    cleaningFeePerStay: "400",
    utilities: "2500",
    compoundFees: "1000",
    cleaningCost: "350",
    laundryCost: "0",
    consumables: "150",
    setupCost: "250000",
    deposit: "70000",
  },
};

export const LEGACY_PRESETS = [
  { ...CALCULATOR_PRESETS[0]!, form: LEGACY_EXAMPLE_FORM },
  ...CALCULATOR_PRESETS.slice(1),
];
