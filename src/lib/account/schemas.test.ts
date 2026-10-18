// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { parseCalculatorForm } from "@/lib/calculator/form";
import { computeScenario, scenarioView, toMoneyString } from "@/lib/finance";
import { jsonbTextBytes } from "./jsonb-size";
import {
  adoptGuestUnitSchema,
  apartmentCountSchema,
  CALCULATOR_INPUTS_MAX_BYTES,
  calculatorInputsSchema,
  createUnitSchema,
  operatingModelSchema,
  unitIdSchema,
  unitNameSchema,
  updateUnitSchema,
} from "./schemas";

const form = CALCULATOR_PRESETS[0]!.form;
const inputs = { form, assumed: ["platformFeePercent", "deposit"] };
const ch = (code: number) => String.fromCodePoint(code);

describe("unitNameSchema", () => {
  it("accepts Arabic and English names, trimmed and NFC-normalised", () => {
    expect(unitNameSchema.parse("  شقة التجمع ١  ")).toBe("شقة التجمع ١");
    expect(unitNameSchema.parse("North Coast chalet")).toBe("North Coast chalet");
    // "é" as e + combining accent becomes one code point.
    expect(unitNameSchema.parse(`Cafe${ch(0x301)}`)).toBe(`Caf${ch(0xe9)}`);
  });

  it("counts length in characters (code points) as Postgres does: 60 pass, 61 fail", () => {
    expect(unitNameSchema.safeParse("ش".repeat(60)).success).toBe(true);
    expect(unitNameSchema.safeParse("ش".repeat(61)).success).toBe(false);
    // 60 emoji are 120 UTF-16 units but 60 characters.
    expect(unitNameSchema.safeParse("🏠".repeat(60)).success).toBe(true);
  });

  it("rejects empty and blank names", () => {
    expect(unitNameSchema.safeParse("").success).toBe(false);
    expect(unitNameSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects control characters, line separators and direction overrides", () => {
    for (const code of [0x00, 0x09, 0x0a, 0x1b, 0x7f, 0x85, 0x9f, 0x2028, 0x2029, 0x202a, 0x202e, 0x2066, 0x2069]) {
      expect(unitNameSchema.safeParse(`a${ch(code)}b`).success, code.toString(16)).toBe(false);
    }
  });

  it("rejects non-strings", () => {
    expect(unitNameSchema.safeParse(5).success).toBe(false);
    expect(unitNameSchema.safeParse(null).success).toBe(false);
  });
});

describe("calculatorInputsSchema", () => {
  it("accepts the calculator's inputs and drops duplicate assumed fields", () => {
    const parsed = calculatorInputsSchema.parse({ form, assumed: ["deposit", "deposit", "commissionBasis"] });
    expect(parsed.assumed).toEqual(["deposit", "commissionBasis"]);
    expect(parsed.form).toEqual(form);
  });

  it("accepts every preset", () => {
    for (const preset of CALCULATOR_PRESETS) expect(calculatorInputsSchema.safeParse({ form: preset.form, assumed: [] }).success).toBe(true);
  });

  it("reads a payload saved before laundry existed as zero laundry, and the engine's result is unchanged", () => {
    const { laundryCost: _dropped, ...legacyValues } = form.values;
    const parsed = calculatorInputsSchema.parse({ form: { ...form, values: legacyValues }, assumed: [] });
    expect(parsed.form.values.laundryCost).toBe("0");
    const net = (f: typeof form) => {
      const r = parseCalculatorForm(f);
      if (!r.ok) throw new Error("form must parse");
      return toMoneyString(scenarioView(r.input, computeScenario(r.input)).netAfterDepreciation);
    };
    expect(net(parsed.form)).toBe(net({ ...form, values: { ...form.values, laundryCost: "0" } }));
    expect(calculatorInputsSchema.safeParse({ form: { ...form, values: { ...legacyValues, laundryCost: 5 } }, assumed: [] }).success).toBe(false);
  });

  it("rejects anything that is not an object", () => {
    for (const value of [null, [], "x", 1, true, [inputs]]) expect(calculatorInputsSchema.safeParse(value).success).toBe(false);
  });

  it("rejects extra keys at every level (inputs only, never results)", () => {
    expect(calculatorInputsSchema.safeParse({ ...inputs, result: { net: "1" } }).success).toBe(false);
    expect(calculatorInputsSchema.safeParse({ ...inputs, form: { ...form, netProfit: "1" } }).success).toBe(false);
    expect(calculatorInputsSchema.safeParse({ ...inputs, form: { ...form, values: { ...form.values, extra: "1" } } }).success).toBe(false);
    expect(calculatorInputsSchema.safeParse({ ...inputs, form: { ...form, commission: { ...form.commission, x: 1 } } }).success).toBe(false);
  });

  it("rejects a missing field, an unknown model or basis, and unknown assumed fields", () => {
    const { adr: _adr, ...values } = form.values;
    expect(calculatorInputsSchema.safeParse({ ...inputs, form: { ...form, values } }).success).toBe(false);
    expect(calculatorInputsSchema.safeParse({ ...inputs, form: { ...form, operatingModel: "hotel" } }).success).toBe(false);
    expect(calculatorInputsSchema.safeParse({ ...inputs, form: { ...form, commission: { ...form.commission, basis: "none" } } }).success).toBe(false);
    expect(calculatorInputsSchema.safeParse({ ...inputs, assumed: ["bogus"] }).success).toBe(false);
  });

  it("rejects a form the engine would not accept", () => {
    const negative = { ...form, values: { ...form.values, adr: "-5" } };
    const result = calculatorInputsSchema.safeParse({ form: negative, assumed: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("form_rejected_by_engine");
  });

  it("caps each value at 32 characters, which keeps every valid payload far under 8 KB", () => {
    expect(calculatorInputsSchema.safeParse({ ...inputs, form: { ...form, values: { ...form.values, adr: "1".repeat(33) } } }).success).toBe(false);
    // The largest payload the shape allows: every value 32 bytes, every assumed field listed.
    const biggest = {
      form: { ...form, values: Object.fromEntries(Object.keys(form.values).map((k) => [k, "9".repeat(32)])) },
      assumed: [...Object.keys(form.values), "commissionBasis"],
    };
    expect(jsonbTextBytes(biggest)).toBeLessThan(CALCULATOR_INPUTS_MAX_BYTES);
  });
});

describe("other inputs", () => {
  it("operating models", () => {
    expect(operatingModelSchema.safeParse("rental_arbitrage").success).toBe(true);
    expect(operatingModelSchema.safeParse("other").success).toBe(false);
  });

  it("apartment counts are the four ranges the database allows", () => {
    for (const c of ["1", "2-3", "4-10", "10+"]) expect(apartmentCountSchema.safeParse(c).success).toBe(true);
    for (const c of ["0", "11", "", 1]) expect(apartmentCountSchema.safeParse(c).success).toBe(false);
  });

  it("unit ids are UUIDs", () => {
    expect(unitIdSchema.safeParse("6f1b8f2e-6a43-4b5e-9a57-0d3a3c1f2b11").success).toBe(true);
    expect(unitIdSchema.safeParse("own-1").success).toBe(false);
    expect(unitIdSchema.safeParse("1 or 1=1").success).toBe(false);
  });

  it("create, update and adopt payloads", () => {
    expect(createUnitSchema.safeParse({ name: "شقة 2", inputs }).success).toBe(true);
    expect(createUnitSchema.safeParse({ name: "شقة 2", inputs, org_id: "x" }).success).toBe(false);
    const id = "6f1b8f2e-6a43-4b5e-9a57-0d3a3c1f2b11";
    expect(updateUnitSchema.safeParse({ id, name: "x" }).success).toBe(true);
    expect(updateUnitSchema.safeParse({ id, inputs }).success).toBe(true);
    expect(updateUnitSchema.safeParse({ id }).success).toBe(false);
    expect(updateUnitSchema.safeParse({ id, name: "x", org_id: "y" }).success).toBe(false);
    expect(adoptGuestUnitSchema.safeParse({ name: "شقتي الأولى", inputs, apartmentCount: null }).success).toBe(true);
  });
});
