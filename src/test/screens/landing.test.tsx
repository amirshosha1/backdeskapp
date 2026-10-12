import Decimal from "decimal.js";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render";
import { LandingScreen, landingPaths } from "@/components/landing/landing-screen";
import { landingExample } from "@/lib/landing/example";
import { SUPPORT_EMAIL } from "@/lib/contact";

/**
 * The landing page (Batch 4): the verdict's question, the engine's answer
 * for the named example under the standard example chip, one button into
 * the first-run flow, how it works, and a footer with the privacy policy
 * and the support address. No top line; plain links only; Latin and Arabic
 * names each marked with their own language; every number tabular.
 */

const example = landingExample();
const plain = (el: Element) => (el.textContent ?? "").replace(/[⁦-⁩‎‏]/g, "").replace(/\s+/g, " ");
const wholeNet = new Decimal(example.net).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

describe("<LandingScreen /> in Arabic", () => {
  it("asks the verdict's question and shows the engine's example verdict, in whole pounds, labelled as an example", () => {
    renderWithIntl(<LandingScreen example={example} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("شقتك مكسب ولا خسارة؟");
    const card = screen.getByTestId("landing-example");
    expect(within(card).getByTestId("example-chip")).toHaveTextContent("مثال · أرقام توضيحية");
    expect(card).toHaveTextContent("إعادة تأجير · مثال عام");
    expect(within(card).getByTestId("landing-verdict")).toHaveTextContent(example.outcome === "loss" ? "خسارة" : "مكسب");
    const figure = plain(within(card).getByTestId("hero-figure"));
    expect(figure).toContain(`${wholeNet.isNegative() ? "-" : ""}${wholeNet.abs().toNumber().toLocaleString("en-US")}`);
    expect(figure).not.toMatch(/\.\d/);
    expect(plain(within(card).getByTestId("landing-inputs"))).toBe("2,500 ج.م. لليلة · 18 من 30 ليلة · إيجار 35,000 ج.م.");
    expect(card).toHaveTextContent("الإيراد يشمل رسوم تنظيف مفترضة لكل حجز.");
    expect(within(card).getByTestId("landing-sentence")).toHaveTextContent(/ينقصك/);
  });

  it("has one button into the first-run flow, marked for counting; no top line, no sample-data banner", () => {
    renderWithIntl(<LandingScreen example={example} />);
    const cta = screen.getByTestId("landing-cta");
    expect(cta.tagName).toBe("A");
    expect(cta).toHaveAttribute("href", "/demo/start?from=landing");
    expect(cta).toHaveAttribute("data-cta");
    expect(cta).toHaveTextContent("احسب شقتك مجانًا");
    expect(document.querySelectorAll("[data-cta]")).toHaveLength(1);
    expect(screen.queryByText(/محفوظ على هذا الجهاز/)).toBeNull();
    expect(screen.queryByText("بيانات تجريبية")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("explains the four questions and that owner-operated skips the fourth", () => {
    renderWithIntl(<LandingScreen example={example} />);
    const how = screen.getByTestId("landing-how");
    expect(within(how).getAllByRole("listitem")).toHaveLength(4);
    expect(how).toHaveTextContent("قارن الإيجار بالعمولة");
    expect(how).toHaveTextContent("فتخطَّ المحطة الرابعة");
  });

  it("links the privacy policy and the support address; the language switch is a plain link to /en", () => {
    renderWithIntl(<LandingScreen example={example} />);
    expect(screen.getByTestId("landing-privacy")).toHaveAttribute("href", "/privacy");
    const contact = screen.getByTestId("landing-contact");
    expect(contact).toHaveAttribute("href", `mailto:${SUPPORT_EMAIL}`);
    expect(contact.querySelector('[lang="en"]')).toHaveTextContent(SUPPORT_EMAIL);
    const language = screen.getByTestId("landing-language");
    expect(language).toHaveAttribute("href", "/en");
    expect(language).toHaveAttribute("lang", "en");
  });

  it("marks the Latin name as English inside the Arabic wordmark", () => {
    renderWithIntl(<LandingScreen example={example} />);
    const latin = screen.getByTestId("landing-wordmark").querySelector('[lang="en"]');
    expect(latin).toHaveTextContent(/^Backdesk$/);
    expect(screen.getByTestId("landing-wordmark")).toHaveTextContent("Backdesk · باك ديسك");
  });

  it("sets tabular numbers on the page root, so every number inherits them", () => {
    renderWithIntl(<LandingScreen example={example} />);
    expect(screen.getByTestId("landing")).toHaveClass("tnum");
  });
});

describe("<LandingScreen /> in English", () => {
  it("asks the same question with English paths, and marks the Arabic name as Arabic", () => {
    renderWithIntl(<LandingScreen example={example} />, { locale: "en" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Is your apartment a profit or a loss?");
    expect(screen.getByTestId("landing-cta")).toHaveAttribute("href", "/en/demo/start?from=landing");
    expect(screen.getByTestId("landing-privacy")).toHaveAttribute("href", "/en/privacy");
    expect(screen.getByTestId("landing-language")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("landing-wordmark").querySelector('[lang="ar"]')).toHaveTextContent("باك ديسك");
    expect(screen.getByTestId("landing-verdict")).toHaveTextContent(example.outcome === "loss" ? "Loss" : "Profit");
    expect(plain(screen.getByTestId("landing-inputs"))).toBe("EGP 2,500 a night · 18 of 30 nights · rent EGP 35,000");
  });
});

describe("landingPaths()", () => {
  it("Arabic has no prefix; English lives under /en", () => {
    expect(landingPaths("ar")).toEqual({ start: "/demo/start?from=landing", privacy: "/privacy", otherLanguage: "/en" });
    expect(landingPaths("en")).toEqual({ start: "/en/demo/start?from=landing", privacy: "/en/privacy", otherLanguage: "/" });
  });
});
