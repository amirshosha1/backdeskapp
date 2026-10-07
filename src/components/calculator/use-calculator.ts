"use client";

import { useMemo, useState } from "react";
import { parseCalculatorForm, sameForm, type CalculatorForm, type FieldError, type NumberField } from "@/lib/calculator/form";
import { computeScenario, scenarioView, type ScenarioInput, type ScenarioResult, type ScenarioView } from "@/lib/finance";
import { FIELD_KIND } from "@/lib/calculator/form";
import { saveOwnUnit, type AssumedField, type OwnUnit } from "@/lib/guest/store";
import type { CalculatorPreset } from "@/demo/sample-data/calculator-presets";

/** Every input that can hold an example value. */
export const ALL_ASSUMED: AssumedField[] = [...(Object.keys(FIELD_KIND) as NumberField[]), "commissionBasis"];

function parseOrThrow(form: CalculatorForm): ScenarioInput {
  const parsed = parseCalculatorForm(form);
  // Presets and stored units are checked before they get here (store.ts).
  if (!parsed.ok) throw new Error("A calculator form that should parse does not");
  return parsed.input;
}

export interface CalculatorState {
  /** "own": the visitor's first unit, saved on every valid change. "example": an example, never saved. */
  mode: "own" | "example";
  form: CalculatorForm;
  errors: Partial<Record<NumberField, FieldError>>;
  /** A field is invalid: figures show the last valid entry. */
  stale: boolean;
  /** The last valid form, and what the engine made of it. */
  validForm: CalculatorForm;
  input: ScenarioInput;
  result: ScenarioResult;
  view: ScenarioView;
  assumed: ReadonlySet<AssumedField>;
  /** The example whose unit details are shown (example mode). */
  unitPreset: CalculatorPreset;
  activePresetId: CalculatorPreset["id"] | null;
  update: (next: CalculatorForm, touched?: AssumedField[]) => void;
  setValue: (field: NumberField, value: string) => void;
  commit: (field: AssumedField) => void;
  loadPreset: (id: CalculatorPreset["id"]) => void;
}

/**
 * One state for both calculator tabs. In "own" mode every valid change is
 * written to the browser (store.ts); an invalid entry stays on screen only,
 * and the last valid one is what is kept.
 */
export function useCalculator(presets: CalculatorPreset[], own: OwnUnit | null): CalculatorState {
  const first = presets[0]!;
  const mode = own ? "own" : "example";
  const [form, setForm] = useState<CalculatorForm>(own?.form ?? first.form);
  const [valid, setValid] = useState(() => {
    const f = own?.form ?? first.form;
    return { form: f, input: parseOrThrow(f) };
  });
  const [assumed, setAssumed] = useState<ReadonlySet<AssumedField>>(() => new Set(own ? own.assumed : ALL_ASSUMED));
  const [unitPresetId, setUnitPresetId] = useState(first.id);

  const parsed = useMemo(() => parseCalculatorForm(form), [form]);
  const result = useMemo(() => computeScenario(valid.input), [valid.input]);
  const view = useMemo(() => scenarioView(valid.input, result), [valid.input, result]);

  function persist(nextValidForm: CalculatorForm, nextAssumed: ReadonlySet<AssumedField>) {
    if (mode === "own") saveOwnUnit(nextValidForm, [...nextAssumed]);
  }

  function update(next: CalculatorForm, touched: AssumedField[] = []) {
    setForm(next);
    const nextAssumed = touched.length > 0 ? new Set([...assumed].filter((f) => !touched.includes(f))) : assumed;
    if (touched.length > 0) setAssumed(nextAssumed);
    const p = parseCalculatorForm(next);
    if (p.ok) {
      setValid({ form: next, input: p.input });
      persist(next, nextAssumed);
    } else if (touched.length > 0) {
      persist(valid.form, nextAssumed);
    }
  }

  function commit(field: AssumedField) {
    if (!assumed.has(field)) return;
    const nextAssumed = new Set([...assumed].filter((f) => f !== field));
    setAssumed(nextAssumed);
    persist(valid.form, nextAssumed);
  }

  function loadPreset(id: CalculatorPreset["id"]) {
    const preset = presets.find((p) => p.id === id)!;
    setUnitPresetId(preset.id);
    const all = new Set(ALL_ASSUMED);
    setAssumed(all);
    setForm(preset.form);
    setValid({ form: preset.form, input: parseOrThrow(preset.form) });
    persist(preset.form, all);
  }

  return {
    mode,
    form,
    errors: parsed.ok ? {} : parsed.errors,
    stale: !parsed.ok,
    validForm: valid.form,
    input: valid.input,
    result,
    view,
    assumed,
    unitPreset: presets.find((p) => p.id === unitPresetId) ?? first,
    activePresetId: presets.find((p) => sameForm(p.form, form))?.id ?? null,
    update,
    setValue: (field, value) => update({ ...form, values: { ...form.values, [field]: value } }),
    commit,
    loadPreset,
  };
}
