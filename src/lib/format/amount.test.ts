import { describe, expect, it } from "vitest";
import { formatTypedAmount, parseAmount } from "./amount";

function value(result: ReturnType<typeof parseAmount>): string {
  if (!result.ok) throw new Error(`expected ok, got error "${result.error}"`);
  return result.value.toString();
}

function error(result: ReturnType<typeof parseAmount>): string {
  if (result.ok) throw new Error(`expected an error, got ok value "${result.value.toString()}"`);
  return result.error;
}

describe("parseAmount", () => {
  it("accepts a plain Western-digit amount", () => {
    expect(value(parseAmount("500"))).toBe("500");
    expect(value(parseAmount("1200.50"))).toBe("1200.5");
  });

  it("normalizes Arabic-Indic digits", () => {
    expect(value(parseAmount("٥٠٠"))).toBe("500");
  });

  it("normalizes Persian digits", () => {
    expect(value(parseAmount("۵۰۰"))).toBe("500");
  });

  it("treats ٫ as the decimal point and strips ٬ and , as thousands separators", () => {
    expect(value(parseAmount("١٬٢٥٠٫٥٠"))).toBe("1250.5");
    expect(value(parseAmount("1,250.50"))).toBe("1250.5");
  });

  it("rejects more than one decimal point", () => {
    expect(error(parseAmount("1200.5.5"))).toBe("invalid");
  });

  it("rejects letters, even mixed with a valid-looking negative number", () => {
    expect(error(parseAmount("-50abc1200"))).toBe("invalid");
  });

  it("rejects more than 2 decimal places", () => {
    expect(error(parseAmount("100.123"))).toBe("invalid");
  });

  it("rejects a well-formed negative amount as non_positive", () => {
    expect(error(parseAmount("-50"))).toBe("non_positive");
    expect(error(parseAmount("-50.25"))).toBe("non_positive");
  });

  it("rejects zero as non_positive", () => {
    expect(error(parseAmount("0"))).toBe("non_positive");
    expect(error(parseAmount("0.00"))).toBe("non_positive");
  });

  it("rejects empty input, including whitespace only", () => {
    expect(error(parseAmount(""))).toBe("empty");
    expect(error(parseAmount("   "))).toBe("empty");
  });

  it("accepts exactly 2 decimal places", () => {
    expect(value(parseAmount("99.99"))).toBe("99.99");
  });

  it("rejects a bare decimal point or a bare minus sign", () => {
    expect(error(parseAmount("."))).toBe("invalid");
    expect(error(parseAmount("-"))).toBe("invalid");
  });
});

describe("parseAmount options (Phase 1 calculator)", () => {
  it("allowZero accepts zero (never as negative zero) and rejects negatives as `negative`", () => {
    expect(value(parseAmount("0", { allowZero: true }))).toBe("0");
    expect(value(parseAmount("-0", { allowZero: true }))).toBe("0");
    expect(value(parseAmount("٠٫٠٠", { allowZero: true }))).toBe("0");
    expect(error(parseAmount("-5", { allowZero: true }))).toBe("negative");
    expect(value(parseAmount("35,000", { allowZero: true }))).toBe("35000");
  });

  it("maxDecimals: 0 accepts whole numbers only (nights)", () => {
    expect(value(parseAmount("١٨", { allowZero: true, maxDecimals: 0 }))).toBe("18");
    expect(error(parseAmount("18.5", { allowZero: true, maxDecimals: 0 }))).toBe("invalid");
  });

  it("the defaults are unchanged for add-expense", () => {
    expect(error(parseAmount("0"))).toBe("non_positive");
    expect(error(parseAmount("1.234"))).toBe("invalid");
  });
});

describe("formatTypedAmount (shown on blur)", () => {
  it("groups thousands and keeps the typed decimals; leaves invalid input as typed", () => {
    expect(formatTypedAmount("35000", "ar")).toBe("35,000");
    expect(formatTypedAmount("٢٥٠٠٠٠", "en")).toBe("250,000");
    expect(formatTypedAmount("15.5", "ar")).toBe("15.5");
    expect(formatTypedAmount("1234.56", "en")).toBe("1,234.56");
    expect(formatTypedAmount("0", "ar")).toBe("0");
    expect(formatTypedAmount("1.2.3", "ar")).toBe("1.2.3");
    expect(formatTypedAmount("", "ar")).toBe("");
  });
});
