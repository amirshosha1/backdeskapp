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
        value: { ar: "إيجار من الباطن", en: "Rental arbitrage" },
      },
      { kind: "money", label: { ar: "الإيجار الشهري", en: "Monthly rent" }, amount: "35000.00" },
      {
        kind: "money",
        label: { ar: "التأمين", en: "Deposit" },
        amount: "70000.00",
        isSample: true,
      },
    ],
  },
  {
    id: "revenue",
    title: { ar: "الإيرادات", en: "Revenue" },
    rows: [
      { kind: "money", label: { ar: "متوسط سعر الليلة (ADR)", en: "ADR" }, amount: "2500.00" },
      { kind: "percent", label: { ar: "الإشغال", en: "Occupancy" }, ratio: 0.6 },
      {
        kind: "text",
        label: { ar: "متوسط مدة الإقامة", en: "Average length of stay" },
        value: { ar: "3 ليالٍ", en: "3 nights" },
      },
      {
        kind: "money",
        label: { ar: "رسوم التنظيف للضيف", en: "Cleaning fee charged" },
        amount: "400.00",
      },
      { kind: "percent", label: { ar: "نسبة رسوم المنصة", en: "Platform fee rate" }, ratio: 0.155 },
    ],
  },
  {
    id: "costs",
    title: { ar: "التكاليف", en: "Costs" },
    rows: [
      { kind: "money", label: { ar: "المرافق (ثابت)", en: "Utilities (fixed)" }, amount: "2500.00" },
      { kind: "money", label: { ar: "الإنترنت (ثابت)", en: "Internet (fixed)" }, amount: "600.00" },
      {
        kind: "money",
        label: { ar: "رسوم الكمبوند (ثابت)", en: "Compound fees (fixed)" },
        amount: "1000.00",
      },
      {
        kind: "money",
        label: { ar: "التنظيف (لكل حجز)", en: "Cleaning (per stay)" },
        amount: "350.00",
      },
      {
        kind: "money",
        label: { ar: "المستلزمات (لكل حجز)", en: "Consumables (per stay)" },
        amount: "150.00",
      },
      {
        kind: "money",
        label: { ar: "الصيانة (غير منتظم، مستبعد من التعادل)", en: "Repairs (irregular, excluded from break-even)" },
        amount: "800.00",
      },
      {
        kind: "money",
        label: { ar: "استثمار التأسيس (تقديري)", en: "Setup CAPEX (quick total)" },
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
  grossRevenue: "47400.00",
  platformFees: "-7347.00",
  netPayout: "40053.00",
  opex: "-7900.00",
  rent: "-35000.00",
  noi: "-2847.00",
  contributionPerNight: "2058.50",
  breakEvenNights: "18.99",
  breakEvenOccupancy: 0.633,
  isProfitable: false,
};
