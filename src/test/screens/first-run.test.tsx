import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { router } from "@/test/mocks/navigation";
import { FirstRunScreen } from "@/components/first-run/first-run-screen";
import { FirstRunGate } from "@/components/first-run/first-run-gate";
import { LEGACY_EXAMPLE_FORM } from "@/test/legacy-calculator-example";
import { readFirstRunAnswers } from "@/lib/guest/first-run-answers";
import { resetFlowEventsForTests } from "@/lib/analytics/flow-events";
import { resetCampaignTagsForTests } from "@/lib/analytics/campaign-tags";
import { GUEST_KEY, parseGuest, readGuest, saveOwnUnit, setFirstRunSeen } from "@/lib/guest/store";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));
afterEach(() => vi.clearAllMocks());

const EXAMPLE = LEGACY_EXAMPLE_FORM;
const plain = (el: Element) => (el.textContent ?? "").replace(/[⁦-⁩‎]/g, "");
const renderFlow = (locale: "ar" | "en" = "ar") => renderWithIntl(<FirstRunScreen example={EXAMPLE} />, { locale });
const heading = () => screen.getByRole("heading", { level: 1 }).textContent;
const segments = () => within(screen.getByTestId("first-run-progress")).getAllByText("", { selector: "span" });
const pick = (name: string) => fireEvent.click(screen.getByRole("radio", { name: new RegExp(name) }));
const tap = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const stored = () => parseGuest(window.localStorage.getItem(GUEST_KEY));

describe("first-run flow: order per model", () => {
  it("owner-operated: model → price → nights → verdict (no cost question, 3 segments)", () => {
    renderFlow();
    expect(heading()).toBe("ابدأ بشقة واحدة. كيف تشغّلها؟");
    pick("أملكها وأديرها");
    expect(heading()).toBe("كم تتوقع سعر الليلة؟");
    expect(segments()).toHaveLength(3);
    tap("التالي");
    expect(heading()).toBe("كم ليلة تُحجز في الشهر؟");
    tap("اعرض النتيجة");
    expect(screen.getByTestId("verdict-word")).toHaveTextContent("مكسب");
    expect(window.location.search).toBe("?step=verdict");
  });

  it("rental arbitrage: the cost question asks the monthly rent (4 segments)", () => {
    renderFlow();
    pick("أستأجرها وأعيد تأجيرها");
    expect(segments()).toHaveLength(4);
    tap("التالي");
    tap("التالي");
    expect(heading()).toBe("كم تدفع إيجارًا في الشهر؟");
    expect(plain(screen.getByTestId("dial-value"))).toBe("35,000");
    tap("اعرض النتيجة");
    expect(screen.getByTestId("verdict-word")).toHaveTextContent("خسارة");
    expect(plain(screen.getByTestId("hero-figure"))).toContain("-7,013.67");
    expect(plain(screen.getByTestId("verdict-sentence"))).toBe("تتعادل عند 21.41 ليلة وأنت عند 18. ينقصك 4 ليالٍ.");
    expect(screen.getByTestId("estimate-note")).toHaveTextContent("تقدير من الأرقام التي أدخلتها، وليس نتيجة فعلية.");
  });

  it("managed: the cost question asks the commission, and the verdict is the owner's", () => {
    renderFlow();
    pick("أديرها لحساب مالك");
    tap("التالي");
    tap("التالي");
    expect(heading()).toBe("كم نسبة عمولة الإدارة؟");
    expect(plain(screen.getByTestId("dial-value"))).toBe("20%");
    tap("اعرض النتيجة");
    expect(screen.getByTestId("verdict-word")).toHaveTextContent("مكسب المالك");
    expect(screen.getByText("صافي ربح المالك بعد الإهلاك")).toBeInTheDocument();
  });

  it("back walks one step at a time, and the first step has no back button", () => {
    renderFlow();
    expect(screen.queryByRole("button", { name: "رجوع" })).toBeNull();
    pick("أستأجرها وأعيد تأجيرها");
    tap("التالي");
    tap("التالي");
    tap("رجوع");
    expect(heading()).toBe("كم ليلة تُحجز في الشهر؟");
    tap("رجوع");
    tap("رجوع");
    expect(heading()).toBe("ابدأ بشقة واحدة. كيف تشغّلها؟");
  });
});

describe("first-run flow: answers, verdict and saving", () => {
  it("dials move by their button step and explain their limits", () => {
    renderFlow();
    pick("أملكها وأديرها");
    tap("ارفع السعر 100");
    expect(plain(screen.getByTestId("dial-value"))).toBe("2,600");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "10000" } });
    tap("ارفع السعر 100");
    expect(screen.getByTestId("toast")).toHaveTextContent("سعر الليلة لا يزيد على 10,000");
  });

  it("accepts a typed rent and blocks an invalid value before the verdict", () => {
    renderFlow();
    pick("أستأجرها وأعيد تأجيرها");
    tap("التالي");
    tap("التالي");
    const input = screen.getByRole("textbox", { name: "اكتب الإيجار الشهري مباشرة" });
    fireEvent.change(input, { target: { value: "35,000" } });
    // A valid typed value moves the dial at once: no repeated taps to reach a real rent.
    expect(plain(screen.getByTestId("dial-value"))).toBe("35,000");
    tap("اعرض النتيجة");
    expect(stored().units[0]!.form.values.rent).toBe("35000");

    tap("رجوع");
    const rent = screen.getByRole("textbox", { name: "اكتب الإيجار الشهري مباشرة" });
    fireEvent.change(rent, { target: { value: "abc" } });
    // Typing alone does not shout; the error appears when the person tries to move on.
    expect(rent).not.toHaveAttribute("aria-invalid");
    tap("اعرض النتيجة");
    expect(heading()).toBe("كم تدفع إيجارًا في الشهر؟");
    expect(rent).toHaveAttribute("aria-invalid", "true");
    expect(rent).toHaveFocus();
    const error = screen.getByTestId("dial-direct-error");
    expect(error).toHaveTextContent("اكتب عددًا صحيحًا بين 5,000 و150,000.");
    expect(rent).toHaveAttribute("aria-describedby", error.id);
    expect(stored().units[0]!.form.values.rent).toBe("35000");
  });

  it("rejects typed values outside the dial's range, decimals included, and accepts Arabic digits", () => {
    renderFlow();
    pick("أستأجرها وأعيد تأجيرها");
    const price = screen.getByRole("textbox", { name: "اكتب سعر الليلة مباشرة" });
    for (const bad of ["400", "10001", "2450.5", ""]) {
      fireEvent.change(price, { target: { value: bad } });
      fireEvent.blur(price);
      expect(price, bad).toHaveAttribute("aria-invalid", "true");
    }
    fireEvent.change(price, { target: { value: "٢٤٥٠" } });
    expect(price).not.toHaveAttribute("aria-invalid");
    expect(plain(screen.getByTestId("dial-value"))).toBe("2,450");
    fireEvent.blur(price);
    expect(screen.getByTestId("dial-direct-error")).toBeEmptyDOMElement();
  });

  it("keeps the answers out of the URL: only the step is in the query string", () => {
    renderFlow();
    pick("أستأجرها وأعيد تأجيرها");
    tap("ارفع السعر 100");
    tap("التالي");
    expect(window.location.search).toBe("?step=nights");
    expect(readFirstRunAnswers()).toMatchObject({ model: "rental_arbitrage", adr: 2600 });
  });

  it("reaching the verdict saves the unit with the unasked inputs still assumed", () => {
    renderFlow();
    pick("أستأجرها وأعيد تأجيرها");
    tap("التالي");
    tap("التالي");
    tap("اعرض النتيجة");
    const unit = stored().units[0]!;
    expect(unit.form.operatingModel).toBe("rental_arbitrage");
    expect(unit.assumed).toContain("platformFeePercent");
    expect(unit.assumed).not.toContain("rent");
    expect(screen.getByText("تُحفظ هذه الشقة كأول وحدة لك على هذا الجهاز.")).toBeInTheDocument();
    const assumedCard = screen.getByTestId("assumed-values");
    expect(within(assumedCard).getAllByText("تجريبي").length).toBeGreaterThanOrEqual(6);
    expect(plain(assumedCard)).toContain("مبلغ التأمين");
  });

  it("start over goes back to the first question with the example's answers", () => {
    renderFlow();
    pick("أملكها وأديرها");
    tap("ارفع السعر 100");
    tap("التالي");
    tap("اعرض النتيجة");
    tap("ابدأ من جديد");
    expect(heading()).toBe("ابدأ بشقة واحدة. كيف تشغّلها؟");
    expect(readFirstRunAnswers()).toMatchObject({ model: null, adr: 2500 });
  });

  it("count: the plan line depends on the answer; entering the app ends the flow", () => {
    renderFlow();
    pick("أملكها وأديرها");
    tap("التالي");
    tap("اعرض النتيجة");
    tap("كمّل");
    expect(heading()).toBe("كم شقة تملك أو تدير؟");
    expect(screen.queryByTestId("plan-line")).toBeNull();
    pick("شقة واحدة");
    expect(screen.getByTestId("plan-line")).toHaveTextContent("تعرف مكسبها أو خسارتها كل شهر بلا اشتراك.");
    pick("شقتان أو ثلاث");
    expect(screen.getByTestId("plan-line")).toHaveTextContent("باقي شققك تضيفها ضمن الاشتراك");
    expect(stored().firstRun.count).toBe("2-3");
    tap("ادخل التطبيق");
    expect(stored().firstRun.seen).toBe(true);
    expect(readFirstRunAnswers()).toBeNull();
    expect(router.replace).toHaveBeenCalledWith("/demo/units");
  });

  it("skip ends the flow without saving a unit", () => {
    renderFlow();
    pick("أستأجرها وأعيد تأجيرها");
    const skip = screen.getByRole("link", { name: "تخطَّ" });
    expect(skip).toHaveAttribute("href", "/demo/units");
    fireEvent.click(skip);
    expect(stored().firstRun.seen).toBe(true);
    expect(stored().units).toEqual([]);
    expect(readFirstRunAnswers()).toBeNull();
  });

  it("works in English", () => {
    renderFlow("en");
    expect(heading()).toBe("Start with one apartment. How do you run it?");
    pick("I rent it and re-let it");
    tap("Next");
    tap("Next");
    tap("Show the result");
    expect(screen.getByTestId("verdict-word")).toHaveTextContent("Loss");
    expect(plain(screen.getByTestId("verdict-sentence"))).toBe("You break even at 21.41 nights and you're at 18. You need 4 more nights.");
    expect(screen.getByTestId("estimate-note")).toHaveTextContent("An estimate from the numbers you entered, not an actual result.");
  });
});

describe("<FirstRunGate /> on the app entry", () => {
  it("sends a first visit to the flow", () => {
    renderWithIntl(<FirstRunGate />);
    expect(router.replace).toHaveBeenCalledWith("/demo/start");
  });

  it("never again once the flow was seen, or a unit exists", () => {
    setFirstRunSeen();
    renderWithIntl(<FirstRunGate />);
    expect(router.replace).not.toHaveBeenCalled();
    window.localStorage.clear();
    act(() => saveOwnUnit(EXAMPLE, []));
    expect(readGuest().firstRun.seen).toBe(false);
    renderWithIntl(<FirstRunGate />);
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("first-run flow: anonymous counting (docs/ANALYTICS.md)", () => {
  const beacon = vi.fn((_url: string, _data?: BodyInit | null) => true);
  const events = () =>
    Promise.all(
      beacon.mock.calls.map(
        ([, data]) =>
          new Promise<{ event: string; properties: Record<string, unknown> }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(JSON.parse(String(reader.result)));
            reader.readAsText(data as Blob);
          }),
      ),
    );

  // One page view per test: earlier tests already "used" this module's once-per-page state.
  beforeEach(() => {
    resetFlowEventsForTests();
    resetCampaignTagsForTests();
    beacon.mockClear();
  });
  const tags = { utm_source: "facebook", utm_campaign: "oct-1", utm_content: "hook-a" };
  afterEach(() => vi.unstubAllEnvs());

  it("from the landing button: first_run_started, calc_start then verdict_shown (outcome and model only), each once", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true, writable: true });
    window.history.replaceState(null, "", "/demo/start?from=landing&utm_source=facebook&utm_campaign=oct-1&utm_content=hook-a");
    const { rerender } = renderFlow();
    expect(window.location.search).toBe("");
    pick("أستأجرها وأعيد تأجيرها");
    tap("التالي");
    tap("التالي");
    tap("اعرض النتيجة");
    rerender(<FirstRunScreen example={EXAMPLE} />);
    expect(await events()).toEqual([
      { event: "first_run_started", properties: { entry: "landing", locale: "ar", display_mode: "browser" } },
      { event: "calc_start", properties: { ...tags, model: "rental_arbitrage", locale: "ar", display_mode: "browser" } },
      { event: "verdict_shown", properties: { ...tags, entry: "landing", outcome: "loss", model: "rental_arbitrage", locale: "ar", display_mode: "browser" } },
    ]);
    // The marker and the labels left the address bar at the first read; only the flow's own step remains.
    expect(window.location.search).toBe("?step=verdict");
  });

  it("calc_start is absent until a model is picked: no event while the first question is only on screen", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true, writable: true });
    window.history.replaceState(null, "", "/demo/start?utm_source=facebook");
    renderFlow();
    expect((await events()).map((e) => e.event)).toEqual(["first_run_started"]);
    expect(JSON.stringify(await events())).not.toMatch(/model|facebook/);
    pick("أملكها وأديرها");
    expect((await events()).map((e) => e.event)).toEqual(["first_run_started", "calc_start"]);
  });

  it("no payload holds a URL, path, referrer or any key outside the allowlist", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true, writable: true });
    window.history.replaceState(null, "", "/demo/start?from=landing&utm_source=Facebook&utm_medium=social&utm_campaign=oct-1&utm_content=hook-a");
    Object.defineProperty(document, "referrer", { value: "https://l.facebook.com/", configurable: true });
    const { rerender } = renderFlow();
    pick("أستأجرها وأعيد تأجيرها");
    tap("التالي");
    tap("التالي");
    tap("اعرض النتيجة");
    rerender(<FirstRunScreen example={EXAMPLE} />);
    const allowed = new Set(["locale", "display_mode", "entry", "outcome", "model", "utm_source", "utm_medium", "utm_campaign", "utm_content"]);
    const sent = await events();
    expect(sent.length).toBe(3);
    for (const e of sent) {
      expect(Object.keys(e).sort()).toEqual(["event", "properties"]);
      for (const key of Object.keys(e.properties)) expect(allowed.has(key), key).toBe(true);
    }
    expect(JSON.stringify(sent)).not.toMatch(/https?:|\/demo|referrer|facebook\.com|\d{3}/i);
  });

  it("nothing is sent without the key", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true, writable: true });
    renderFlow();
    pick("أملكها وأديرها");
    tap("التالي");
    tap("اعرض النتيجة");
    expect(beacon).not.toHaveBeenCalled();
  });
});
