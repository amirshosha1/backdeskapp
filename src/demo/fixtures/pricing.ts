import type { Localized } from "./types";

/**
 * Pricing fixtures. Every price is SAMPLE (BUILD_PLAN.md §6, question 3 —
 * no real prices exist yet) and lives in this one file so they are easy to
 * replace once Amir sets real figures. From Phase 4 onward these come from
 * the `plans` and `plan_prices` tables instead.
 */

export interface PlanFixture {
  code: "free" | "solo" | "pro" | "business";
  name: Localized;
  unitLimit: number;
  priceMonthly: string | null;
  priceAnnual: string | null;
  features: Localized[];
  highlighted?: boolean;
}

export const PLANS: PlanFixture[] = [
  {
    code: "free",
    name: { ar: "مجاني", en: "Free" },
    unitLimit: 1,
    priceMonthly: null,
    priceAnnual: null,
    features: [
      { ar: "حسابات كاملة لوحدة واحدة", en: "Full books for one unit" },
      { ar: "حاسبة الجدوى بلا حدود", en: "Unlimited feasibility calculations" },
      { ar: "دليل التجهيز (نظرة عامة)", en: "Setup guide (overview)" },
    ],
  },
  {
    code: "solo",
    name: { ar: "سولو", en: "Solo" },
    unitLimit: 3,
    priceMonthly: "249.00",
    priceAnnual: "2490.00",
    features: [
      { ar: "حتى 3 وحدات", en: "Up to 3 units" },
      { ar: "استيراد تقارير Airbnb", en: "Payout import" },
      { ar: "كشوف حساب الملاك", en: "Owner statements" },
    ],
  },
  {
    code: "pro",
    name: { ar: "برو", en: "Pro" },
    unitLimit: 10,
    priceMonthly: "549.00",
    priceAnnual: "5490.00",
    features: [
      { ar: "حتى 10 وحدات", en: "Up to 10 units" },
      { ar: "تسجيل المصروفات بالذكاء الاصطناعي", en: "AI smart entry" },
      { ar: "تنبيهات تلقائية", en: "Alerts" },
    ],
    highlighted: true,
  },
  {
    code: "business",
    name: { ar: "بزنس", en: "Business" },
    unitLimit: 30,
    priceMonthly: "999.00",
    priceAnnual: "9990.00",
    features: [
      { ar: "حتى 30 وحدة", en: "Up to 30 units" },
      { ar: "تصدير Excel وPDF", en: "Excel and PDF exports" },
      { ar: "حسابات لفريق العمل", en: "Team accounts" },
    ],
  },
];

export const SETUP_KIT = {
  name: { ar: "باقة تجهيز الشقة", en: "Setup Kit" } as Localized,
  price: "1500.00",
  description: {
    ar: "قوائم مفصّلة لكل بند في الشقة، مع ميزانية تقديرية جاهزة.",
    en: "Detailed lists for every item in the apartment, with a ready cost estimate.",
  } as Localized,
};

export const FOUNDING_OFFER = {
  title: { ar: "كن من الأعضاء المؤسسين", en: "Become a founding member" } as Localized,
  description: {
    ar: "احجز مكانك قبل الإطلاق. نعلن شروط عرض المؤسسين قبل فتح الحجز.",
    en: "Reserve your place before launch. Founding terms are announced before pre-orders open.",
  } as Localized,
};
