import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { MoreScreen } from "@/components/more/more-screen";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<MoreScreen />", () => {
  it("links to plans and pricing", () => {
    renderWithIntl(<MoreScreen />);
    expect(screen.getByRole("link", { name: /الباقات والأسعار/ })).toHaveAttribute("href", "/demo/pricing");
  });

  it("opens an 'about this prototype' sheet", () => {
    renderWithIntl(<MoreScreen />);
    fireEvent.click(screen.getByRole("button", { name: "عن النسخة التجريبية" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("لا يُحفظ أي شيء تكتبه");
  });

  it("offers the language switch", () => {
    renderWithIntl(<MoreScreen />);
    expect(screen.getByTestId("more-language")).toHaveTextContent("اللغة");
  });
});
