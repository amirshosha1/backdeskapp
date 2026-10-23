import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { currencyLabel, formatMoney, formatMoneyParts, formatNumber, LRI, MINUS, PDI } from "./money";

describe("formatMoney", () => {
  it("formats a positive amount in Arabic with a trailing currency label", () => {
    expect(formatMoney("24142.40", { locale: "ar" })).toBe("24,142.40 ج.م.");
  });

  it("formats a positive amount in English with a leading currency label", () => {
    expect(formatMoney("24142.40", { locale: "en" })).toBe("EGP 24,142.40");
  });

  it("keeps the minus sign attached to the number, not the currency label", () => {
    expect(formatMoney("-2847.00", { locale: "ar" })).toBe("−2,847.00 ج.م.");
    expect(formatMoney("-2847.00", { locale: "en" })).toBe("EGP −2,847.00");
  });

  it("shows a leading plus for positive amounts when signDisplay is always", () => {
    expect(formatMoney("8010.60", { locale: "en", signDisplay: "always" })).toBe(
      "EGP +8,010.60",
    );
  });

  it("wraps the signed number in LTR isolate marks when asked, for use inside Arabic sentences", () => {
    expect(formatMoney("-1500.00", { locale: "ar", isolate: true })).toBe(
      `${LRI}−1,500.00${PDI} ج.م.`,
    );
  });

  it("respects a custom decimal count", () => {
    expect(formatMoney("29306.50", { locale: "en", decimals: 0 })).toBe("EGP 29,307");
  });

  it("never adds a plus sign to zero, even with signDisplay always", () => {
    expect(formatMoney("0.00", { locale: "en", signDisplay: "always" })).toBe("EGP 0.00");
  });

  it("rounds half-up to 2 decimal places (CLAUDE.md §6.2)", () => {
    // 12.345 would round to 12.34 under round-half-even; half-up gives 12.35.
    expect(formatMoney("12.345", { locale: "en" })).toBe("EGP 12.35");
    // BUILD_PLAN.md §4.6 Example I: SAR 1.00 at 12.3450 -> 12.35 (half-up).
    expect(formatMoney("12.345", { locale: "ar" })).toBe("12.35 ج.م.");
  });

  it("groups thousands with Western digits by default", () => {
    expect(formatMoney("47400.00", { locale: "ar" })).toBe("47,400.00 ج.م.");
  });

  it("renders Arabic-Indic digits when digitStyle is arab", () => {
    const result = formatMoney("125.50", { locale: "ar", digitStyle: "arab" });
    expect(result).toContain("١٢٥");
    expect(result).toContain("٥٠");
  });

  it("supports other unit currencies", () => {
    expect(formatMoney("100.00", { locale: "en", currency: "SAR" })).toBe("SAR 100.00");
    expect(formatMoney("100.00", { locale: "ar", currency: "SAR" })).toBe("100.00 ر.س.");
  });

  it("accepts a Decimal-compatible amount without going through a JS float", () => {
    // 0.1 + 0.2 famously isn't 0.3 as a float; formatMoney takes the exact
    // decimal string instead of forcing the caller through float math.
    expect(formatMoney("0.30", { locale: "en" })).toBe("EGP 0.30");
  });
});

describe("formatMoneyParts", () => {
  it("splits an amount into sign, integer, fraction and currency (for dimmed decimals)", () => {
    expect(formatMoneyParts("-7347.005", { locale: "ar" })).toEqual({
      sign: "−",
      integer: "7,347",
      fraction: ".01",
      currency: "ج.م.",
      isNegative: true,
    });
  });

  it("treats an amount that rounds to zero as unsigned", () => {
    const parts = formatMoneyParts("-0.004", { locale: "en", signDisplay: "always" });
    expect(parts.sign).toBe("");
    expect(parts.isNegative).toBe(false);
  });

  it("returns an empty fraction when decimals is 0", () => {
    expect(formatMoneyParts("47400.00", { locale: "en", decimals: 0 }).fraction).toBe("");
  });
});

describe("currencyLabel", () => {
  it("localises the currency label", () => {
    expect(currencyLabel("EGP", "ar")).toBe("ج.م.");
    expect(currencyLabel("EGP", "en")).toBe("EGP");
  });
});

describe("formatNumber", () => {
  it("formats a plain number without a currency label", () => {
    expect(formatNumber("18.99", { locale: "en" })).toBe("18.99");
  });

  it("respects a custom decimal count", () => {
    expect(formatNumber("18.99", { locale: "en", decimals: 0 })).toBe("19");
  });
});

describe("the true minus sign (GTM.md §5/§6, D-35)", () => {
  it("is U+2212, never the ASCII hyphen, on every displayed negative amount", () => {
    expect(MINUS).toBe("\u2212");
    for (const locale of ["ar", "en"] as const) {
      const shown = formatMoney("-12215.30", { locale, decimals: 0 });
      expect(shown).toContain("\u221212,215");
      expect(shown).not.toMatch(/-\d/);
    }
  });

  it("in an Arabic sentence the sign stays on the left of the digits, in an LTR isolate, never \"12,215−\"", () => {
    const sentence = `خسارة هذا الشهر ${formatMoney("-12215.30", { locale: "ar", decimals: 0, isolate: true })} بعد التكاليف.`;
    expect(sentence).toContain(`${LRI}\u221212,215${PDI}`);
    expect(sentence).not.toMatch(/12,215\s*\u2212/);
    expect(sentence).not.toMatch(/12,215\s*-/);
    // The isolate puts the whole signed number in one left-to-right run: the sign is first inside it.
    const isolated = sentence.slice(sentence.indexOf(LRI) + 1, sentence.indexOf(PDI));
    expect(isolated.startsWith("\u2212")).toBe(true);
  });

  it("typed input parsing does not depend on the display formatter", () => {
    for (const file of ["src/lib/format/amount.ts", "src/lib/calculator/form.ts"]) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/formatMoney|MINUS|\\u2212|\u2212/);
    }
  });
});
