import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { parseCalculatorForm } from "@/lib/calculator/form";
import { computeScenario, scenarioView, toMoneyString, type ScenarioSentence } from "@/lib/finance";
import type { OperatingModel } from "@/lib/finance";

/**
 * The landing page's example verdict (Batch 4, decision 3): the named
 * "arbitrage" preset run through the real engine, exactly as the first-run
 * flow starts from it. Display values only, no formulas. Plain on purpose
 * (no "server-only"): the page calls it at build time, and the share-image
 * script calls it too; `pnpm check:bundle` keeps the engine out of the
 * landing's browser code.
 */

export const LANDING_PRESET_ID = "arbitrage";

export interface LandingExample {
  model: OperatingModel;
  outcome: "profit" | "loss";
  /** Net after depreciation, to the piastre (rounded to whole pounds only when shown). */
  net: string;
  adr: string;
  rent: string;
  bookedNights: number;
  availableNights: number;
  sentence: ScenarioSentence;
}

export function landingExample(): LandingExample {
  const preset = CALCULATOR_PRESETS.find((p) => p.id === LANDING_PRESET_ID);
  if (!preset) throw new Error(`Missing calculator preset "${LANDING_PRESET_ID}"`);
  const parsed = parseCalculatorForm(preset.form);
  // A broken preset must fail the build, never show a wrong number.
  if (!parsed.ok) throw new Error(`The "${LANDING_PRESET_ID}" preset no longer parses`);
  const result = computeScenario(parsed.input);
  const view = scenarioView(parsed.input, result);
  return {
    model: preset.form.operatingModel,
    outcome: view.outcome,
    net: toMoneyString(view.netAfterDepreciation),
    adr: preset.form.values.adr,
    rent: preset.form.values.rent,
    bookedNights: Number(preset.form.values.bookedNights),
    availableNights: result.nightsAvailable.toNumber(),
    sentence: view.sentence,
  };
}
