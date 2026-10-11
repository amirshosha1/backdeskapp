// @vitest-environment node
import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { parseCalculatorForm } from "@/lib/calculator/form";
import { computeScenario, scenarioView, toMoneyString } from "@/lib/finance";
import { formatMoney } from "@/lib/format/money";
import { landingExample, LANDING_PRESET_ID } from "./example";

/** The landing card is the engine's answer for the named preset, never a typed-in number. */
describe("landingExample()", () => {
  const preset = CALCULATOR_PRESETS.find((p) => p.id === LANDING_PRESET_ID)!;
  const parsed = parseCalculatorForm(preset.form);
  if (!parsed.ok) throw new Error("preset must parse");
  const view = scenarioView(parsed.input, computeScenario(parsed.input));

  it("equals the engine's output for the arbitrage preset", () => {
    const example = landingExample();
    expect(example.model).toBe("rental_arbitrage");
    expect(example.net).toBe(toMoneyString(view.netAfterDepreciation));
    expect(example.outcome).toBe(view.outcome);
    expect(example.sentence).toEqual(view.sentence);
    expect(example.adr).toBe(preset.form.values.adr);
    expect(example.rent).toBe(preset.form.values.rent);
  });

  it("is shown in whole pounds, half-up, with Western digits", () => {
    const shown = formatMoney(landingExample().net, { locale: "ar", decimals: 0 });
    expect(shown).not.toMatch(/\.\d/);
    expect(shown).toContain(new Decimal(view.netAfterDepreciation).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).abs().toNumber().toLocaleString("en-US"));
    expect(shown).not.toMatch(/[٠-٩]/);
  });
});
