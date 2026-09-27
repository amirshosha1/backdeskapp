import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { ExpensesScreen } from "@/components/expenses/expenses-screen";
import { EXPENSE_BREAKDOWN } from "@/demo/fixtures/expense";
import { HOME_PERIOD } from "@/demo/fixtures/home";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<ExpensesScreen />", () => {
  it("draws one glass bubble per group with its percentage inside", () => {
    renderWithIntl(<ExpensesScreen period={HOME_PERIOD} breakdown={EXPENSE_BREAKDOWN} />);
    const bubbles = screen.getAllByTestId("expense-bubble");
    expect(bubbles).toHaveLength(EXPENSE_BREAKDOWN.bubbles.length);
    expect(bubbles[0]).toHaveTextContent("68.9%");
  });

  it("sizes the bubbles by share (largest first)", () => {
    renderWithIntl(<ExpensesScreen period={HOME_PERIOD} breakdown={EXPENSE_BREAKDOWN} />);
    const widths = screen.getAllByTestId("expense-bubble").map((el) => parseFloat(el.style.width));
    expect(widths[0]).toBeGreaterThan(widths[1]!);
    expect(widths[1]).toBeGreaterThanOrEqual(widths[2]!);
  });

  it("lists every category with its amount under the total", () => {
    renderWithIntl(<ExpensesScreen period={HOME_PERIOD} breakdown={EXPENSE_BREAKDOWN} />);
    expect(screen.getByText(/50,800\.00/)).toBeInTheDocument();
    for (const category of EXPENSE_BREAKDOWN.categories) {
      expect(screen.getAllByText(category.name.ar).length).toBeGreaterThan(0);
    }
  });
});
