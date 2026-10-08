// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { decideAdoption } from "./adoption";

const [arbitrage, second] = CALCULATOR_PRESETS.map((p) => p.form);
const guest = { form: arbitrage!, assumed: [] };
const row = (id: string, form: unknown, assumed: unknown = []) => ({ id, calculator_inputs: { form, assumed } });

describe("decideAdoption", () => {
  it("adds the browser apartment when the account has none", () => {
    expect(decideAdoption(guest, [])).toEqual({ kind: "add" });
  });

  it("recognises the same numbers already in the account (and never adds a second copy)", () => {
    expect(decideAdoption(guest, [row("a", second), row("b", arbitrage)])).toEqual({ kind: "duplicate", unitId: "b" });
  });

  it("ignores which inputs are still tagged تجريبي when comparing", () => {
    expect(decideAdoption({ form: arbitrage!, assumed: ["deposit"] }, [row("a", arbitrage, ["rent", "adr"])])).toEqual({ kind: "duplicate", unitId: "a" });
  });

  it("asks when the account holds different apartments", () => {
    const changed = { ...arbitrage!, values: { ...arbitrage!.values, adr: "2600" } };
    expect(decideAdoption({ form: changed, assumed: [] }, [row("a", arbitrage)])).toEqual({ kind: "ask" });
  });

  it("asks (never overwrites) when an account apartment can't be read", () => {
    expect(decideAdoption(guest, [{ id: "a", calculator_inputs: { broken: true } }])).toEqual({ kind: "ask" });
  });
});
