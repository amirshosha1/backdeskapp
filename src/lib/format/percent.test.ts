import { describe, expect, it } from "vitest";
import { capDisplayRatio, formatPercent } from "./percent";

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
});
