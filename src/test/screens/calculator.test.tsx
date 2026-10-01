import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { CalculatorScreen } from "@/components/calculator/calculator-screen";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

/**
 * The live calculator (BUILD_PLAN.md Phase 1 acceptance): fed the Example A
 * and B inputs, it shows the engine's results, and it recalculates as the
 * host types.
 */

function renderCalculator(locale: "ar" | "en" = "ar") {
  return renderWithIntl(<CalculatorScreen presets={CALCULATOR_PRESETS} />, { locale });
}

const field = (label: RegExp) => screen.getByRole("textbox", { name: label });
const type = (label: RegExp, value: string) => fireEvent.change(field(label), { target: { value } });
/** Text without the LRI/PDI isolates that wrap numbers inside sentences (src/lib/format/). */
const plain = (el: Element) => (el.textContent ?? "").replace(/[\u2066-\u2069]/g, "");
const verdict = () => plain(screen.getByTestId("verdict"));
const paragraphWith = (text: string) => screen.getByText((_, el) => el?.tagName === "P" && plain(el).includes(text));

describe("<CalculatorScreen /> — Example B (default)", () => {
  it("leads with Example B's profit before depreciation (= NOI −2,847.00) and the engine's verdict", () => {
    renderCalculator();
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("-2,847.00");
    expect(verdict()).toBe("بإشغال 60% الوحدة تخسر، والتعادل عند 64.6%");
  });

  it("shows break-even 19.38 nights (64.6%) with maintenance, and 18.99 (63.3%) without", () => {
    renderCalculator();
    expect(screen.getByTestId("break-even-nights")).toHaveTextContent("19.38");
    expect(screen.getByTestId("break-even-occupancy")).toHaveTextContent("64.6%");
    expect(screen.getByTestId("break-even-excluding-maintenance")).toHaveTextContent("18.99");
    expect(plain(screen.getByTestId("break-even-excluding-maintenance"))).toContain("(63.3%)");
  });

  it("gives net profit after depreciation its own break-even, on its own basis", () => {
    renderCalculator();
    expect(screen.getByTestId("result-net-profit")).toHaveTextContent("-7,013.67");
    expect(screen.getByTestId("break-even-with-depreciation")).toHaveTextContent("21.41");
    expect(plain(screen.getByTestId("break-even-with-depreciation"))).toContain("(71.4%)");
  });

  it("shows the 4 input steps and the result as step 5 of 5", () => {
    renderCalculator();
    for (const title of ["الوحدة", "نموذج التشغيل", "الإيرادات", "التكاليف"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByText("الخطوة 5 من 5")).toBeInTheDocument();
  });
});

describe("<CalculatorScreen /> — Example A", () => {
  it("shows the owner's net before depreciation 24,142.40 and the 8,010.60 commission", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("radio", { name: "إدارة لمالك — وسط البلد" }));
    expect(screen.getByRole("radio", { name: "إدارة لمالك — وسط البلد" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("24,142.40");
    const results = screen.getByTestId("results");
    expect(within(results).getByText("-8,010.60")).toBeInTheDocument();
    expect(within(results).getByText("+32,153.00")).toBeInTheDocument();
  });
});

describe("<CalculatorScreen /> — live input", () => {
  it("recalculates as the host types: 20 nights clears break-even", () => {
    renderCalculator();
    type(/الليالي المحجوزة/, "20");
    // 2,058.50 × 20 − 39,900 = 1,270.00
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("1,270.00");
    expect(verdict()).toBe("بإشغال 67% الوحدة تربح، والتعادل عند 64.6%");
    expect(paragraphWith("إشغال 66.7% من 30 ليلة متاحة")).toBeInTheDocument();
  });

  it("accepts Arabic-Indic digits and separators through parseAmount", () => {
    renderCalculator();
    type(/الليالي المحجوزة/, "٢٠");
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("1,270.00");
    type(/الإيجار الشهري/, "٣٥٬٠٠٠");
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("1,270.00");
  });

  it("accepts zero: no rent turns Example B into a 32,153.00 month", () => {
    renderCalculator();
    type(/الإيجار الشهري/, "0");
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("32,153.00");
    expect(screen.queryByTestId("stale-notice")).toBeNull();
  });

  it("an invalid entry is flagged on its field and the results keep the last valid entry, dimmed", () => {
    renderCalculator();
    type(/الليالي المحجوزة/, "20");
    type(/الليالي المحجوزة/, "20.5");
    expect(field(/الليالي المحجوزة/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("أدخل عددًا صحيحًا")).toBeInTheDocument();
    expect(screen.getByTestId("stale-notice")).toBeInTheDocument();
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("1,270.00");
    type(/الليالي المحجوزة/, "");
    expect(screen.getByText("أدخل رقمًا")).toBeInTheDocument();
    type(/عمولة المنصة/, "120");
    expect(screen.getByText("النسبة بين 0 و100")).toBeInTheDocument();
  });

  it("a setup cost needs a useful life; blocked nights can't exceed the month", () => {
    renderCalculator();
    type(/العمر الافتراضي/, "0");
    expect(screen.getByText("أدخل العمر الافتراضي لتكلفة التجهيز")).toBeInTheDocument();
    type(/العمر الافتراضي/, "60");
    type(/الليالي المغلقة/, "31");
    expect(screen.getByText("أكثر من عدد أيام الشهر")).toBeInTheDocument();
  });

  it("booked nights above available nights: a data warning, occupancy shown capped at 100%", () => {
    renderCalculator();
    type(/الليالي المغلقة/, "10");
    type(/الليالي المحجوزة/, "25");
    expect(screen.getByRole("alert")).toHaveTextContent("الليالي المحجوزة أكثر من الليالي المتاحة");
    expect(paragraphWith("إشغال 100.0% من 20 ليلة متاحة")).toBeInTheDocument();
  });

  it("an unreachable break-even says so instead of showing a number", () => {
    renderCalculator();
    type(/الإيجار الشهري/, "100000");
    expect(screen.getByTestId("break-even-nights")).toHaveTextContent("—");
    expect(verdict()).toContain("حتى مع حجز كل الليالي المتاحة");
  });

  it("SAMPLE marks the setup cost until the host types their own; editing deselects the example, which resets it", () => {
    renderCalculator();
    const setupRow = () => field(/تكلفة التجهيز/).closest("div.py-3")!;
    expect(within(setupRow() as HTMLElement).getByText("تجريبي")).toBeInTheDocument();
    type(/تكلفة التجهيز/, "300000");
    expect(within(setupRow() as HTMLElement).queryByText("تجريبي")).toBeNull();
    const example = screen.getByRole("radio", { name: "إعادة تأجير — الشيخ زايد" });
    expect(example).toHaveAttribute("aria-checked", "false");
    fireEvent.click(example);
    expect(field(/تكلفة التجهيز/)).toHaveValue("250000");
    expect(example).toHaveAttribute("aria-checked", "true");
  });

  it("switching to managed shows the commission terms; hybrid adds its mode and basis", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("radio", { name: "إدارة لحساب مالك" }));
    expect(screen.queryByRole("textbox", { name: /الإيجار الشهري/ })).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: "أساس العمولة" }), { target: { value: "hybrid" } });
    expect(screen.getByRole("combobox", { name: "طريقة الحساب" })).toBeInTheDocument();
    type(/نسبة العمولة/, "10");
    type(/الحد الأدنى الشهري للعمولة/, "3000");
    expect(screen.getByTestId("results")).toHaveTextContent("-4,740.00");
    fireEvent.click(screen.getByRole("switch", { name: /رسوم التنظيف ضمن أساس العمولة/ }));
    expect(screen.getByTestId("results")).toHaveTextContent("-4,500.00");
  });
});

describe("<CalculatorScreen /> — rest of the screen", () => {
  it("unit details explain, on tap, that they feed the area comparison later", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("button", { name: /المنطقة/ }));
    expect(screen.getByTestId("toast")).toHaveTextContent("بيانات الوحدة تُستخدم لمقارنة المنطقة في النسخة الكاملة");
  });

  it("keeps the 12-month projection behind a locked teaser that links to plans", () => {
    renderCalculator();
    expect(screen.getByRole("link", { name: "عرض الباقات" })).toHaveAttribute("href", "/demo/pricing");
  });

  it("works in English", () => {
    renderCalculator("en");
    expect(verdict()).toBe("At 60% occupancy this unit loses money; break-even is 64.6%");
    expect(screen.getByText("Monthly profit before depreciation")).toBeInTheDocument();
  });
});
