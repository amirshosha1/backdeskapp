import type { Localized } from "./types";

/**
 * Read-only calculator walkthrough (BUILD_PLAN.md Phase P scope): one
 * sample scenario, no inputs. Figures are Example B from §4.6 — a rental
 * arbitrage unit — reproduced exactly, including values §4.6 does not
 * itself compute (CAPEX, deposit, useful life: labelled SAMPLE, never fed
 * into the NOI or break-even figures shown, exactly as Example B excludes
 * depreciation).
 *
 * Every row carries a `kind` so the component — not this fixture — decides
 * how to format it (money, percent or plain text), keeping presentation
 * logic in one place per CLAUDE.md §6.1.
 */

export type WalkthroughRow =
  | { kind: "money"; label: Localized; amount: string; isSample?: boolean }
  | { kind: "percent"; label: Localized; ratio: number; isSample?: boolean }
  | { kind: "text"; label: Localized; value: Localized; isSample?: boolean };

export interface WalkthroughStep {
  id: string;
  title: Localized;
  rows: WalkthroughRow[];
}

export const CALCULATOR_STEPS: WalkthroughStep[] = [
  {
    id: "unit",
    title: { ar: "الوحدة", en: "Unit" },
    rows: [
      {
        kind: "text",
        label: { ar: "المدينة", en: "City" },
        value: { ar: "الجيزة", en: "Giza" },
        isSample: true,
      },
      {
        kind: "text",
        label: { ar: "المنطقة", en: "Area" },
        value: { ar: "الشيخ زايد", en: "Sheikh Zayed" },
        isSample: true,
      },
      {
        kind: "text",
        label: { ar: "غرف النوم", en: "Bedrooms" },
        value: { ar: "2", en: "2" },
        isSample: true,
      },
      {
        kind: "text",
        label: { ar: "الحمامات", en: "Bathrooms" },
        value: { ar: "2", en: "2" },
        isSample: true,
      },
      {
        kind: "text",
        label: { ar: "أقصى عدد ضيوف", en: "Max guests" },
        value: { ar: "4", en: "4" },
        isSample: true,
      },
    ],
  },
  {
    id: "model",
    title: { ar: "نموذج التشغيل", en: "Operating model" },
    rows: [
      {
        kind: "text",
        label: { ar: "النموذج", en: "Model" },
        value: { ar: "إعادة تأجير", en: "Rental arbitrage" },
      },
      { kind: "money", label: { ar: "الإيجار الشهري", en: "Monthly rent" }, amount: "35000.00" },
      {
        kind: "money",
        label: { ar: "مبلغ التأمين", en: "Deposit" },
        amount: "70000.00",
        isSample: true,
      },
    ],
  },
  {
    id: "revenue",
    title: { ar: "الإيرادات", en: "Revenue" },
    rows: [
      { kind: "money", label: { ar: "متوسط سعر الليلة", en: "Average nightly rate (ADR)" }, amount: "2500.00" },
      { kind: "percent", label: { ar: "نسبة الإشغال", en: "Occupancy" }, ratio: 0.6 },
      {
        kind: "text",
        label: { ar: "متوسط مدة الإقامة", en: "Average length of stay" },
        value: { ar: "3 ليالٍ", en: "3 nights" },
      },
      {
        kind: "money",
        label: { ar: "رسوم التنظيف على الضيف", en: "Cleaning fee charged" },
        amount: "400.00",
      },
      { kind: "percent", label: { ar: "عمولة المنصة", en: "Platform fee rate" }, ratio: 0.155 },
    ],
  },
  {
    id: "costs",
    title: { ar: "التكاليف", en: "Costs" },
    rows: [
      { kind: "money", label: { ar: "الكهرباء والمياه (ثابت)", en: "Utilities (fixed)" }, amount: "2500.00" },
      { kind: "money", label: { ar: "الإنترنت (ثابت)", en: "Internet (fixed)" }, amount: "600.00" },
      {
        kind: "money",
        label: { ar: "مصاريف الكمبوند (ثابت)", en: "Compound fees (fixed)" },
        amount: "1000.00",
      },
      {
        kind: "money",
        label: { ar: "التنظيف (لكل حجز)", en: "Cleaning (per stay)" },
        amount: "350.00",
      },
      {
        kind: "money",
        label: { ar: "مستلزمات الضيوف (لكل حجز)", en: "Guest supplies (per stay)" },
        amount: "150.00",
      },
      {
        kind: "money",
        label: {
          ar: "الصيانة (غير منتظمة، ضمن حساب التعادل افتراضيًا)",
          en: "Repairs (irregular, included in break-even by default)",
        },
        amount: "800.00",
      },
      {
        kind: "money",
        label: { ar: "تكلفة التجهيز (إجمالي تقريبي)", en: "Setup cost (quick total)" },
        amount: "250000.00",
        isSample: true,
      },
      {
        kind: "text",
        label: { ar: "العمر الافتراضي", en: "Useful life" },
        value: { ar: "60 شهرًا", en: "60 months" },
        isSample: true,
      },
    ],
  },
];

export const CALCULATOR_RESULTS = {
  occupancy: 0.6,
  adr: "2500.00",
  grossRevenue: "47400.00",
  platformFees: "-7347.00",
  netPayout: "40053.00",
  opex: "-7900.00",
  rent: "-35000.00",
  noi: "-2847.00",
  contributionPerNight: "2058.50",
  // Primary: maintenance/irregular costs included by default (BUILD_PLAN.md
  // §4.3, Example B). Secondary: the per-scenario excluded toggle
  // (Example B2), shown as a smaller line under the primary figure.
  breakEvenNights: "19.38",
  breakEvenOccupancy: 0.646,
  breakEvenNightsExcludingMaintenance: "18.99",
  breakEvenOccupancyExcludingMaintenance: 0.633,
  isProfitable: false,
};
