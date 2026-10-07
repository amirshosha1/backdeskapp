import { describe, expect, it } from "vitest";
import { formatNights } from "./nights";

describe("formatNights", () => {
  it("shows an exact break-even to two decimals, half-up", () => {
    expect(formatNights("21.40717350821795806", "ar")).toBe("21.41");
    expect(formatNights("33.555", "en")).toBe("33.56");
  });

  it("drops the decimals of a whole number of nights", () => {
    expect(formatNights(22, "ar")).toBe("22");
    expect(formatNights("4.999", "en")).toBe("5");
  });
});
