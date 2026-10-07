import { act, fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { CalculatorScreen } from "@/components/calculator/calculator-screen";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import type { CalculatorForm } from "@/lib/calculator/form";
import { GUEST_KEY, parseGuest, saveOwnUnit, type AssumedField } from "@/lib/guest/store";
import { setQueryParam } from "@/lib/url-state";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

const EXAMPLE = CALCULATOR_PRESETS[0]!.form;
const renderCalculator = (locale: "ar" | "en" = "ar") => renderWithIntl(<CalculatorScreen presets={CALCULATOR_PRESETS} />, { locale });
/** Text without the LRI/PDI isolates that wrap numbers inside sentences (src/lib/format/). */
const plain = (el: Element) => (el.textContent ?? "").replace(/[⁦-⁩‎]/g, "");
const byTestId = (id: string) => plain(screen.getByTestId(id));
const sentence = () => byTestId("hero-sentence");
const field = (label: RegExp) => screen.getByRole("textbox", { name: label });
const type = (label: RegExp, value: string) => fireEvent.change(field(label), { target: { value } });
const openTab = (name: string) => fireEvent.click(screen.getByRole("tab", { name }));
const openSection = (title: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${title}`) }));
const stored = () => parseGuest(window.localStorage.getItem(GUEST_KEY));

function withOwnUnit(form: CalculatorForm = EXAMPLE, assumed: AssumedField[] = []) {
  saveOwnUnit(form, assumed);
}

describe("<CalculatorScreen /> — Summary (rental-arbitrage example)", () => {
  it("leads with the net after depreciation, -7,013.67, and the same-basis break-even, 21.41 nights", () => {
    renderCalculator();
    expect(byTestId("hero-figure")).toContain("-7,013.67");
    expect(screen.getByText("صافي الربح الشهري بعد الإهلاك")).toBeInTheDocument();
    expect(byTestId("break-even-pill")).toBe("التعادل عند 21.41 ليلة");
    expect(sentence()).toBe("ينقصك 4 ليالٍ في الشهر لتغطي التكاليف.");
    expect(byTestId("nights-header")).toBe("18 ليلة محجوزة من 30الإشغال 60%");
  });

  it("the three rows add up as displayed: revenue − all costs with depreciation = net", () => {
    renderCalculator();
    expect(byTestId("summary-revenue")).toContain("47,400.00");
    expect(byTestId("summary-costs")).toContain("-54,413.67");
    expect(byTestId("summary-net")).toContain("الصافي بعد الإهلاك");
    expect(byTestId("summary-net")).toContain("-7,013.67");
  });

  it("the slider moves booked nights: whole nights short, the first profitable night, then nights above", () => {
    renderCalculator();
    const slider = screen.getByRole("slider", { name: "الليالي المحجوزة في الشهر" });
    expect(slider).toHaveAttribute("max", "30");
    fireEvent.change(slider, { target: { value: "21" } });
    expect(sentence()).toBe("ينقصك ليلة واحدة في الشهر لتغطي التكاليف.");
    fireEvent.change(slider, { target: { value: "22" } });
    expect(byTestId("hero-figure")).toContain("1,220.33");
    expect(sentence()).toBe("أنت عند أول ليلة تحقق مكسبًا؛ بليلة أقل تصبح النتيجة خسارة.");
    fireEvent.change(slider, { target: { value: "24" } });
    expect(sentence()).toBe("تجاوزت التعادل بليلتين.");
    fireEvent.change(slider, { target: { value: "25" } });
    expect(sentence()).toBe("تجاوزت التعادل بـ 3 ليالٍ.");
  });

  it("steppers: nightly rate by 100, rent by 1,000; a tap at a limit explains itself instead of doing nothing", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("button", { name: "ارفع سعر الليلة 100" }));
    expect(within(screen.getByTestId("stepper-adr")).getByText("2,600")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "اخفض الإيجار الشهري 1,000" }));
    expect(within(screen.getByTestId("stepper-rent")).getByText("34,000")).toBeInTheDocument();

    for (let i = 0; i < 26; i++) fireEvent.click(screen.getByRole("button", { name: "اخفض سعر الليلة 100" }));
    expect(within(screen.getByTestId("stepper-adr")).getByText("0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "اخفض سعر الليلة 100" }));
    expect(screen.getByTestId("toast")).toHaveTextContent("سعر الليلة لا يقل عن 0");
  });

  it("the second stepper follows the model: commission (1 point) when managed, platform fee (0.5 point) when owner-run", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("radio", { name: "إدارة لمالك" }));
    expect(screen.getByText("صافي ربح المالك بعد الإهلاك")).toBeInTheDocument();
    expect(byTestId("hero-figure")).toContain("19,975.73");
    expect(byTestId("summary-net")).toContain("صافي المالك بعد الإهلاك");
    fireEvent.click(screen.getByRole("button", { name: "ارفع عمولة الإدارة 1%" }));
    expect(within(screen.getByTestId("stepper-commissionPercent")).getByText("21%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "يديرها المالك" }));
    fireEvent.click(screen.getByRole("button", { name: "ارفع عمولة المنصة 0.5%" }));
    expect(within(screen.getByTestId("stepper-platformFeePercent")).getByText("16%")).toBeInTheDocument();
  });

  it("break-even beyond the month, or none at all, shows a text pill instead of a marker", () => {
    renderCalculator();
    act(() => setQueryParam("tab", "all"));
    openSection("الإيجار");
    type(/الإيجار الشهري/, "60000");
    act(() => setQueryParam("tab", null));
    expect(byTestId("break-even-pill")).toBe("التعادل عند 33.55 ليلة، خارج الشهر");
    expect(sentence()).toBe("التعادل عند 33.55 ليلة، أكثر من 30 ليلة متاحة في الشهر.");

    act(() => setQueryParam("tab", "all"));
    openSection("الإيراد");
    type(/^متوسط سعر الليلة/, "0");
    type(/رسوم التنظيف على الضيف/, "0");
    act(() => setQueryParam("tab", null));
    expect(byTestId("break-even-pill")).toBe("لا تعادل بهذه الأرقام");
    expect(sentence()).toBe("كل ليلة محجوزة تزيد الخسارة، فلا تعادل بهذه الأرقام.");
  });

  it("booked above the available nights: a data warning, the thumb pinned at the end, the number kept", () => {
    renderCalculator();
    act(() => setQueryParam("tab", "all"));
    type(/الليالي المغلقة/, "10");
    type(/الليالي المحجوزة في الشهر/, "25");
    act(() => setQueryParam("tab", null));
    expect(screen.getByRole("alert")).toHaveTextContent("الليالي المحجوزة أكثر من الليالي المتاحة");
    expect(screen.getByRole("slider")).toHaveAttribute("max", "20");
    expect(byTestId("nights-header")).toContain("25 ليلة محجوزة من 20");
  });

  it("with every night blocked there is no slider, only the sentence", () => {
    renderCalculator();
    act(() => setQueryParam("tab", "all"));
    type(/الليالي المغلقة/, "30");
    act(() => setQueryParam("tab", null));
    expect(screen.queryByRole("slider")).toBeNull();
    expect(sentence()).toBe("لا توجد ليالٍ متاحة هذا الشهر.");
  });

  it("an invalid entry in كل الأرقام dims the summary and a tap takes the visitor to the field", () => {
    renderCalculator();
    act(() => setQueryParam("tab", "all"));
    openSection("مصاريف التشغيل");
    type(/الإنترنت/, "abc");
    act(() => setQueryParam("tab", null));
    expect(byTestId("hero-figure")).toContain("-7,013.67");
    fireEvent.click(screen.getByTestId("stale-summary"));
    expect(screen.getByRole("tab", { name: "كل الأرقام" })).toHaveAttribute("aria-selected", "true");
    expect(field(/الإنترنت/)).toHaveAttribute("aria-invalid", "true");
  });

  it("works in English", () => {
    renderCalculator("en");
    expect(screen.getByText("Monthly net profit after depreciation")).toBeInTheDocument();
    expect(sentence()).toBe("You need 4 more nights to cover the costs.");
    expect(byTestId("break-even-pill")).toBe("Break-even at 21.41 nights");
  });
});

describe("<CalculatorScreen /> — كل الأرقام", () => {
  it("shares one state with the summary", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("button", { name: "ارفع سعر الليلة 100" }));
    openTab("كل الأرقام");
    expect(field(/^متوسط سعر الليلة/)).toHaveValue("2,600");
    expect(screen.getByRole("tab", { name: "كل الأرقام" })).toHaveAttribute("aria-selected", "true");
    expect(window.location.search).toBe("?tab=all");
  });

  it("section totals reconcile to the subtotal before depreciation and to the net", () => {
    renderCalculator();
    openTab("كل الأرقام");
    const total = (id: string) => plain(screen.getByTestId(id).querySelector("button") ?? screen.getByTestId(id));
    expect(total("section-revenue")).toContain("47,400.00");
    expect(total("section-platformFee")).toContain("-7,347.00");
    expect(total("section-opex")).toContain("-7,900.00");
    expect(total("section-rent")).toContain("-35,000.00");
    expect(byTestId("subtotal-before-depreciation")).toContain("الربح قبل الإهلاك");
    expect(byTestId("subtotal-before-depreciation")).toContain("-2,847.00");
    expect(total("section-depreciation")).toContain("-4,166.67");
    expect(byTestId("total-net")).toContain("-7,013.67");
  });

  it("one section is open at a time", () => {
    renderCalculator();
    openTab("كل الأرقام");
    expect(screen.getByRole("button", { name: /^الإيراد/ })).toHaveAttribute("aria-expanded", "true");
    openSection("عمولة المنصة");
    expect(screen.getByRole("button", { name: /^الإيراد/ })).toHaveAttribute("aria-expanded", "false");
    expect(field(/عمولة المنصة/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /^متوسط سعر الليلة/ })).toBeNull();
  });

  it("every input of the old calculator is still editable", () => {
    renderCalculator();
    openTab("كل الأرقام");
    for (const label of [/^متوسط سعر الليلة/, /الليالي المحجوزة/, /الليالي المغلقة/, /متوسط مدة الإقامة/, /رسوم التنظيف على الضيف/]) {
      expect(field(label)).toBeInTheDocument();
    }
    openSection("مصاريف التشغيل");
    for (const label of [/الكهرباء والمياه/, /الإنترنت/, /مصاريف الكمبوند/, /^التنظيف/, /مستلزمات الضيوف/, /الصيانة/]) expect(field(label)).toBeInTheDocument();
    openSection("الإيجار");
    expect(field(/الإيجار الشهري/)).toBeInTheDocument();
    expect(field(/مبلغ التأمين/)).toBeInTheDocument();
    openSection("إهلاك التجهيز");
    expect(field(/تكلفة التجهيز/)).toBeInTheDocument();
    expect(field(/العمر الافتراضي/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "إدارة لمالك" }));
    openSection("عمولة الإدارة");
    fireEvent.change(screen.getByRole("combobox", { name: "أساس العمولة" }), { target: { value: "hybrid" } });
    expect(screen.getByRole("combobox", { name: "طريقة الحساب" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "النسبة محسوبة من" })).toBeInTheDocument();
    expect(field(/نسبة العمولة/)).toBeInTheDocument();
    expect(field(/الحد الأدنى الشهري للعمولة/)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "رسوم التنظيف ضمن أساس العمولة" })).toBeInTheDocument();
  });

  it("every figure of the old results is still shown, under مؤشرات أخرى; break-even terms explain 21.41", () => {
    renderCalculator();
    openTab("كل الأرقام");
    openSection("مؤشرات أخرى");
    const other = screen.getByTestId("section-other");
    expect(plain(other)).toContain("المحوَّل من المنصة40,053.00");
    expect(plain(other)).toContain("صافي الدخل التشغيلي-2,847.00");
    expect(byTestId("result-break-even-after")).toContain("21.41 ليلة (71.4%)");
    expect(byTestId("result-first-profitable-night")).toContain("الليلة 22");
    expect(byTestId("result-contribution")).toContain("2,058.50");
    expect(byTestId("result-break-even-fixed-costs")).toContain("44,066.67");
    expect(byTestId("result-break-even-before")).toContain("19.38 ليلة (64.6%)");
    expect(byTestId("result-break-even-before-no-maintenance")).toContain("18.99 ليلة (63.3%)");
    expect(byTestId("result-payback")).toContain("لا يُسترد بهذه الأرقام");
    expect(byTestId("result-cash-on-cash")).toContain("-10.7%");
    expect(byTestId("return-note")).toContain("قبل الإهلاك");
  });

  it.each([
    ["Example B", {}],
    ["higher rent", { rent: "40000" }],
    ["managed", { model: "managed_for_owner" }],
    ["owner-run", { model: "owner_operated" }],
  ] as const)("break-even terms divide to the break-even nights (%s)", (_, change) => {
    const values = { ...EXAMPLE.values, ...("rent" in change ? { rent: change.rent } : {}) };
    withOwnUnit({ ...EXAMPLE, operatingModel: "model" in change ? change.model : EXAMPLE.operatingModel, values });
    renderCalculator();
    openTab("كل الأرقام");
    openSection("مؤشرات أخرى");
    const num = (id: string) => Number(byTestId(id).match(/[\d,]+\.\d{2}/)![0].replace(/,/g, ""));
    const nights = Number(byTestId("result-break-even-after").match(/([\d.]+) ليلة/)![1]);
    expect(num("result-break-even-fixed-costs") / num("result-contribution")).toBeCloseTo(nights, 1);
  });

  it("managed: the manager-profit row equals the commission section", () => {
    withOwnUnit({ ...EXAMPLE, operatingModel: "managed_for_owner" });
    renderCalculator();
    openTab("كل الأرقام");
    expect(plain(screen.getByTestId("section-commission"))).toContain("-8,010.60");
    openSection("مؤشرات أخرى");
    expect(byTestId("result-manager-profit")).toContain("8,010.60");
    expect(byTestId("result-contribution-before-commission")).toContain("2,058.50");
  });

  it("unit details appear only for the example, read-only with a تجريبي tag", () => {
    renderCalculator();
    openTab("كل الأرقام");
    openSection("بيانات الوحدة");
    fireEvent.click(screen.getByRole("button", { name: /المنطقة/ }));
    expect(screen.getByTestId("toast")).toHaveTextContent("بيانات الوحدة تُستخدم لمقارنة المنطقة");
  });

  it("the example loaders load an example straight away when nothing is saved", () => {
    renderCalculator();
    openTab("كل الأرقام");
    expect(screen.getByTestId("storage-note")).toHaveTextContent("هذا مثال ولا يُحفظ.");
    fireEvent.click(screen.getByRole("radio", { name: "إدارة لمالك — وسط البلد" }));
    expect(byTestId("hero-figure")).toContain("19,975.73");
    expect(window.localStorage.getItem(GUEST_KEY)).toBeNull();
  });
});

describe("<CalculatorScreen /> — the visitor's own unit", () => {
  it("opens on the saved unit, hides unit details and saves every valid change", () => {
    withOwnUnit({ ...EXAMPLE, values: { ...EXAMPLE.values, adr: "3000" } });
    renderCalculator();
    fireEvent.click(screen.getByRole("button", { name: "ارفع سعر الليلة 100" }));
    expect(stored().units[0]!.form.values.adr).toBe("3100");
    openTab("كل الأرقام");
    expect(screen.getByTestId("storage-note")).toHaveTextContent("تعديلاتك تُحفظ على هذا الجهاز فقط");
    expect(screen.queryByTestId("section-unitDetails")).toBeNull();
    // An invalid entry is never saved; the last valid one stays.
    type(/^متوسط سعر الليلة/, "abc");
    expect(stored().units[0]!.form.values.adr).toBe("3100");
  });

  it("committing a field clears its تجريبي tag even when the value did not change (blur or Enter)", () => {
    withOwnUnit(EXAMPLE, ["platformFeePercent", "cleaningFeePerStay"]);
    renderCalculator();
    openTab("كل الأرقام");
    openSection("عمولة المنصة");
    const fee = field(/عمولة المنصة/);
    expect(within(fee.closest("div.py-3") as HTMLElement).getByText("تجريبي")).toBeInTheDocument();
    fireEvent.focus(fee);
    fireEvent.blur(fee);
    expect(within(fee.closest("div.py-3") as HTMLElement).queryByText("تجريبي")).toBeNull();
    expect(stored().units[0]!.assumed).toEqual(["cleaningFeePerStay"]);

    openSection("الإيراد");
    const cleaningFee = field(/رسوم التنظيف على الضيف/);
    act(() => cleaningFee.focus());
    fireEvent.keyDown(cleaningFee, { key: "Enter" });
    expect(cleaningFee).not.toHaveFocus();
    expect(stored().units[0]!.assumed).toEqual([]);
  });

  it("loading an example asks first, then replaces the unit's numbers", () => {
    withOwnUnit({ ...EXAMPLE, values: { ...EXAMPLE.values, adr: "4000" } });
    renderCalculator();
    openTab("كل الأرقام");
    fireEvent.click(screen.getByRole("radio", { name: "مثال: إعادة تأجير" }));
    expect(screen.getByRole("dialog", { name: "استبدال أرقام شقتك؟" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(stored().units[0]!.form.values.adr).toBe("4000");

    fireEvent.click(screen.getByRole("radio", { name: "مثال: إعادة تأجير" }));
    fireEvent.click(screen.getByRole("button", { name: "استبدل الأرقام" }));
    expect(stored().units[0]!.form.values.adr).toBe("2500");
    expect(screen.getByRole("radio", { name: "مثال: إعادة تأجير" })).toHaveAttribute("aria-checked", "true");
  });
});
