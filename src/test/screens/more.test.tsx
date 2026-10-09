import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { router } from "@/test/mocks/navigation";
import { MoreScreen } from "@/components/more/more-screen";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { readFirstRunAnswers, writeFirstRunAnswers } from "@/lib/guest/first-run-answers";
import { saveOwnUnit } from "@/lib/guest/store";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

afterEach(() => vi.clearAllMocks());

describe("<MoreScreen />", () => {
  it("links to plans and pricing", () => {
    renderWithIntl(<MoreScreen />);
    expect(screen.getByRole("link", { name: /الباقات والأسعار/ })).toHaveAttribute("href", "/demo/pricing");
  });

  it("opens an 'about this prototype' sheet that says what is saved, and where", () => {
    renderWithIntl(<MoreScreen />);
    fireEvent.click(screen.getByRole("button", { name: "عن النسخة التجريبية" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("الوحدات تحت «أمثلة تجريبية» وأرقامها أمثلة");
    expect(dialog).toHaveTextContent("بدون حساب تُحفظ شقتك على هذا الجهاز فقط ولا تُرسل إلى أي مكان");
    expect(dialog).toHaveTextContent("عند تسجيل الدخول بحساب Google تُحفظ شققك في حسابك");
  });

  it("re-runs the starting questions straight away when no unit is saved", () => {
    writeFirstRunAnswers({ model: "owner_operated", adr: 900, nights: 3, rent: 5000, commission: 5 });
    renderWithIntl(<MoreScreen />);
    fireEvent.click(screen.getByRole("button", { name: "أعد أسئلة البداية" }));
    expect(router.push).toHaveBeenCalledWith("/demo/start");
    // A re-run starts from the example's answers, not an old half-finished run.
    expect(readFirstRunAnswers()).toBeNull();
  });

  it("asks before re-running when a unit is saved; cancel keeps everything", () => {
    saveOwnUnit(CALCULATOR_PRESETS[0]!.form, []);
    renderWithIntl(<MoreScreen />);
    fireEvent.click(screen.getByRole("button", { name: "أعد أسئلة البداية" }));
    expect(screen.getByRole("dialog", { name: "إعادة أسئلة البداية؟" })).toHaveTextContent("تحل إجاباتك الجديدة محل أرقام «شقتك الأولى»");
    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(router.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "أعد أسئلة البداية" }));
    fireEvent.click(screen.getByRole("button", { name: "ابدأ الأسئلة" }));
    expect(router.push).toHaveBeenCalledWith("/demo/start");
  });

  it("offers the language switch", () => {
    renderWithIntl(<MoreScreen />);
    expect(screen.getByTestId("more-language")).toHaveTextContent("اللغة");
  });
});
