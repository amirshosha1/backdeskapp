import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import arMessages from "../../../messages/ar.json";
import enMessages from "../../../messages/en.json";
import { renderWithIntl } from "@/test/render";
import { PricingScreen } from "@/components/pricing/pricing-screen";
import { FOUNDING_OFFER, MAX_LISTED_APARTMENTS, PLANS, PRO_APARTMENT_TOTALS, PRO_PLAN_PRICE, SETUP_KIT } from "@/demo/fixtures/pricing";
import { monthlyTotal } from "@/lib/pricing/apartment-price";
import type { AppLocale } from "@/i18n/routing";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

afterEach(() => {
  vi.unstubAllEnvs();
});

const renderPricing = (locale: AppLocale = "ar") =>
  renderWithIntl(
    <PricingScreen
      plans={PLANS}
      apartmentTotals={PRO_APARTMENT_TOTALS}
      maxListedApartments={MAX_LISTED_APARTMENTS}
      setupKit={SETUP_KIT}
      foundingOffer={FOUNDING_OFFER}
    />,
    { locale },
  );

const card = (name: string) => screen.getByRole("heading", { name, level: 2 }).closest("article") as HTMLElement;
const bullets = (article: HTMLElement) => within(article).getAllByTestId("feature-label").map((label) => label.textContent);
const availability = (article: HTMLElement) => within(article).getAllByTestId("feature-availability").map((badge) => badge.textContent);

describe("<PricingScreen />", () => {
  it("shows two plans, Free and Pro, plus the setup kit; Solo and Business are gone", () => {
    renderPricing();
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "كن من الأعضاء المؤسسين",
      "مجاني",
      "برو",
      "باقة تجهيز الشقة",
    ]);
    expect(screen.queryByText("سولو")).toBeNull();
    expect(screen.queryByText("بزنس")).toBeNull();
  });

  it("Free: one apartment and exactly its three lines (no entry line until entry exists)", () => {
    renderPricing();
    const free = card("مجاني");
    expect(within(free).getByText("شقة واحدة")).toBeInTheDocument();
    expect(within(free).getByText("مجانًا")).toBeInTheDocument();
    expect(bullets(free)).toEqual([
      "حاسبة الجدوى كاملة",
      "نتيجة تقديرية للشهر: مكسب أو خسارة",
      "نسبة الإشغال ومتوسط سعر الليلة من مدخلاتك",
    ]);
    expect(availability(free)).toEqual(["متاح الآن", "متاح الآن", "متاح الآن"]);
    // Free is the calculator that works today: a real link, never a "sign-up soon" toast.
    expect(within(free).getByRole("link", { name: "جرّب الحاسبة مجانًا" })).toHaveAttribute("href", "/demo/calculator");
    expect(screen.queryByText("حسابات كاملة لوحدة واحدة")).toBeNull();
    expect(screen.queryByText("إدخال الحجوزات والمصروفات بلا حدود")).toBeNull();
  });

  it("Pro: 249 a month, tagged تجريبي, with its five lines and no popularity claim", () => {
    renderPricing();
    const pro = card("برو");
    expect(screen.queryByText("الأكثر اختيارًا")).toBeNull();
    expect(pro).toHaveTextContent("249ج.م.شهريًاتجريبي");
    expect(bullets(pro)).toEqual([
      "كل ما في المجاني",
      "تفصيل الشهر كاملًا وكل الشهور السابقة",
      "تقرير الشهر PDF وكشف حساب المالك",
      "استيراد تقارير Airbnb",
      "كل شقة إضافية بنصف سعر الباقة",
    ]);
    expect(availability(pro)).toEqual(["متاح الآن", "قيد التطوير", "قيد التطوير", "قيد التطوير", "قيد التطوير"]);
    // Pro is not on sale: its only action is a pre-order, named as one.
    expect(within(pro).getByRole("button", { name: "احجز برو مسبقًا" })).toBeEnabled();
    expect(within(pro).queryByRole("button", { name: /^اختر/u })).toBeNull();
  });

  it("every price is labelled as a sample: Pro's price and the setup kit", () => {
    renderPricing();
    expect(screen.getAllByText("تجريبي")).toHaveLength(2);
    expect(screen.getByText("كل الأسعار تجريبية وستتحدد قبل الإطلاق.")).toBeInTheDocument();
  });

  it("lists the totals for 2 to 5 apartments: 374, 499, 624, 749", () => {
    renderPricing();
    const rows = within(screen.getByTestId("apartment-totals"))
      .getAllByRole("term")
      .map((term) => [term.textContent, term.nextElementSibling?.textContent]);
    expect(rows).toEqual([
      ["شقتان", "374ج.م."],
      ["3 شقق", "499ج.م."],
      ["4 شقق", "624ج.م."],
      ["5 شقق", "749ج.م."],
    ]);
  });

  it("the totals are computed from the one plan price, never typed into the messages", () => {
    expect(PRO_PLAN_PRICE).toBe("249.00");
    expect(PLANS.find((p) => p.code === "pro")!.priceMonthly).toBe(PRO_PLAN_PRICE);
    for (const { apartments, total } of PRO_APARTMENT_TOTALS) {
      expect(total).toBe(monthlyTotal(PRO_PLAN_PRICE, apartments).toFixed(2));
    }
    for (const messages of [arMessages, enMessages]) {
      expect(JSON.stringify(messages.pricing)).not.toMatch(/249|125|374|499|624|749/);
    }
  });

  it("more than 5 apartments: custom plans, with an email contact to support@ (subject and question prefilled)", () => {
    renderPricing();
    expect(screen.getByText("أكثر من 5 شقق: باقات خاصة")).toBeInTheDocument();
    const contact = screen.getByRole("link", { name: "تواصل معنا" });
    const href = contact.getAttribute("href")!;
    expect(href.startsWith("mailto:support@backdeskapp.com?")).toBe(true);
    const query = new URLSearchParams(href.slice(href.indexOf("?") + 1));
    expect(query.get("subject")).toBe("أكثر من 5 شقق: باقات خاصة");
    expect(query.get("body")).toBe("مرحبًا، أسأل عن باقة خاصة في باك ديسك لأكثر من 5 شقق.");
    expect(contact).not.toHaveAttribute("target");
  });

  it("two lines under the cards: the first month is open, and payment is month to month", () => {
    renderPricing();
    const terms = screen.getByTestId("plan-terms");
    expect(terms).toHaveTextContent("مخطط: أول شهر بعد إنشاء الحساب سيكون مفتوحًا بالكامل.");
    expect(terms).toHaveTextContent("مخطط: الدفع شهر بشهر، بلا تجديد تلقائي.");
    // Under the cards: after Pro, before the setup kit.
    expect(card("برو").compareDocumentPosition(terms) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(terms.compareDocumentPosition(card("باقة تجهيز الشقة")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("works in English", () => {
    renderPricing("en");
    expect(screen.getByRole("heading", { name: "Pro", level: 2 })).toBeInTheDocument();
    expect(screen.queryByText("Most popular")).toBeNull();
    expect(screen.getByText("One apartment or more")).toBeInTheDocument();
    expect(screen.getByText("Total per month")).toBeInTheDocument();
    expect(screen.getByText("2 apartments")).toBeInTheDocument();
    expect(screen.getByText("More than 5 apartments: custom plans")).toBeInTheDocument();
    const href = screen.getByRole("link", { name: "Contact us" }).getAttribute("href")!;
    expect(new URLSearchParams(href.slice(href.indexOf("?") + 1)).get("body")).toBe(
      "Hello, I'd like to ask about a custom Backdesk plan for more than 5 apartments.",
    );
    expect(screen.getByText("Planned: monthly payments without automatic renewal.")).toBeInTheDocument();
    expect(within(card("Pro")).getByText("Airbnb report import").closest("li")).toHaveTextContent("In development");
    expect(within(card("Setup Kit")).queryByRole("button", { name: "Order the kit" })).toBeNull();
    expect(within(card("Setup Kit")).queryByRole("link")).toBeNull();
    expect(within(card("Setup Kit")).getByText("In development")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try the calculator free" })).toHaveAttribute("href", "/demo/calculator");
    expect(screen.getByRole("button", { name: "Pre-order Pro" })).toBeEnabled();
  });

  it("pre-order buttons explain that pre-orders open soon until a link is set", () => {
    renderPricing();
    const reserve = screen.getByRole("button", { name: "احجز مكانك" });
    expect(reserve).toBeEnabled();
    fireEvent.click(reserve);
    expect(screen.getByTestId("toast")).toHaveTextContent("الحجز المسبق يُفتح قريبًا");
  });

  it("promises no founding terms that haven't been set", () => {
    renderPricing();
    expect(screen.queryByText(/ثابت/)).toBeNull();
  });
});
