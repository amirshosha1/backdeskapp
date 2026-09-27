import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { CalculatorScreen } from "@/components/calculator/calculator-screen";
import { CALCULATOR_RESULTS, CALCULATOR_STEPS } from "@/demo/fixtures/calculator";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<CalculatorScreen />", () => {
  it("leads with Example B's monthly NOI and the verdict", () => {
    renderWithIntl(<CalculatorScreen steps={CALCULATOR_STEPS} results={CALCULATOR_RESULTS} />);
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("-2,847.00");
    expect(screen.getByText(/الوحدة تخسر/)).toBeInTheDocument();
  });

  it("shows the 4 input steps and the result as step 5 of 5", () => {
    renderWithIntl(<CalculatorScreen steps={CALCULATOR_STEPS} results={CALCULATOR_RESULTS} />);
    expect(CALCULATOR_STEPS).toHaveLength(4);
    for (const step of CALCULATOR_STEPS) {
      expect(screen.getByRole("heading", { name: step.title.ar })).toBeInTheDocument();
    }
    expect(screen.getByText("الخطوة 5 من 5")).toBeInTheDocument();
  });

  it("explains, when an assumption is tapped, that editing comes with the live calculator", () => {
    renderWithIntl(<CalculatorScreen steps={CALCULATOR_STEPS} results={CALCULATOR_RESULTS} />);
    fireEvent.click(screen.getByRole("button", { name: /الإيجار الشهري/ }));
    expect(screen.getByTestId("toast")).toHaveTextContent("تعديل الأرقام يتفعّل مع الحاسبة الحية");
  });

  it("keeps the 12-month projection behind a locked teaser that links to plans", () => {
    renderWithIntl(<CalculatorScreen steps={CALCULATOR_STEPS} results={CALCULATOR_RESULTS} />);
    expect(screen.getByRole("link", { name: "عرض الباقات" })).toHaveAttribute("href", "/demo/pricing");
  });
});
