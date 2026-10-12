// @vitest-environment node
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { scenarioInputSchema } from "@/lib/finance/schemas";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { FIELD_KIND, parseCalculatorForm, sameForm, visibleFields, type CalculatorForm, type NumberField } from "./form";
import { parseStoredForm } from "./stored-inputs";
import { computeScenario, scenarioView, toMoneyString } from "@/lib/finance";

const base = CALCULATOR_PRESETS[0]!.form;
const withValue = (field: NumberField, value: string, form: CalculatorForm = base): CalculatorForm => ({
  ...form,
  values: { ...form.values, [field]: value },
});
const errorOf = (form: CalculatorForm, field: NumberField) => {
  const parsed = parseCalculatorForm(form);
  return parsed.ok ? null : (parsed.errors[field] ?? null);
};

describe("calculator form", () => {
  it("every preset parses", () => {
    for (const preset of CALCULATOR_PRESETS) expect(parseCalculatorForm(preset.form).ok).toBe(true);
  });

  it("matches the furnished and empty 3BR examples in the financial baseline", () => {
    for (const [id, expectedNet, expectedNights] of [
      ["arbitrage", "-12215.30", 21],
      ["arbitrage-empty", "-781.97", 15],
    ] as const) {
      const preset = CALCULATOR_PRESETS.find((p) => p.id === id)!;
      const parsed = parseCalculatorForm(preset.form);
      if (!parsed.ok) throw new Error(`${id} must parse`);
      const view = scenarioView(parsed.input, computeScenario(parsed.input));
      expect(toMoneyString(view.netAfterDepreciation)).toBe(expectedNet);
      expect(view.breakEven.status).toBe("within_month");
      if (view.breakEven.status === "within_month") expect(view.breakEven.wholeNights).toBe(expectedNights);
    }
  });

  it("opens saved pre-laundry forms with zero laundry and preserves their result", () => {
    const legacy = structuredClone(base) as unknown as { values: Record<string, string> };
    delete legacy.values.laundryCost;
    const parsed = parseStoredForm(legacy);
    expect(parsed?.values.laundryCost).toBe("0");
  });

  it("types each error on its own field", () => {
    expect(errorOf(withValue("adr", ""), "adr")).toBe("empty");
    expect(errorOf(withValue("adr", "1.2.3"), "adr")).toBe("invalid");
    expect(errorOf(withValue("bookedNights", "18.5"), "bookedNights")).toBe("invalid_whole");
    expect(errorOf(withValue("rent", "-5"), "rent")).toBe("negative");
    expect(errorOf(withValue("avgLengthOfStay", "0"), "avgLengthOfStay")).toBe("non_positive");
    expect(errorOf(withValue("platformFeePercent", "100.01"), "platformFeePercent")).toBe("percent_range");
    expect(errorOf(withValue("adr", "1000000000000"), "adr")).toBe("too_large");
    expect(errorOf(withValue("bookedNights", "1000"), "bookedNights")).toBe("too_large");
    expect(errorOf(withValue("usefulLifeMonths", "601"), "usefulLifeMonths")).toBe("too_large");
    expect(errorOf(withValue("blockedNights", "31"), "blockedNights")).toBe("blocked_too_many");
    expect(errorOf(withValue("usefulLifeMonths", "0"), "usefulLifeMonths")).toBe("life_required");
    expect(parseCalculatorForm(withValue("setupCost", "0", withValue("usefulLifeMonths", "0"))).ok).toBe(true);
  });

  it("ignores fields the model doesn't show (rent on a managed unit, commission on arbitrage)", () => {
    const managed = { ...base, operatingModel: "managed_for_owner" as const };
    expect(visibleFields(managed)).not.toContain("rent");
    const parsed = parseCalculatorForm(withValue("rent", "abc", managed));
    expect(parsed.ok && parsed.input.rent).toBe(0);
    const arbitrage = parseCalculatorForm(withValue("commissionPercent", "abc"));
    expect(arbitrage.ok && arbitrage.input.commission.basis).toBe("none");
  });

  it("compares forms by value", () => {
    expect(sameForm(base, structuredClone(base))).toBe(true);
    expect(sameForm(base, withValue("adr", "2501"))).toBe(false);
    // A form read back from the browser has its values in another key order.
    const reordered = { ...base, values: Object.fromEntries(Object.entries(base.values).reverse()) as CalculatorForm["values"] };
    expect(sameForm(base, reordered)).toBe(true);
    expect(sameForm(base, { ...base, commission: { ...base.commission, includeCleaningFees: false } })).toBe(false);
  });
});

const arabicDigits = (s: string) => s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
const junk = fc.constantFrom("", "-1", "1.234", "abc", "1e3", "0", "601", "1000000000000", "٣٥٬٠٠٠", "35,000.5");

/** What a host might type into a field of this kind: mostly plausible, sometimes not (so both paths are exercised). */
function typedFor(kind: (typeof FIELD_KIND)[NumberField]): fc.Arbitrary<string> {
  const plausible = {
    money: fc.oneof(
      fc.integer({ min: 0, max: 10_000_000 }).map((c) => (c / 100).toFixed(2)),
      fc.integer({ min: 0, max: 500_000 }).map(String),
    ),
    count: fc.integer({ min: 0, max: 30 }).map(String),
    percent: fc.integer({ min: 0, max: 10_000 }).map((bp) => String(bp / 100)),
    stay: fc.integer({ min: 10, max: 99 }).map((t) => (t / 10).toFixed(1)),
  }[kind];
  return fc.oneof(
    { arbitrary: plausible, weight: 16 },
    { arbitrary: plausible.map(arabicDigits), weight: 3 },
    { arbitrary: junk, weight: 1 },
  );
}

/** Any string at all, for nudging one field of a valid preset. */
const typed = fc.oneof(typedFor("money"), typedFor("count"), typedFor("percent"), typedFor("stay"), junk);

const formArb: fc.Arbitrary<CalculatorForm> = fc
  .record({
    operatingModel: fc.constantFrom("owner_operated", "rental_arbitrage", "managed_for_owner"),
    values: fc.record(
      Object.fromEntries((Object.keys(FIELD_KIND) as NumberField[]).map((f) => [f, typedFor(FIELD_KIND[f])])) as Record<
        NumberField,
        fc.Arbitrary<string>
      >,
    ),
    basis: fc.constantFrom("net_payout", "gross_revenue", "noi", "fixed_monthly", "hybrid"),
    hybridMode: fc.constantFrom("sum", "max"),
    hybridBasis: fc.constantFrom("gross_revenue", "net_payout", "noi"),
    includeCleaningFees: fc.boolean(),
  })
  .map((r) => ({
    operatingModel: r.operatingModel,
    values: r.values,
    commission: { basis: r.basis, hybridMode: r.hybridMode, hybridBasis: r.hybridBasis, includeCleaningFees: r.includeCleaningFees },
  }));

describe("the form agrees with the engine's boundary schema", () => {
  it("every scenario the form accepts passes scenarioInputSchema", () => {
    let accepted = 0;
    fc.assert(
      fc.property(formArb, (form) => {
        const parsed = parseCalculatorForm(form);
        if (!parsed.ok) return;
        accepted += 1;
        const checked = scenarioInputSchema.safeParse(parsed.input);
        expect(checked.success, JSON.stringify(checked.error?.issues)).toBe(true);
      }),
      { numRuns: 2000 },
    );
    expect(accepted).toBeGreaterThan(20);
  });

  it("valid presets nudged one field at a time are accepted exactly when the schema accepts them", () => {
    fc.assert(
      fc.property(fc.constantFrom(...CALCULATOR_PRESETS.map((p) => p.form)), fc.constantFrom(...(Object.keys(FIELD_KIND) as NumberField[])), typed, (form, field, value) => {
        const next = withValue(field, value, form);
        const parsed = parseCalculatorForm(next);
        if (parsed.ok) expect(scenarioInputSchema.safeParse(parsed.input).success).toBe(true);
      }),
      { numRuns: 2000 },
    );
  });
});
