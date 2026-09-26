import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { AddExpenseScreen } from "@/components/expense/add-expense-screen";
import { DEFAULT_EXPENSE_UNIT, RECENT_CATEGORIES } from "@/demo/fixtures/expense";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

/**
 * BUILD_PLAN.md Phase P/5: add expense in ≤ 4 taps, not counting the
 * amount digits. This screen alone is 2 of those taps (category + Save);
 * the 3rd is the Home "Add expense" button, covered by the e2e suite.
 */
describe("<AddExpenseScreen />", () => {
  it("disables Save until both an amount and a category are set", () => {
    const { getByRole } = renderWithIntl(
      <AddExpenseScreen categories={RECENT_CATEGORIES} unit={DEFAULT_EXPENSE_UNIT} />,
    );
    expect(getByRole("button", { name: "حفظ" })).toBeDisabled();
  });

  it("enables Save once an amount is typed and a category is tapped, then confirms on save", () => {
    const { getByRole, getByText } = renderWithIntl(
      <AddExpenseScreen categories={RECENT_CATEGORIES} unit={DEFAULT_EXPENSE_UNIT} />,
    );

    // The amount field is a plain text input with inputMode="decimal"
    // (CLAUDE.md §7), so it carries no distinct ARIA role to query by.
    const input = document.querySelector("input[inputmode='decimal']") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "500" } });

    const categoryButton = getByRole("button", { name: RECENT_CATEGORIES[0]!.name.ar });
    fireEvent.click(categoryButton);

    const saveButton = getByRole("button", { name: "حفظ" });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    expect(getByText("تم الحفظ (تجريبيًا)")).toBeInTheDocument();
    expect(getByText(/في النسخة الكاملة/)).toBeInTheDocument();
  });

  it("preselects the default unit and shows today's date without any interaction", () => {
    const { getByText } = renderWithIntl(
      <AddExpenseScreen categories={RECENT_CATEGORIES} unit={DEFAULT_EXPENSE_UNIT} />,
    );
    expect(getByText(DEFAULT_EXPENSE_UNIT.name.ar)).toBeInTheDocument();
    expect(getByText(/اليوم/)).toBeInTheDocument();
  });
});
