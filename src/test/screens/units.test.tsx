import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { UnitsScreen } from "@/components/units/units-screen";
import { OwnerStatement } from "@/components/statement/owner-statement";
import { UNITS } from "@/demo/fixtures/units";
import { STATEMENT } from "@/demo/fixtures/statement";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { LEGACY_EXAMPLE_FORM } from "@/test/legacy-calculator-example";
import { saveOwnUnit } from "@/lib/guest/store";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<UnitsScreen />", () => {
  it("renders all 4 sample units with corrected names", () => {
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.getAllByTestId("unit-card")).toHaveLength(4);
    expect(screen.getByText("شقة مدينتي")).toBeInTheDocument();
    expect(screen.queryByText("شقة المدينتي")).toBeNull();
    expect(screen.getAllByText(/إعادة تأجير/).length).toBeGreaterThan(0);
  });

  it("opens Downtown's statement; Rehab's statement explains it comes later", () => {
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.getByRole("link", { name: "عرض كشف الحساب" })).toHaveAttribute(
      "href",
      "/demo/units/downtown-cairo/statement",
    );
    fireEvent.click(screen.getByRole("button", { name: "عرض كشف الحساب" }));
    expect(screen.getByTestId("toast")).toHaveTextContent("كشف حساب هذه الوحدة متاح في النسخة الكاملة");
  });

  it("tapping a unit explains that the unit page comes in the full version", () => {
    renderWithIntl(<UnitsScreen units={UNITS} />);
    fireEvent.click(screen.getByRole("button", { name: /شقة الشيخ زايد/ }));
    expect(screen.getByTestId("toast")).toHaveTextContent("صفحة الوحدة متاحة في النسخة الكاملة");
  });

  it("shows an empty state when there are no sample units", () => {
    renderWithIntl(<UnitsScreen units={[]} />);
    expect(screen.getByText("لا توجد وحدات بعد")).toBeInTheDocument();
  });

  it("with no apartment: the samples under «أمثلة توضيحية (ليست بياناتك)», and the screen's example chip", () => {
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.getByTestId("examples-heading")).toHaveTextContent("أمثلة توضيحية (ليست بياناتك)");
    expect(screen.getByTestId("example-chip")).toHaveTextContent("مثال · أرقام توضيحية");
  });

  it("with the person's apartment: no example chip", () => {
    saveOwnUnit(CALCULATOR_PRESETS[0]!.form, []);
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.queryByTestId("example-chip")).toBeNull();
  });
});

const EXAMPLE = LEGACY_EXAMPLE_FORM;
const plain = (el: Element) => (el.textContent ?? "").replace(/[\u2066-\u2069\u200e]/g, "");

describe("<UnitsScreen /> — the visitor's own unit", () => {
  it("no own unit yet: the hero says so and أضف شقتك الأولى starts the flow", () => {
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.getByTestId("units-hero-count")).toHaveTextContent("لم تضف شقتك بعد");
    expect(screen.getByRole("link", { name: /أضف شقتك الأولى/ })).toHaveAttribute("href", "/demo/start");
    expect(screen.queryByTestId("own-unit-card")).toBeNull();
    expect(screen.queryByRole("button", { name: /أضف شقة/ })).toBeNull();
  });

  it("own unit: occupancy, nightly rate, net after depreciation and the break-even bar; opens the calculator; no samples", () => {
    saveOwnUnit(EXAMPLE, ["platformFeePercent"]);
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.getByTestId("units-hero-count")).toHaveTextContent(/^شققكشقة واحدة$/);
    const card = screen.getByTestId("own-unit-card");
    expect(card).toHaveAttribute("href", "/demo/calculator");
    expect(plain(card)).toContain("شقتك الأولى");
    // The person's own apartment never carries the تجريبي / SAMPLE badge.
    expect(plain(card)).not.toContain("تجريبي");
    expect(plain(card)).toContain("60%");
    expect(plain(card)).toContain("2,500");
    expect(plain(card)).toContain("الصافي بعد الإهلاك");
    expect(plain(screen.getByTestId("own-unit-profit"))).toBe("-7,014");
    expect(screen.getByRole("meter", { name: "الليالي المحجوزة مقارنةً بليالي التعادل" })).toBeInTheDocument();
    expect(plain(card)).toContain("18 ليلة محجوزة");
    expect(plain(card)).toContain("التعادل عند 21.41 ليلة");
    // With an apartment of their own, the samples are gone.
    expect(screen.queryByTestId("examples-heading")).toBeNull();
    expect(screen.queryAllByTestId("unit-card")).toHaveLength(0);
  });

  it("no تجريبي / SAMPLE badge on the own card, even while inputs still hold the example's values (AR and EN)", () => {
    saveOwnUnit(EXAMPLE, ["adr", "bookedNights", "rent"]);
    const { unmount } = renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(within(screen.getByTestId("own-unit-card")).queryByText("تجريبي")).toBeNull();
    unmount();
    renderWithIntl(<UnitsScreen units={UNITS} />, { locale: "en" });
    expect(within(screen.getByTestId("own-unit-card")).queryByText("SAMPLE")).toBeNull();
  });

  it("a managed own unit follows the managed card: management profit and the commission, no break-even bar", () => {
    saveOwnUnit({ ...EXAMPLE, operatingModel: "managed_for_owner" }, []);
    renderWithIntl(<UnitsScreen units={UNITS} />);
    const card = screen.getByTestId("own-unit-card");
    expect(plain(card)).toContain("ربح الإدارة");
    expect(plain(screen.getByTestId("own-unit-profit"))).toBe("+8,011");
    expect(screen.getByTestId("own-unit-commission")).toHaveTextContent("العمولة: 20% من صافي المحوّل");
    expect(within(card).queryByRole("meter")).toBeNull();
  });

  it("own unit exists: أضف شقة opens the subscription card; ليس الآن closes it", () => {
    saveOwnUnit(EXAMPLE, []);
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.queryByRole("link", { name: /أضف شقتك الأولى/ })).toBeNull();
    const add = screen.getByRole("button", { name: /أضف شقة/ });
    expect(add).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(add);
    const gate = screen.getByTestId("add-unit-gate");
    expect(gate).toHaveTextContent("الشقة الثانية ضمن الاشتراك");
    expect(gate).toHaveTextContent("شقتك الأولى تبقى مجانية.");
    expect(within(gate).getByRole("link", { name: "شاهد الباقات" })).toHaveAttribute("href", "/demo/pricing");
    fireEvent.click(within(gate).getByRole("button", { name: "ليس الآن" }));
    expect(screen.queryByTestId("add-unit-gate")).toBeNull();
    expect(add).toHaveAttribute("aria-expanded", "false");
  });

  it("break-even beyond the month shows text instead of the bar", () => {
    saveOwnUnit({ ...EXAMPLE, values: { ...EXAMPLE.values, rent: "60000" } }, []);
    renderWithIntl(<UnitsScreen units={UNITS} />);
    expect(screen.queryByRole("meter")).toBeNull();
    expect(plain(screen.getByTestId("own-unit-bar-text"))).toBe("التعادل عند 33.55 ليلة، أكثر من الليالي المتاحة");
  });
});

describe("<OwnerStatement />", () => {
  it("renders every line, with the balance due on its own line", () => {
    renderWithIntl(<OwnerStatement statement={STATEMENT} />);
    expect(screen.getByText(/47,400\.00/)).toBeInTheDocument();
    const balance = screen.getByText("المتبقي للمالك").closest("div")!;
    expect(within(balance).getByText(/4,142\.40/)).toBeInTheDocument();
  });

  it("puts the minus sign of negative amounts inside an LTR isolate", () => {
    const { container } = renderWithIntl(<OwnerStatement statement={STATEMENT} />);
    const fees = [...container.querySelectorAll("bdi")].find((el) => el.textContent === "-7,347.00");
    expect(fees).toBeDefined();
    expect(fees).toHaveAttribute("dir", "ltr");
  });

  it("is labelled an example: the title, the chip, and no PDF or owner-link actions", () => {
    renderWithIntl(<OwnerStatement statement={STATEMENT} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("مثال: كشف حساب مالك");
    expect(screen.getByTestId("example-chip")).toHaveTextContent("مثال · أرقام توضيحية");
    expect(screen.queryByText(/تنزيل PDF/)).toBeNull();
    expect(screen.queryByText(/رابط للمالك/)).toBeNull();
  });

  it("in English: «Example: owner statement» and «Example · illustrative numbers»", () => {
    renderWithIntl(<OwnerStatement statement={STATEMENT} />, { locale: "en" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Example: owner statement");
    expect(screen.getByTestId("example-chip")).toHaveTextContent("Example · illustrative numbers");
  });
});
