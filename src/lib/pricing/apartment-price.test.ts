import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { extraApartmentPrice, listedTotals, monthlyTotal } from "./apartment-price";

describe("apartment pricing", () => {
  it("249 a month: each extra apartment is 125 (half, rounded up to a whole pound)", () => {
    expect(extraApartmentPrice("249.00").toFixed(2)).toBe("125.00");
    expect(extraApartmentPrice("250.00").toFixed(2)).toBe("125.00");
  });

  it("lists 2 to 5 apartments at 374, 499, 624 and 749", () => {
    expect(listedTotals("249.00", 5)).toEqual([
      { apartments: 2, total: "374.00" },
      { apartments: 3, total: "499.00" },
      { apartments: 4, total: "624.00" },
      { apartments: 5, total: "749.00" },
    ]);
  });

  it("one apartment costs the plan price; fewer than one, or a fraction, is refused", () => {
    expect(monthlyTotal("249.00", 1).toFixed(2)).toBe("249.00");
    expect(() => monthlyTotal("249.00", 0)).toThrow(RangeError);
    expect(() => monthlyTotal("249.00", 2.5)).toThrow(RangeError);
    expect(listedTotals("249.00", 1)).toEqual([]);
  });

  it("for any whole-pound price: the extra is a whole pound, at least half the price and at most 0.50 above it; one apartment is the price and each more adds exactly the extra", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100_000 }), fc.integer({ min: 1, max: 50 }), (price, apartments) => {
        const extra = extraApartmentPrice(price);
        expect(extra.isInteger()).toBe(true);
        expect(extra.times(2).gte(price)).toBe(true);
        expect(extra.times(2).minus(price).lte(1)).toBe(true);
        expect(monthlyTotal(price, apartments + 1).minus(monthlyTotal(price, apartments)).eq(extra)).toBe(true);
        expect(monthlyTotal(price, 1).eq(price)).toBe(true);
      }),
    );
  });
});
