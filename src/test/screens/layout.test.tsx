import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DemoBanner } from "@/components/demo/demo-banner";
import { LanguageSwitch } from "@/components/layout/language-switch";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<BottomNav />", () => {
  it("renders all 5 tabs: Home, Calculator, Guide, Units, More", () => {
    renderWithIntl(<BottomNav />);
    for (const [name, href] of [
      ["الرئيسية", "/demo"],
      ["الحاسبة", "/demo/calculator"],
      ["الدليل", "/demo/guide"],
      ["الوحدات", "/demo/units"],
      ["المزيد", "/demo/more"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });
});

describe("<DemoBanner />", () => {
  it('reads just "بيانات تجريبية"', () => {
    renderWithIntl(<DemoBanner />);
    expect(screen.getByTestId("demo-banner")).toHaveTextContent(/^بيانات تجريبية$/);
  });
});

describe("<LanguageSwitch />", () => {
  it("offers English from Arabic and Arabic from English", () => {
    const { unmount } = renderWithIntl(<LanguageSwitch />);
    expect(screen.getByTestId("language-switch")).toHaveTextContent("EN");
    unmount();
    renderWithIntl(<LanguageSwitch />, { locale: "en" });
    expect(screen.getByTestId("language-switch")).toHaveTextContent("ع");
  });
});
