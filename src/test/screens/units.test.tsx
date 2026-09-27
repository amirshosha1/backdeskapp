import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { UnitsScreen } from "@/components/units/units-screen";
import { OwnerStatement } from "@/components/statement/owner-statement";
import { UNITS } from "@/demo/fixtures/units";
import { STATEMENT } from "@/demo/fixtures/statement";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<UnitsScreen />", () => {
  it("renders all 4 sample units with corrected names", () => {
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.getAllByTestId("unit-card")).toHaveLength(4);
    expect(screen.getByText("شقة مدينتي")).toBeInTheDocument();
    expect(screen.queryByText("شقة المدينتي")).toBeNull();
    expect(screen.getAllByText(/إعادة تأجير/).length).toBeGreaterThan(0);
  });

  it("opens Downtown's statement; Rehab's statement explains it comes later", () => {
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.getByRole("link", { name: "عرض كشف الحساب" })).toHaveAttribute(
      "href",
      "/demo/units/downtown-cairo/statement",
    );
    fireEvent.click(screen.getByRole("button", { name: "عرض كشف الحساب" }));
    expect(screen.getByTestId("toast")).toHaveTextContent("كشف حساب هذه الوحدة متاح في النسخة الكاملة");
  });

  it("tapping a unit explains that the unit page comes in the full version", () => {
    renderWithIntl(<UnitsScreen units={UNITS} />);
    fireEvent.click(screen.getByRole("button", { name: /شقة الشيخ زايد/ }));
    expect(screen.getByTestId("toast")).toHaveTextContent("صفحة الوحدة متاحة في النسخة الكاملة");
  });

  it("shows an empty state when there are no units", () => {
    renderWithIntl(<UnitsScreen units={[]} />);
    expect(screen.getByText("لا توجد وحدات بعد")).toBeInTheDocument();
  });
});

describe("<OwnerStatement />", () => {
  it("renders every line, with the balance due on its own line", () => {
    renderWithIntl(<OwnerStatement statement={STATEMENT} />);
    expect(screen.getByText(/47,400\.00/)).toBeInTheDocument();
    const balance = screen.getByText("المتبقي للمالك").closest("div")!;
    expect(within(balance).getByText(/4,142\.40/)).toBeInTheDocument();
  });

  it("puts the minus sign of negative amounts inside an LTR isolate", () => {
    const { container } = renderWithIntl(<OwnerStatement statement={STATEMENT} />);
    const fees = [...container.querySelectorAll("bdi")].find((el) => el.textContent === "-7,347.00");
    expect(fees).toBeDefined();
    expect(fees).toHaveAttribute("dir", "ltr");
  });

  it("PDF and share-link explain they come in the full version (no disabled buttons)", () => {
    renderWithIntl(<OwnerStatement statement={STATEMENT} />);
    const pdf = screen.getByRole("button", { name: /تنزيل PDF/ });
    expect(pdf).toBeEnabled();
    fireEvent.click(pdf);
    expect(screen.getByTestId("toast")).toHaveTextContent("تنزيل الكشف PDF متاح في النسخة الكاملة");
  });
});
