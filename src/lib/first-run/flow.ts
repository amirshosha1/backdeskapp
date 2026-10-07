import { FIELD_KIND, type CalculatorForm, type NumberField } from "@/lib/calculator/form";
import type { OperatingModel } from "@/lib/finance";
import type { AssumedField } from "@/lib/guest/store";

/**
 * The first-run guided flow (P.2 slice 1): a few questions, then the
 * verdict, then how many apartments the visitor has. Pure logic only, so
 * the order, the ranges and the unit it saves are tested without a screen.
 *
 * The answers start from the calculator's rental-arbitrage example (no new
 * defaults); every input the flow does not ask about keeps the example's
 * value and stays assumed (تجريبي) until the visitor commits it.
 */

export type FirstRunStep = "model" | "price" | "nights" | "cost" | "verdict" | "count";

export interface DialRange {
  min: number;
  max: number;
  /** Slider granularity. */
  step: number;
  /** What one tap of − / + moves. */
  button: number;
}

export const PRICE_RANGE: DialRange = { min: 500, max: 10_000, step: 50, button: 100 };
export const NIGHTS_RANGE: DialRange = { min: 0, max: 30, step: 1, button: 1 };
export const RENT_RANGE: DialRange = { min: 5_000, max: 150_000, step: 500, button: 1_000 };
export const COMMISSION_RANGE: DialRange = { min: 5, max: 50, step: 1, button: 1 };

export interface FirstRunAnswers {
  /** Null until the visitor picks one. */
  model: OperatingModel | null;
  adr: number;
  nights: number;
  rent: number;
  commission: number;
}

/** The flow's order for a model; owner-operated has no cost question (no rent, no commission). */
export function stepsFor(model: OperatingModel | null): FirstRunStep[] {
  return model === "owner_operated"
    ? ["model", "price", "nights", "verdict", "count"]
    : ["model", "price", "nights", "cost", "verdict", "count"];
}

/** One progress segment per question: 3 for owner-operated, 4 otherwise. */
export function questionCount(model: OperatingModel | null): number {
  return stepsFor(model).indexOf("verdict");
}

/**
 * The step to show: the requested one if the answers so far allow it,
 * otherwise the first question (a bare reload, a stale `?step=` or a step
 * that doesn't exist for this model all start from the top).
 */
export function resolveStep(requested: string | null, model: OperatingModel | null): FirstRunStep {
  const steps = stepsFor(model);
  if (model === null) return "model";
  return (steps as string[]).includes(requested ?? "") ? (requested as FirstRunStep) : "model";
}

export function nextStep(step: FirstRunStep, model: OperatingModel | null): FirstRunStep {
  const steps = stepsFor(model);
  return steps[Math.min(steps.indexOf(step) + 1, steps.length - 1)]!;
}

export function previousStep(step: FirstRunStep, model: OperatingModel | null): FirstRunStep {
  const steps = stepsFor(model);
  return steps[Math.max(steps.indexOf(step) - 1, 0)]!;
}

export function clampToRange(value: number, range: DialRange): number {
  return Math.min(range.max, Math.max(range.min, value));
}

const whole = (raw: string, range: DialRange) => clampToRange(Math.round(Number(raw)), range);

/** The example's values as the flow's starting answers (the example is always inside every range). */
export function startingAnswers(example: CalculatorForm): FirstRunAnswers {
  return {
    model: null,
    adr: whole(example.values.adr, PRICE_RANGE),
    nights: whole(example.values.bookedNights, NIGHTS_RANGE),
    rent: whole(example.values.rent, RENT_RANGE),
    commission: whole(example.values.commissionPercent, COMMISSION_RANGE),
  };
}

/** The questions a model asks, as calculator fields. */
export function askedFields(model: OperatingModel): NumberField[] {
  if (model === "rental_arbitrage") return ["adr", "bookedNights", "rent"];
  if (model === "managed_for_owner") return ["adr", "bookedNights", "commissionPercent"];
  return ["adr", "bookedNights"];
}

/** The example form with the visitor's answers in it. */
export function formFromAnswers(example: CalculatorForm, answers: FirstRunAnswers & { model: OperatingModel }): CalculatorForm {
  const values = { ...example.values, adr: String(answers.adr), bookedNights: String(answers.nights) };
  if (answers.model === "rental_arbitrage") values.rent = String(answers.rent);
  if (answers.model === "managed_for_owner") values.commissionPercent = String(answers.commission);
  return { ...example, operatingModel: answers.model, values };
}

/** Every input except the ones the flow asked: they keep the example's values and the تجريبي tag. */
export function assumedAfterFlow(model: OperatingModel): AssumedField[] {
  const asked = new Set<NumberField>(askedFields(model));
  const fields = (Object.keys(FIELD_KIND) as NumberField[]).filter((f) => !asked.has(f));
  return [...fields, "commissionBasis"];
}
