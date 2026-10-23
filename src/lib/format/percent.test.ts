import { describe, expect, it } from "vitest";
import { capDisplayRatio, formatPercent } from "./percent";
import { LRI, PDI } from "./money";

describe("capDisplayRatio", () => {
  it("passes a ratio at or below 1 through unchanged", () => {
    expect(capDisplayRatio(0.6)).toEqual({ display: 0.6, isOverCapacity: false });
    expect(capDisplayRatio(1)).toEqual({ display: 1, isOverCapacity: false });
  });

  it("caps a ratio above 1 at 1 and flags it (BUILD_PLAN.md §4.1, Example J)", () => {
    // 25 booked / 20 available = 1.25 -> displayed 100%, flagged.
    expect(capDisplayRatio(1.25)).toEqual({ display: 1, isOverCapacity: true });
  });
});

describe("formatPercent", () => {
  it("formats a ratio as a percentage, half-up rounded", () => {
    expect(formatPercent(0.633, { locale: "en" })).toBe("63.3%");
    expect(formatPercent(0.6, { locale: "ar" })).toBe("60.0%");
  });

  it("respects a custom decimal count", () => {
    expect(formatPercent(0.633, { locale: "en", decimals: 0 })).toBe("63%");
  });

  it("shows a sign on changes only when asked, never on zero", () => {
    expect(formatPercent(0.084, { locale: "ar", signDisplay: "always" })).toBe("+8.4%");
    expect(formatPercent(-0.052, { locale: "en" })).toBe("−5.2%");
    expect(formatPercent(0, { locale: "en", signDisplay: "always" })).toBe("0.0%");
  });

  it("wraps the result in LTR isolate marks when asked", () => {
    expect(formatPercent(0.689, { locale: "ar", isolate: true })).toBe(`${LRI}68.9%${PDI}`);
  });
});
