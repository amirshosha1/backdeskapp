import { describe, expect, it } from "vitest";
import { LEGACY_EXAMPLE_FORM } from "@/test/legacy-calculator-example";
import { parseCalculatorForm } from "@/lib/calculator/form";
import {
  assumedAfterFlow,
  clampToRange,
  formFromAnswers,
  nextStep,
  NIGHTS_RANGE,
  previousStep,
  PRICE_RANGE,
  questionCount,
  resolveStep,
  startingAnswers,
  stepsFor,
} from "./flow";

const example = LEGACY_EXAMPLE_FORM;

describe("first-run flow order", () => {
  it("owner-operated skips the cost question: 3 questions, then verdict and count", () => {
    expect(stepsFor("owner_operated")).toEqual(["model", "price", "nights", "verdict", "count"]);
    expect(questionCount("owner_operated")).toBe(3);
  });

  it("rental arbitrage and managed ask the cost: 4 questions", () => {
    for (const model of ["rental_arbitrage", "managed_for_owner"] as const) {
      expect(stepsFor(model)).toEqual(["model", "price", "nights", "cost", "verdict", "count"]);
      expect(questionCount(model)).toBe(4);
    }
    // Before a model is picked the bar shows the longer path.
    expect(questionCount(null)).toBe(4);
  });

  it("next and back walk the model's own order and stop at the ends", () => {
    expect(nextStep("nights", "owner_operated")).toBe("verdict");
    expect(nextStep("nights", "rental_arbitrage")).toBe("cost");
    expect(previousStep("verdict", "owner_operated")).toBe("nights");
    expect(previousStep("verdict", "managed_for_owner")).toBe("cost");
    expect(previousStep("model", "rental_arbitrage")).toBe("model");
    expect(nextStep("count", "rental_arbitrage")).toBe("count");
  });

  it("a requested step is honoured only when the answers allow it", () => {
    expect(resolveStep("price", null)).toBe("model");
    expect(resolveStep("cost", "owner_operated")).toBe("model");
    expect(resolveStep("cost", "rental_arbitrage")).toBe("cost");
    expect(resolveStep("nonsense", "rental_arbitrage")).toBe("model");
    expect(resolveStep(null, "rental_arbitrage")).toBe("model");
  });
});

describe("first-run answers and the unit they make", () => {
  it("starts from the rental-arbitrage example: 2,500 a night, 18 nights, 35,000 rent, 20% commission", () => {
    expect(startingAnswers(example)).toEqual({ model: null, adr: 2500, nights: 18, rent: 35000, commission: 20 });
  });

  it("keeps a dial inside its range", () => {
    expect(clampToRange(12_000, PRICE_RANGE)).toBe(10_000);
    expect(clampToRange(-1, NIGHTS_RANGE)).toBe(0);
  });

  it("puts the answers into the example form, and only the asked fields leave the assumed set", () => {
    const form = formFromAnswers(example, { model: "managed_for_owner", adr: 3000, nights: 20, rent: 35000, commission: 25 });
    expect(form.operatingModel).toBe("managed_for_owner");
    expect(form.values).toMatchObject({ adr: "3000", bookedNights: "20", commissionPercent: "25", platformFeePercent: "15.5" });
    expect(parseCalculatorForm(form).ok).toBe(true);

    const assumed = assumedAfterFlow("managed_for_owner");
    expect(assumed).not.toContain("adr");
    expect(assumed).not.toContain("bookedNights");
    expect(assumed).not.toContain("commissionPercent");
    expect(assumed).toContain("platformFeePercent");
    expect(assumed).toContain("commissionBasis");
    expect(assumedAfterFlow("rental_arbitrage")).not.toContain("rent");
    expect(assumedAfterFlow("owner_operated")).toContain("rent");
  });

  it("an owner-operated answer leaves rent at the example's (hidden) value", () => {
    const form = formFromAnswers(example, { model: "owner_operated", adr: 1500, nights: 10, rent: 9000, commission: 5 });
    expect(form.values.rent).toBe(example.values.rent);
    expect(form.values.commissionPercent).toBe(example.values.commissionPercent);
  });
});
