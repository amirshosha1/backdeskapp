import Decimal from "decimal.js";
import { act, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { HomeScreen } from "@/components/home/home-screen";
import { apartmentNet } from "@/components/units/my-apartments";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { resetAccountForTests, type AccountState } from "@/lib/account/store";
import type { AccountUnit } from "@/lib/account/units";
import type { CalculatorForm } from "@/lib/calculator/form";
import { formatMoneyParts } from "@/lib/format/money";
import { saveOwnUnit } from "@/lib/guest/store";

/**
 * Home after the 2026-10-09 hotfix: only the person's own apartments (the
 * browser's for a visitor, the account's when signed in), the total in
 * whole pounds, each apartment's net and status; no sample data, no month,
 * no owner/co-host switch, no add-expense, add-income or month-report
 * entry; with none, one call to action into the first-run flow.
 */

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));
vi.mock("@/lib/account/actions", () => ({}));

const presetForm = (model: CalculatorForm["operatingModel"]) =>
  CALCULATOR_PRESETS.find((p) => p.form.operatingModel === model)!.form;

const plain = (el: Element) => (el.textContent ?? "").replace(/[⁦-⁩‎‏]/g, "");
const whole = (amount: { toString(): string }) => {
  const p = formatMoneyParts(amount.toString(), { locale: "ar", decimals: 0 });
  return `${p.sign}${p.integer}`;
};

const unit = (id: string, name: string, form: CalculatorForm): AccountUnit => ({
  id,
  name,
  operatingModel: form.operatingModel,
  inputs: { form, assumed: [] },
  engineVersion: "1.0.0",
  updatedAt: "2026-10-08T10:00:00Z",
});
const signedIn = (units: AccountUnit[]): AccountState => ({
  status: "signed_in",
  userId: "test-user",
  email: "host@example.com",
  units,
  maxUnits: 5,
  apartmentCount: null,
  loadError: null,
});

afterEach(() => {
  act(() => resetAccountForTests());
  vi.unstubAllEnvs();
});

function expectNoSample() {
  expect(screen.queryByText(/سبتمبر 2026/)).toBeNull();
  expect(screen.queryByRole("radiogroup")).toBeNull();
  expect(screen.queryByText("أنا المالك")).toBeNull();
  expect(screen.queryByText("شقة مدينتي")).toBeNull();
  expect(screen.queryByText(/إضافة مصروف/)).toBeNull();
  expect(screen.queryByText(/إضافة دخل/)).toBeNull();
  expect(screen.queryByText(/تقرير الشهر/)).toBeNull();
  expect(screen.queryByText("بيانات تجريبية")).toBeNull();
  for (const link of screen.queryAllByRole("link")) expect(link.getAttribute("href")).not.toBe("/demo/expenses/new");
}

describe("<HomeScreen />: a visitor", () => {
  it("with no apartment: one call to action into the first-run flow, nothing else", () => {
    renderWithIntl(<HomeScreen />);
    expect(screen.getByTestId("home-start")).toHaveAttribute("href", "/demo/start");
    expect(screen.queryByTestId("hero-figure")).toBeNull();
    expect(screen.queryByTestId("home-apartments")).toBeNull();
    expectNoSample();
  });

  it("with the browser apartment: its net in whole pounds as the total, and one row with its status", () => {
    const form = presetForm("rental_arbitrage");
    saveOwnUnit(form, []);
    renderWithIntl(<HomeScreen />);
    const net = apartmentNet(form)!;
    expect(plain(screen.getByTestId("hero-figure"))).toContain(whole(net));
    expect(plain(screen.getByTestId("hero-figure"))).not.toMatch(/\.\d\d/);
    const rows = screen.getAllByTestId("home-apartment");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("شقتك الأولى");
    expect(rows[0]).toHaveAttribute("href", "/demo/calculator");
    expect(within(rows[0]!).getByTestId("home-apartment-status")).toHaveTextContent(net.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).lessThan(0) ? "خسارة" : "مكسب");
    expectNoSample();
  });
});

describe("<HomeScreen />: signed in", () => {
  it("lists the account's apartments with their nets; the total is their sum (managed: the manager's profit)", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const a = presetForm("rental_arbitrage");
    const b = presetForm("managed_for_owner");
    resetAccountForTests(signedIn([unit("u1", "شقة التجمع", a), unit("u2", "شاليه الساحل", b)]));
    renderWithIntl(<HomeScreen />);

    const rows = screen.getAllByTestId("home-apartment");
    expect(rows.map((r) => r.getAttribute("href"))).toEqual(["/demo/calculator?unit=u1", "/demo/calculator?unit=u2"]);
    expect(rows[0]).toHaveTextContent("شقة التجمع");
    expect(rows[1]).toHaveTextContent("شاليه الساحل");
    expect(plain(rows[0]!)).toContain(whole(apartmentNet(a)!));
    expect(plain(rows[1]!)).toContain(whole(apartmentNet(b)!));
    expect(plain(screen.getByTestId("hero-figure"))).toContain(whole(apartmentNet(a)!.plus(apartmentNet(b)!)));
    expect(screen.getByRole("link", { name: "عرض الكل" })).toHaveAttribute("href", "/demo/units");
    expectNoSample();
  });

  it("a loss shows the خسارة status", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const base = presetForm("rental_arbitrage");
    const losing: CalculatorForm = { ...base, values: { ...base.values, bookedNights: "1" } };
    expect(apartmentNet(losing)!.lessThan(0)).toBe(true);
    resetAccountForTests(signedIn([unit("u1", "شقة خاسرة", losing)]));
    renderWithIntl(<HomeScreen />);
    expect(screen.getByTestId("home-apartment-status")).toHaveTextContent("خسارة");
  });

  it("with no apartments: the first-run call to action", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    resetAccountForTests(signedIn([]));
    renderWithIntl(<HomeScreen />);
    expect(screen.getByTestId("home-start")).toHaveAttribute("href", "/demo/start");
  });

  it("while the session is being read: neither the list nor the call to action", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    resetAccountForTests({ status: "loading" });
    renderWithIntl(<HomeScreen />);
    expect(screen.queryByTestId("home-start")).toBeNull();
    expect(screen.queryByTestId("home-apartment")).toBeNull();
  });
});
