import { listedTotals, type ApartmentTotal } from "@/lib/pricing/apartment-price";
import type { Localized } from "./types";

/**
 * Pricing fixtures. Every price is SAMPLE (BUILD_PLAN.md §6, question 3 —
 * no real prices exist yet) and lives in this one file so they are easy to
 * replace once Amir sets real figures. From Phase 4 onward these come from
 * the `plans` and `plan_prices` tables instead.
 */

/**
 * The Pro plan's monthly price for one apartment, in EGP (SAMPLE). It is the
 * only plan price: each extra apartment costs half of it, rounded up to a
 * whole pound, and every total on the page is computed from it
 * (`src/lib/pricing/apartment-price.ts`).
 */
export const PRO_PLAN_PRICE = "249.00";

/** Totals are listed up to this many apartments; above it, a private plan. */
export const MAX_LISTED_APARTMENTS = 5;

/** Monthly totals for 2 to `MAX_LISTED_APARTMENTS` apartments, computed from `PRO_PLAN_PRICE`. */
export const PRO_APARTMENT_TOTALS: ApartmentTotal[] = listedTotals(PRO_PLAN_PRICE, MAX_LISTED_APARTMENTS);

export interface PlanFixture {
  code: "free" | "pro";
  name: Localized;
  priceMonthly: string | null;
  features: { label: Localized; availability: "available" | "planned" }[];
  highlighted?: boolean;
}

export const PLANS: PlanFixture[] = [
  {
    code: "free",
    name: { ar: "مجاني", en: "Free" },
    priceMonthly: null,
    features: [
      // Hotfix 2026-10-09: "unlimited booking and expense entries" is listed again once that entry exists.
      { label: { ar: "حاسبة الجدوى كاملة", en: "The full feasibility calculator" }, availability: "available" },
      { label: { ar: "نتيجة تقديرية للشهر: مكسب أو خسارة", en: "Estimated monthly result: profit or loss" }, availability: "available" },
      // Decided 2026-10-08: occupancy and the average nightly rate (from actual figures) are free.
      { label: { ar: "نسبة الإشغال ومتوسط سعر الليلة من مدخلاتك", en: "Occupancy and average nightly rate from your inputs" }, availability: "available" },
    ],
  },
  {
    code: "pro",
    name: { ar: "برو", en: "Pro" },
    priceMonthly: PRO_PLAN_PRICE,
    features: [
      { label: { ar: "كل ما في المجاني", en: "Everything in Free" }, availability: "available" },
      { label: { ar: "تفصيل الشهر كاملًا وكل الشهور السابقة", en: "The full monthly breakdown and every past month" }, availability: "planned" },
      { label: { ar: "تقرير الشهر PDF وكشف حساب المالك", en: "The monthly PDF report and the owner statement" }, availability: "planned" },
      { label: { ar: "استيراد تقارير Airbnb", en: "Airbnb report import" }, availability: "planned" },
      { label: { ar: "كل شقة إضافية بنصف سعر الباقة", en: "Each extra apartment at half the plan price" }, availability: "planned" },
    ],
    highlighted: true,
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
