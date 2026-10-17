import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { AccountSync } from "@/components/account/account-sync";
import { CalculatorScreen } from "@/components/calculator/calculator-screen";
import { MoreScreen } from "@/components/more/more-screen";
import { PricingScreen } from "@/components/pricing/pricing-screen";
import { PrivacyScreen } from "@/components/privacy/privacy-screen";
import { UnitsScreen } from "@/components/units/units-screen";
import { FOUNDING_OFFER, MAX_LISTED_APARTMENTS, PLANS, PRO_APARTMENT_TOTALS, SETUP_KIT } from "@/demo/fixtures/pricing";
import { UNITS } from "@/demo/fixtures/units";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { resetAccountForTests, type AccountState } from "@/lib/account/store";
import type { AccountUnit } from "@/lib/account/units";
import { readGuest, saveOwnUnit, setApartmentCount } from "@/lib/guest/store";

/**
 * Batch 3 PR B screens for a signed-in person (and a visitor with accounts
 * on): the banner never calls the account's own apartments sample data;
 * Units, the calculator and More act on the account; the in-app browser
 * sheet replaces a sign-in Google would refuse; the browser apartment
 * moves in; the privacy page names the contact.
 */

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

const actions = vi.hoisted(() => ({
  createUnit: vi.fn(),
  updateUnit: vi.fn(),
  deleteUnit: vi.fn(),
  adoptGuestUnit: vi.fn(),
  saveApartmentCount: vi.fn(async () => ({ ok: true, data: { saved: true } })),
  deleteMyAccount: vi.fn(),
}));
vi.mock("@/lib/account/actions", () => actions);

const oauth = vi.hoisted(() => vi.fn(async () => ({ data: {}, error: null })));
const auth = vi.hoisted(() => ({ userId: "test-user" as string | null, signOutError: false }));
vi.mock("@/lib/supabase/browser", () => ({
  loadBrowserSupabase: () =>
    Promise.resolve({
      auth: {
        signInWithOAuth: oauth,
        signOut: vi.fn(async () => {
          if (auth.signOutError) return { error: new Error("network") };
          auth.userId = null;
          return { error: null };
        }),
        getSession: vi.fn(async () => ({ data: { session: auth.userId ? { user: { id: auth.userId, email: "host@example.com" } } : null }, error: null })),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
    }),
}));

const form = CALCULATOR_PRESETS[0]!.form;
const unit = (id: string, name: string, f = form): AccountUnit => ({
  id,
  name,
  operatingModel: f.operatingModel,
  inputs: { form: f, assumed: [] },
  engineVersion: "1.0.0",
  updatedAt: "2026-10-08T10:00:00Z",
});
const row = (u: AccountUnit) => ({ id: u.id, name: u.name, operating_model: u.operatingModel, calculator_inputs: u.inputs, engine_version: "1.0.0", created_at: "t", updated_at: "t" });
const signedIn = (units: AccountUnit[] = [], extra: Partial<Extract<AccountState, { status: "signed_in" }>> = {}): AccountState => ({
  status: "signed_in",
  userId: "test-user",
  email: "host@example.com",
  units,
  maxUnits: 5,
  apartmentCount: "2-3",
  loadError: null,
  ...extra,
});

const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.122 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/473.0.0.39.109;IABMV/1;]";
const realUserAgent = navigator.userAgent;
function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true });
}

beforeEach(() => {
  auth.userId = "test-user";
  auth.signOutError = false;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
});

afterEach(() => {
  act(() => resetAccountForTests());
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  setUserAgent(realUserAgent);
});

describe("the top line: one rule on every screen", () => {
  const GUEST_LINE = "محفوظ على هذا الجهاز · سجّل الدخول لتحفظه في حسابك";

  it("a visitor: «محفوظ على هذا الجهاز · سجّل الدخول…», and tapping it starts Google sign-in", async () => {
    resetAccountForTests({ status: "guest" });
    renderWithIntl(<UnitsScreen units={UNITS} />);
    const line = screen.getByTestId("guest-banner");
    expect(line).toHaveTextContent(GUEST_LINE);
    expect(screen.queryByText("بيانات تجريبية")).toBeNull();
    fireEvent.click(line);
    await waitFor(() => expect(oauth).toHaveBeenCalledTimes(1));
  });

  it("a visitor in Facebook's browser: the line opens the «open in your browser» sheet instead", () => {
    setUserAgent(FACEBOOK_ANDROID);
    resetAccountForTests({ status: "guest" });
    renderWithIntl(<UnitsScreen units={UNITS} />);
    fireEvent.click(screen.getByTestId("guest-banner"));
    expect(screen.getByTestId("in-app-sheet")).toBeInTheDocument();
    expect(oauth).not.toHaveBeenCalled();
  });

  it("signed in: no line on Units, the calculator, More or a sample-only screen (Pricing)", () => {
    resetAccountForTests(signedIn([unit("u1", "شقة التجمع"), unit("u2", "شاليه الساحل")]));
    const screens = [
      <UnitsScreen key="u" units={UNITS} />,
      <CalculatorScreen key="c" presets={CALCULATOR_PRESETS} />,
      <MoreScreen key="m" />,
      <PricingScreen key="p" plans={PLANS} apartmentTotals={PRO_APARTMENT_TOTALS} maxListedApartments={MAX_LISTED_APARTMENTS} setupKit={SETUP_KIT} foundingOffer={FOUNDING_OFFER} />,
    ];
    for (const el of screens) {
      const { unmount } = renderWithIntl(el);
      expect(screen.queryByTestId("guest-banner")).toBeNull();
      expect(screen.queryByTestId("device-banner")).toBeNull();
      expect(screen.queryByText("بيانات تجريبية")).toBeNull();
      expect(screen.queryByText("شققك محفوظة في حسابك")).toBeNull();
      // The account's own apartments are never labelled an example.
      expect(screen.queryByTestId("example-chip")).toBeNull();
      unmount();
    }
  });

  it("signed in, the calculator on an own apartment shows its name", () => {
    resetAccountForTests(signedIn([unit("u1", "شقة التجمع"), unit("u2", "شاليه الساحل")]));
    window.history.replaceState(null, "", "/?unit=u2");
    renderWithIntl(<CalculatorScreen presets={CALCULATOR_PRESETS} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("شاليه الساحل");
  });

  it("before it is known whether someone is signed in, no line shows", () => {
    resetAccountForTests({ status: "loading" });
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.queryByTestId("guest-banner")).toBeNull();
    expect(screen.queryByTestId("device-banner")).toBeNull();
  });
});

describe("Units, signed in", () => {
  it("lists the account's apartments under «شققك» and the count, without the samples or a limit", () => {
    resetAccountForTests(signedIn([unit("u1", "شقة التجمع"), unit("u2", "شاليه الساحل")]));
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.getByTestId("units-hero-count")).toHaveTextContent(/^شققكشقتان$/);
    expect(screen.queryByText(/من 5/)).toBeNull();
    expect(screen.queryByTestId("examples-heading")).toBeNull();
    expect(screen.queryAllByTestId("unit-card")).toHaveLength(0);
    const cards = screen.getAllByTestId("account-unit-card");
    expect(cards.map((c) => c.textContent)).toEqual([expect.stringContaining("شقة التجمع"), expect.stringContaining("شاليه الساحل")]);
    expect(cards[1]).toHaveAttribute("href", "/demo/calculator?unit=u2");
  });

  it("adds an apartment; the 6th shows the limit and the contact (never a dead end)", async () => {
    resetAccountForTests(signedIn([1, 2, 3, 4, 5].map((n) => unit(`u${n}`, `شقة ${n}`))));
    actions.createUnit.mockResolvedValueOnce({ ok: false, error: "unit_limit_reached" });
    renderWithIntl(<UnitsScreen units={UNITS} />);
    fireEvent.click(screen.getByTestId("account-add-unit"));
    const sheet = screen.getByTestId("add-unit-sheet");
    expect(within(sheet).getByTestId("unit-name-input")).toHaveValue("شقة 6");
    fireEvent.click(within(sheet).getByRole("radio", { name: "يديرها المالك" }));
    fireEvent.click(within(sheet).getByTestId("add-unit-submit"));
    const notice = await screen.findByTestId("limit-notice");
    expect(notice).toHaveTextContent("لأكثر من 5 شقق نتفق معك على باقة خاصة");
    expect(within(notice).getByTestId("limit-contact").getAttribute("href")).toMatch(/^mailto:support@backdeskapp\.com\?subject=/);
    const sent = actions.createUnit.mock.calls[0]![0] as { name: string; inputs: { form: { operatingModel: string }; assumed: string[] } };
    expect(sent.name).toBe("شقة 6");
    expect(sent.inputs.form.operatingModel).toBe("owner_operated");
    expect(sent.inputs.assumed).toContain("adr");
  });

  it("the add button says what is missing instead of doing nothing", () => {
    resetAccountForTests(signedIn([]));
    renderWithIntl(<UnitsScreen units={UNITS} />);
    fireEvent.click(screen.getByTestId("account-add-unit"));
    fireEvent.change(screen.getByTestId("unit-name-input"), { target: { value: "   " } });
    expect(screen.getByTestId("add-unit-submit")).toHaveTextContent("اكتب اسمًا للشقة");
    fireEvent.click(screen.getByTestId("add-unit-submit"));
    expect(actions.createUnit).not.toHaveBeenCalled();
  });

  it("renames and deletes from the edit sheet, deletion after a confirmation", async () => {
    const u = unit("u1", "شقة التجمع");
    resetAccountForTests(signedIn([u]));
    actions.updateUnit.mockResolvedValueOnce({ ok: true, data: row({ ...u, name: "شقة التجمع الخامس" }) });
    actions.deleteUnit.mockResolvedValueOnce({ ok: true, data: { id: "u1" } });
    renderWithIntl(<UnitsScreen units={UNITS} />);
    fireEvent.click(screen.getByRole("button", { name: "تعديل «شقة التجمع»" }));
    fireEvent.change(screen.getByTestId("unit-name-input"), { target: { value: "شقة التجمع الخامس" } });
    fireEvent.click(screen.getByTestId("unit-rename"));
    await waitFor(() => expect(actions.updateUnit).toHaveBeenCalledWith({ id: "u1", name: "شقة التجمع الخامس" }, "test-user"));
    await waitFor(() => expect(screen.getAllByTestId("account-unit-card")[0]).toHaveTextContent("شقة التجمع الخامس"));

    fireEvent.click(screen.getByRole("button", { name: "تعديل «شقة التجمع الخامس»" }));
    fireEvent.click(screen.getByTestId("unit-delete"));
    expect(actions.deleteUnit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("unit-delete-confirm"));
    await waitFor(() => expect(screen.queryAllByTestId("account-unit-card")).toHaveLength(0));
    expect(actions.deleteUnit).toHaveBeenCalledWith("u1", "test-user");
  });
});

describe("the calculator saves an account apartment about a second after the last change", () => {
  it("shows saving, then saved", async () => {
    vi.useFakeTimers();
    try {
      const u = unit("u1", "شقة التجمع");
      resetAccountForTests(signedIn([u]));
      actions.updateUnit.mockResolvedValue({ ok: true, data: row(u) });
      renderWithIntl(<CalculatorScreen presets={CALCULATOR_PRESETS} />);
      fireEvent.click(screen.getByTestId("stepper-adr").querySelectorAll("button")[1]!);
      expect(screen.getByTestId("save-status")).toHaveAttribute("data-status", "pending");
      expect(actions.updateUnit).not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });
      expect(actions.updateUnit).toHaveBeenCalledTimes(1);
      const sent = actions.updateUnit.mock.calls[0]![0] as { id: string; inputs: { form: { values: { adr: string } } } };
      expect(sent.id).toBe("u1");
      expect(sent.inputs.form.values.adr).toBe("2600");
      expect(screen.getByTestId("save-status")).toHaveAttribute("data-status", "saved");
    } finally {
      vi.useRealTimers();
    }
  });

  it("a failed save is a retry button, not silence", async () => {
    vi.useFakeTimers();
    try {
      const u = unit("u1", "شقة التجمع");
      resetAccountForTests(signedIn([u]));
      actions.updateUnit.mockResolvedValueOnce({ ok: false, error: "network" }).mockResolvedValueOnce({ ok: true, data: row(u) });
      renderWithIntl(<CalculatorScreen presets={CALCULATOR_PRESETS} />);
      fireEvent.click(screen.getByTestId("stepper-adr").querySelectorAll("button")[1]!);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });
      const retry = screen.getByRole("button", { name: "لم يُحفظ — أعد المحاولة" });
      await act(async () => {
        fireEvent.click(retry);
        await vi.advanceTimersByTimeAsync(10);
      });
      expect(actions.updateUnit).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("save-status")).toHaveAttribute("data-status", "saved");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("More", () => {
  it("a visitor (accounts on) gets Google sign-in and the privacy page", () => {
    resetAccountForTests({ status: "guest" });
    renderWithIntl(<MoreScreen />);
    expect(screen.getByTestId("sign-in")).toHaveTextContent("سجّل الدخول بحساب Google");
    expect(screen.getByRole("link", { name: /سياسة الخصوصية/ })).toHaveAttribute("href", "/privacy");
    expect(screen.queryByTestId("delete-account")).toBeNull();
  });

  it("with accounts off there is no sign-in at all", () => {
    resetAccountForTests({ status: "off" });
    renderWithIntl(<MoreScreen />);
    expect(screen.queryByTestId("sign-in")).toBeNull();
    expect(screen.getByRole("link", { name: /سياسة الخصوصية/ })).toBeInTheDocument();
  });

  it("signed in: who, sign out, and «احذف حسابي وبياناتي» behind a confirmation", async () => {
    resetAccountForTests(signedIn([unit("u1", "شقة التجمع")]));
    actions.deleteMyAccount.mockResolvedValueOnce({ ok: true, data: undefined });
    renderWithIntl(<MoreScreen />);
    expect(screen.getByText("host@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("sign-out")).toHaveTextContent("تسجيل الخروج");
    fireEvent.click(screen.getByTestId("delete-account"));
    const dialog = screen.getByRole("dialog", { name: "حذف حسابك نهائيًا؟" });
    expect(dialog).toHaveTextContent("لا يمكن استرجاعها");
    expect(actions.deleteMyAccount).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByTestId("delete-account-confirm"));
    await waitFor(() => expect(actions.deleteMyAccount).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("sign-in")).toBeInTheDocument());
  });

  it("shows sign-out failure and a retry without claiming success", async () => {
    auth.signOutError = true;
    resetAccountForTests(signedIn([unit("u1", "شقة التجمع")]));
    renderWithIntl(<MoreScreen />);
    fireEvent.click(screen.getByTestId("sign-out"));
    expect(await screen.findByTestId("toast")).toHaveTextContent("لم نتأكد من تسجيل الخروج");
    expect(screen.getByTestId("sign-out")).toHaveTextContent("أعد محاولة تسجيل الخروج");
    expect(screen.queryByText("شقة التجمع")).toBeNull();
    auth.signOutError = false;
    fireEvent.click(screen.getByTestId("sign-out"));
    await waitFor(() => expect(screen.getByTestId("toast")).toHaveTextContent("سجّلت الخروج"));
  });
});

describe("in-app browsers (Facebook, Messenger, Instagram…)", () => {
  it("sign-in opens the «open in your browser» sheet instead of a sign-in Google would refuse", async () => {
    resetAccountForTests({ status: "guest" });
    setUserAgent(FACEBOOK_ANDROID);
    renderWithIntl(<MoreScreen />);
    fireEvent.click(screen.getByTestId("sign-in"));
    const sheet = await screen.findByTestId("in-app-sheet");
    expect(screen.getByRole("dialog", { name: "افتح الصفحة في المتصفح لتسجيل الدخول" })).toBeInTheDocument();
    expect(within(sheet).getByTestId("in-app-open-chrome").getAttribute("href")).toMatch(/^intent:\/\/.*package=com\.android\.chrome;S\.browser_fallback_url=/);
    expect(within(sheet).getByTestId("in-app-copy")).toHaveTextContent("انسخ الرابط");
    expect(oauth).not.toHaveBeenCalled();
  });

  it("in a real browser, sign-in goes to Google", async () => {
    resetAccountForTests({ status: "guest" });
    setUserAgent("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36");
    renderWithIntl(<MoreScreen />);
    fireEvent.click(screen.getByTestId("sign-in"));
    await waitFor(() => expect(oauth).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("in-app-sheet")).toBeNull();
  });
});

describe("moving the browser apartment into the account", () => {
  it("an empty account takes it automatically and the browser copy is cleared", async () => {
    saveOwnUnit(form, ["deposit"]);
    resetAccountForTests(signedIn([]));
    actions.adoptGuestUnit.mockResolvedValueOnce({ ok: true, data: { outcome: "added", unit: row(unit("u9", "شقتي الأولى")) } });
    renderWithIntl(<AccountSync />);
    await waitFor(() => expect(readGuest().units).toEqual([]));
    expect(actions.adoptGuestUnit).toHaveBeenCalledWith({ name: "شقتي الأولى", inputs: { form, assumed: ["deposit"] }, apartmentCount: null }, "test-user");
    expect(await screen.findByTestId("toast")).toHaveTextContent("أضفنا شقتك إلى حسابك.");
  });

  it("asks B before adopting a guest unit whose automatic transfer began under A", async () => {
    saveOwnUnit(form, []);
    resetAccountForTests(signedIn([]));
    let finishAdoption!: (value: { ok: true; data: { outcome: "added"; unit: ReturnType<typeof row> } }) => void;
    actions.adoptGuestUnit.mockImplementationOnce(() => new Promise((resolve) => { finishAdoption = resolve; }));
    renderWithIntl(<AccountSync />);
    await waitFor(() => expect(actions.adoptGuestUnit).toHaveBeenCalledTimes(1));
    auth.userId = "user-b";
    act(() => resetAccountForTests(signedIn([], { userId: "user-b", email: "b@example.com" })));
    expect(await screen.findByTestId("adopt-sheet")).toBeInTheDocument();
    expect(actions.adoptGuestUnit).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishAdoption({ ok: true, data: { outcome: "added", unit: row(unit("a1", "A guest")) } });
    });
    expect(readGuest().units).toHaveLength(1);
    expect(screen.getByTestId("adopt-sheet")).toBeInTheDocument();
  });

  it("otherwise one sheet asks; at the limit, the contact replaces the add button", async () => {
    saveOwnUnit(form, []);
    resetAccountForTests(signedIn([1, 2, 3, 4, 5].map((n) => unit(`u${n}`, `شقة ${n}`))));
    actions.adoptGuestUnit.mockResolvedValueOnce({ ok: true, data: { outcome: "ask" } });
    actions.createUnit.mockResolvedValueOnce({ ok: false, error: "unit_limit_reached" });
    renderWithIntl(<AccountSync />);
    const sheet = await screen.findByTestId("adopt-sheet");
    expect(readGuest().units).toHaveLength(1); // untouched until the person taps
    fireEvent.click(within(sheet).getByTestId("adopt-add"));
    expect(await screen.findByTestId("limit-notice")).toBeInTheDocument();
    expect(screen.queryByTestId("adopt-add")).toBeNull();
    fireEvent.click(screen.getByTestId("adopt-remove"));
    expect(readGuest().units).toEqual([]);
  });

  it("copies the browser's apartment-count answer only when the profile has none", async () => {
    setApartmentCount("4-10");
    resetAccountForTests(signedIn([], { apartmentCount: null }));
    renderWithIntl(<AccountSync />);
    await waitFor(() => expect(actions.saveApartmentCount).toHaveBeenCalledWith("4-10", true, "test-user"));
  });
});

describe("the privacy page", () => {
  it.each(["ar", "en"] as const)("names support@backdeskapp.com and the processors (%s)", (locale) => {
    renderWithIntl(<PrivacyScreen />, { locale });
    const contact = screen.getByTestId("privacy-contact");
    expect(within(contact).getByRole("link", { name: "support@backdeskapp.com" })).toHaveAttribute("href", "mailto:support@backdeskapp.com");
    const text = screen.getByTestId("privacy").textContent ?? "";
    for (const name of ["Supabase", "Vercel", "Google"]) expect(text).toContain(name);
    expect(text).toMatch(locale === "ar" ? /عنوان IP/ : /IP address/);
    expect(text).toMatch(locale === "ar" ? /رابط صورة ملفك الشخصي/ : /profile picture/);
    expect(screen.queryByTestId("demo-banner")).toBeNull();
  });

  it.each(["ar", "en"] as const)("describes the anonymous counting before it ships: what, where, what never (%s)", (locale) => {
    renderWithIntl(<PrivacyScreen />, { locale });
    const text = screen.getByTestId("privacy").textContent ?? "";
    expect(text).toContain("PostHog");
    expect(text).toMatch(locale === "ar" ? /فرانكفورت/ : /Frankfurt/);
    expect(text).toMatch(locale === "ar" ? /لا كوكيز، ولا تخزين في متصفحك، ولا معرّف/ : /no cookies, no browser storage, and no identifier/);
    expect(text).toMatch(locale === "ar" ? /مكسب أو خسارة فقط، بدون أي رقم/ : /profit or loss only, never a number/);
    expect(text).toMatch(locale === "ar" ? /لا نرسل عنوان IP نفسه/ : /never send the IP address itself/);
    expect(text).not.toMatch(locale === "ar" ? /لا نستخدم أي أداة تحليلات/ : /use no analytics/);
  });
});
