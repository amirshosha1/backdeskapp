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
      { ar: "دفتر يومية كامل لوحدة واحدة", en: "Full manual ledger for one unit" },
      { ar: "حاسبة الجدوى بلا حدود", en: "Unlimited feasibility calculator runs" },
      { ar: "دليل الإعداد (نظرة عامة)", en: "Setup guide (overview)" },
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
      { ar: "استيراد كشوف المنصات", en: "Payout import" },
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
      { ar: "الإدخال الذكي بالذكاء الاصطناعي", en: "AI smart entry" },
      { ar: "تنبيهات ذكية", en: "Alerts" },
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
      { ar: "تصدير كامل (CSV, XLSX, PDF)", en: "Full exports (CSV, XLSX, PDF)" },
      { ar: "دعوات الفريق", en: "Team invitations" },
    ],
  },
];

export const SETUP_KIT = {
  name: { ar: "حقيبة التأسيس", en: "Setup Kit" } as Localized,
  price: "1500.00",
  description: {
    ar: "قوائم مفصّلة لكل بند، بميزانية تقديرية جاهزة.",
    en: "Detailed lists for every item, with a ready cost estimate.",
  } as Localized,
};

export const FOUNDING_OFFER = {
  title: { ar: "عرض الأعضاء المؤسسين", en: "Founding-member offer" } as Localized,
  description: {
    ar: "احجز مكانك الآن بسعر تأسيسي ثابت مدى الاشتراك، قبل إطلاق التطبيق.",
    en: "Lock in a fixed founding price for as long as you stay subscribed, before launch.",
  } as Localized,
};
