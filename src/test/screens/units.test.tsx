import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { UnitsScreen } from "@/components/units/units-screen";
import { OwnerStatement } from "@/components/statement/owner-statement";
import { UNITS } from "@/demo/fixtures/units";
import { STATEMENT } from "@/demo/fixtures/statement";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<UnitsScreen />", () => {
  it("renders all 4 sample units", () => {
    const { getByText } = renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(UNITS).toHaveLength(4);
    for (const unit of UNITS) {
      expect(getByText(unit.name.ar)).toBeInTheDocument();
    }
  });

  it("links the managed unit that has a statement to its statement page", () => {
    const { getByRole } = renderWithIntl(<UnitsScreen units={UNITS} />);
    const link = getByRole("link", { name: /عرض كشف الحساب/ });
    expect(link).toHaveAttribute("href", "/demo/units/downtown-cairo/statement");
  });
});

describe("<OwnerStatement />", () => {
  it("renders every line of the statement, summing correctly", () => {
    const { getByText } = renderWithIntl(<OwnerStatement statement={STATEMENT} />);
    expect(getByText(/47,400\.00/)).toBeInTheDocument();
    expect(getByText(/24,142\.40/)).toBeInTheDocument();
    // "-4,142.40" would also match the "24,142.40" substring above, so
    // assert on the balance-due row specifically.
    expect(getByText("الرصيد المستحق").nextElementSibling).toHaveTextContent("4,142.40");
  });

  it("shows the PDF and share-link actions as locked, not functional", () => {
    const { getByRole } = renderWithIntl(<OwnerStatement statement={STATEMENT} />);
    expect(getByRole("button", { name: /تنزيل PDF/ })).toBeDisabled();
    expect(getByRole("button", { name: /رابط مشاركة/ })).toBeDisabled();
  });
});
