import type { Localized } from "./types";

/**
 * Setup guide fixtures. Content is prototype copy for Amir's review — it
 * states no legal requirements as fact and carries no prices, matching
 * Phase 3's "DRAFT — Amir to review" rule (BUILD_PLAN.md §5, Phase 3) even
 * though Phase P ships no real content pipeline yet.
 */

export interface GuideStage {
  id: string;
  order: number;
  title: Localized;
  overview: Localized;
  tier: "free" | "pro";
}

export const GUIDE_STAGES: GuideStage[] = [
  {
    id: "1",
    order: 1,
    title: { ar: "الجدوى والموقع", en: "Feasibility and location" },
    overview: {
      ar: "قبل أي التزام: احسب العائد المتوقع وقارن بين مناطق مختلفة.",
      en: "Before any commitment: estimate the expected return and compare areas.",
    },
    tier: "free",
  },
  {
    id: "2",
    order: 2,
    title: { ar: "القانوني وموافقة الكمبوند", en: "Legal and compound approval" },
    overview: {
      ar: "تأكد من وجود بند صريح للإيجار قصير المدى في العقد، وراجع لوائح الكمبوند.",
      en: "Make sure the lease has an explicit short-term-rental clause, and check the compound rules.",
    },
    tier: "free",
  },
  {
    id: "3",
    order: 3,
    title: { ar: "الميزانية والفرش", en: "Budget and furnishing" },
    overview: {
      ar: "خطّط لميزانية التأسيس قبل الشراء، بندًا ببند.",
      en: "Plan the setup budget before buying anything, item by item.",
    },
    tier: "free",
  },
  {
    id: "4",
    order: 4,
    title: { ar: "التصوير والإعلان", en: "Photography and listing" },
    overview: {
      ar: "صور احترافية ووصف دقيق يرفعان معدل الحجز.",
      en: "Professional photos and an accurate description raise the booking rate.",
    },
    tier: "free",
  },
  {
    id: "5",
    order: 5,
    title: { ar: "التشغيل", en: "Operations" },
    overview: {
      ar: "التنظيف والمستلزمات والصيانة — نظام يومي يمنع المفاجآت.",
      en: "Cleaning, consumables and maintenance — a daily system that prevents surprises.",
    },
    tier: "free",
  },
  {
    id: "6",
    order: 6,
    title: { ar: "الإطلاق وأول التقييمات", en: "Launch and first reviews" },
    overview: {
      ar: "أول ضيوفك يشكّلون سمعتك — عاملهم على هذا الأساس.",
      en: "Your first guests shape your reputation — treat them that way.",
    },
    tier: "free",
  },
  {
    id: "7",
    order: 7,
    title: { ar: "التحسين المستمر", en: "Optimization" },
    overview: {
      ar: "راجع الأسعار والتكاليف كل شهر، لا كل موسم.",
      en: "Review prices and costs every month, not every season.",
    },
    tier: "free",
  },
];

export const STAGE_3_CHECKLIST: Localized[] = [
  { ar: "تحديد الميزانية الإجمالية للتأسيس", en: "Set the total setup budget" },
  { ar: "قائمة الأثاث الأساسي (غرف النوم والصالة)", en: "Core furniture list (bedrooms and living room)" },
  { ar: "الأجهزة الكهربائية (تكييف، ثلاجة، غسالة)", en: "Appliances (A/C, fridge, washer)" },
  { ar: "المطبخ والأدوات المنزلية", en: "Kitchen and household items" },
  { ar: "المفروشات (ملاءات، مناشف، ستائر)", en: "Linens (sheets, towels, curtains)" },
  { ar: "أجهزة السلامة (طفاية حريق، كاشف دخان)", en: "Safety equipment (fire extinguisher, smoke detector)" },
  { ar: "قفل ذكي أو صندوق مفاتيح", en: "Smart lock or key box" },
  { ar: "مقارنة الأسعار مع مورّدين مختلفين قبل الشراء", en: "Compare prices across suppliers before buying" },
];
