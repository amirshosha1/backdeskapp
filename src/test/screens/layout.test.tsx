import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DemoBanner } from "@/components/demo/demo-banner";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<BottomNav />", () => {
  it("renders all 5 tabs: Home, Calculator, Guide, Units, More", () => {
    const { getByRole } = renderWithIntl(<BottomNav />);
    for (const [name, href] of [
      ["الرئيسية", "/demo"],
      ["الحاسبة", "/demo/calculator"],
      ["الدليل", "/demo/guide"],
      ["الوحدات", "/demo/units"],
      ["المزيد", "/demo/more"],
    ]) {
      expect(getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });
});

describe("<DemoBanner />", () => {
  it('shows the "بيانات تجريبية" sample-data banner', () => {
    const { getByText } = renderWithIntl(<DemoBanner />);
    expect(getByText("بيانات تجريبية")).toBeInTheDocument();
  });
});
