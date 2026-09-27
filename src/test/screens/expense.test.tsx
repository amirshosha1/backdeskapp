import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { AddExpenseScreen } from "@/components/expense/add-expense-screen";
import { DEFAULT_EXPENSE_UNIT, EXPENSE_UNITS, RECENT_CATEGORIES } from "@/demo/fixtures/expense";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

function renderScreen() {
  return renderWithIntl(
    <AddExpenseScreen categories={RECENT_CATEGORIES} units={EXPENSE_UNITS} defaultUnitId={DEFAULT_EXPENSE_UNIT.id} />,
  );
}

function typeAmount(value: string) {
  const input = document.querySelector("input[inputmode='decimal']") as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
}

/**
 * BUILD_PLAN.md Phase P/5: add expense in ≤ 4 taps, not counting the
 * amount digits. This screen is 2 of them (category + Save); the Home
 * button is the 3rd, counted by the e2e suite.
 */
describe("<AddExpenseScreen />", () => {
  it("saves with the amount typed, one category tap and one Save tap", () => {
    renderScreen();
    typeAmount("500");
    fireEvent.click(screen.getByRole("radio", { name: RECENT_CATEGORIES[0]!.name.ar }));
    fireEvent.click(screen.getByRole("button", { name: "حفظ المصروف" }));
    expect(screen.getByText("تم حفظ المصروف (تجريبيًا)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "العودة للرئيسية" })).toHaveAttribute("href", "/demo");
  });

  it("never taps silently: Save says what's missing", () => {
    renderScreen();
    fireEvent.click(screen.getByRole("button", { name: "حفظ المصروف" }));
    expect(screen.getByRole("alert")).toHaveTextContent("أدخل المبلغ أولًا");
    typeAmount("120");
    fireEvent.click(screen.getByRole("button", { name: "حفظ المصروف" }));
    expect(screen.getByRole("alert")).toHaveTextContent("اختر فئة المصروف");
  });

  it("preselects the default unit and lets the unit be changed from a sheet", () => {
    renderScreen();
    expect(screen.getByRole("button", { name: /شقة مدينتي/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /شقة مدينتي/ }));
    fireEvent.click(screen.getByRole("radio", { name: /شقة الرحاب/ }));
    expect(screen.getByRole("button", { name: /شقة الرحاب/ })).toBeInTheDocument();
  });

  it("offers another expense after saving and resets the form", () => {
    renderScreen();
    typeAmount("75");
    fireEvent.click(screen.getByRole("radio", { name: RECENT_CATEGORIES[1]!.name.ar }));
    fireEvent.click(screen.getByRole("button", { name: "حفظ المصروف" }));
    fireEvent.click(screen.getByRole("button", { name: "إضافة مصروف آخر" }));
    expect((document.querySelector("input[inputmode='decimal']") as HTMLInputElement).value).toBe("");
  });
});
