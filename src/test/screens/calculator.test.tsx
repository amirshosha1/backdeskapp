import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { CalculatorScreen } from "@/components/calculator/calculator-screen";
import { CALCULATOR_RESULTS, CALCULATOR_STEPS } from "@/demo/fixtures/calculator";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<CalculatorScreen />", () => {
  it("renders all 4 assumption steps plus the results (the 5th wizard step)", () => {
    const { getByText } = renderWithIntl(
      <CalculatorScreen steps={CALCULATOR_STEPS} results={CALCULATOR_RESULTS} />,
    );
    expect(CALCULATOR_STEPS).toHaveLength(4);
    for (const step of CALCULATOR_STEPS) {
      expect(getByText(step.title.ar)).toBeInTheDocument();
    }
    expect(getByText(/-2,847\.00/)).toBeInTheDocument();
  });

  it("shows the not-yet-profitable verdict for Example B", () => {
    const { getByText } = renderWithIntl(
      <CalculatorScreen steps={CALCULATOR_STEPS} results={CALCULATOR_RESULTS} />,
    );
    expect(getByText(/غير مربحة/)).toBeInTheDocument();
  });

  it("shows a locked teaser for the 12-month projection, not real projection data", () => {
    const { getByText } = renderWithIntl(
      <CalculatorScreen steps={CALCULATOR_STEPS} results={CALCULATOR_RESULTS} />,
    );
    expect(getByText("افتح مع أي باقة مدفوعة")).toBeInTheDocument();
  });
});
