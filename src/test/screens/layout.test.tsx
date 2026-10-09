import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DemoBanner } from "@/components/demo/demo-banner";
import { LanguageSwitch } from "@/components/layout/language-switch";
import NotFound from "@/app/[locale]/not-found";

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
  it('without accounts configured, reads just "محفوظ على هذا الجهاز" (nothing to sign in to), never "بيانات تجريبية"', () => {
    renderWithIntl(<DemoBanner />);
    expect(screen.getByTestId("device-banner")).toHaveTextContent(/^محفوظ على هذا الجهاز$/);
    expect(screen.queryByText("بيانات تجريبية")).toBeNull();
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

describe("the 404 page", () => {
  it("ships no top line and no language switch; a plain link goes home in its language", () => {
    const { unmount } = renderWithIntl(<NotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("الصفحة غير موجودة");
    expect(screen.getByRole("link", { name: "العودة للرئيسية" })).toHaveAttribute("href", "/demo");
    expect(screen.queryByTestId("device-banner")).toBeNull();
    expect(screen.queryByTestId("guest-banner")).toBeNull();
    expect(screen.queryByTestId("feedback-link")).toBeNull();
    expect(screen.queryByTestId("language-switch")).toBeNull();
    unmount();
    renderWithIntl(<NotFound />, { locale: "en" });
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/en/demo");
  });
});
