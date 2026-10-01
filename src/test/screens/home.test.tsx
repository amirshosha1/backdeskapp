import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { HomeScreen } from "@/components/home/home-screen";
import { HOME_COHOST_VIEW, HOME_OWNER_VIEW, HOME_PERIOD } from "@/demo/fixtures/home";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

function renderHome() {
  return renderWithIntl(<HomeScreen period={HOME_PERIOD} ownerView={HOME_OWNER_VIEW} coHostView={HOME_COHOST_VIEW} />);
}

describe("<HomeScreen />", () => {
  it("answers the hero question with the owner-view total, decimals separate", () => {
    renderHome();
    expect(screen.getByRole("heading", { level: 1, name: "كم ربحت فعلاً هذا الشهر؟" })).toBeInTheDocument();
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("15,744.33");
  });

  it("shows one swipeable glass card per unit, each opening Units — and no separate units list", () => {
    renderHome();
    const cards = screen.getAllByTestId("unit-card");
    expect(cards).toHaveLength(HOME_OWNER_VIEW.units.length);
    expect(cards[0]).toHaveTextContent("شقة مدينتي");
    expect(cards[0]).toHaveTextContent("يديرها المالك");
    expect(cards[0]).toHaveAttribute("href", "/demo/units");
    expect(screen.queryByRole("heading", { name: "وحداتك" })).toBeNull();
  });

  it("owner view: the third quick action is the month report and explains it arrives later", () => {
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /تقرير الشهر/ }));
    expect(screen.getByTestId("toast")).toHaveTextContent("تقرير الشهر لكل وحدة متاح قريبًا");
  });

  it("co-host view: the total, the managed units, and a statement action to Downtown", () => {
    renderHome();
    fireEvent.click(screen.getByRole("radio", { name: "أدير لملاك" }));
    expect(screen.getByTestId("hero-figure")).toHaveTextContent("8,790.60");
    expect(screen.getAllByTestId("unit-card")).toHaveLength(HOME_COHOST_VIEW.units.length);
    expect(screen.getByRole("link", { name: /كشف حساب/ })).toHaveAttribute(
      "href",
      "/demo/units/downtown-cairo/statement",
    );
    expect(screen.getByText("تكاليف إدارية عامة")).toBeInTheDocument();
  });

  it("links 'التفاصيل' to the expense breakdown and 'إضافة مصروف' to add expense", () => {
    renderHome();
    expect(screen.getByRole("link", { name: "التفاصيل" })).toHaveAttribute("href", "/demo/expenses");
    expect(screen.getByRole("link", { name: /إضافة مصروف/ })).toHaveAttribute("href", "/demo/expenses/new");
  });

  it("the month-over-month chips are computed from the sample August: +8.5% owner, +4.4% co-host", () => {
    renderHome();
    expect(screen.getByTestId("change-chip")).toHaveTextContent("+8.5%");
    fireEvent.click(screen.getByRole("radio", { name: "أدير لملاك" }));
    expect(screen.getByTestId("change-chip")).toHaveTextContent("+4.4%");
  });

  it("hides the chip when last month gives no meaningful base, and shows a fall as a fall", () => {
    renderWithIntl(
      <HomeScreen period={HOME_PERIOD} ownerView={{ ...HOME_OWNER_VIEW, change: null }} coHostView={HOME_COHOST_VIEW} />,
    );
    expect(screen.queryByTestId("change-chip")).toBeNull();
  });

  it("shows a negative change with its minus sign and uncapped", () => {
    renderWithIntl(
      <HomeScreen period={HOME_PERIOD} ownerView={{ ...HOME_OWNER_VIEW, change: -1.25 }} coHostView={HOME_COHOST_VIEW} />,
    );
    expect(screen.getByTestId("change-chip")).toHaveTextContent("-125.0%");
  });

  it("the break-even tile states its cost basis — the same costs as net profit — and the nights needed", () => {
    renderHome();
    expect(screen.getByText("شقة الشيخ زايد تحت نقطة التعادل")).toBeInTheDocument();
    expect(screen.getByText("التعادل عند 23 ليلة")).toBeInTheDocument();
    expect(screen.getByTestId("break-even-basis")).toHaveTextContent("حساب التعادل يشمل الصيانة وإهلاك التجهيز، مثل صافي الربح");
  });

  it("'إضافة دخل' explains that it arrives in the full version", () => {
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /إضافة دخل/ }));
    expect(screen.getByTestId("toast")).toHaveTextContent("تسجيل الدخل متاح في النسخة الكاملة");
  });
});
