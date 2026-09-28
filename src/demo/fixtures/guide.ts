import type { Localized } from "./types";

/**
 * Setup guide fixtures. Content is prototype copy, still to be reviewed — it
 * states no legal requirements as fact and carries no prices, matching
 * Phase 3's "DRAFT — Amir to review" rule (BUILD_PLAN.md §5, Phase 3) even
 * though Phase P ships no real content pipeline yet.
 *
 * `draft` stands in for Phase 3's MDX frontmatter (`content/{ar,en}/guide/`,
 * `stage`, `order`, `tier`, ...): the draft status lives here and in
 * docs/PROGRESS.md, not as a "نص مبدئي" label in the UI (Phase P.1.1 —
 * Amir found the UI label noisy; the content still needs his review).
 */

export interface GuideStage {
  id: string;
  order: number;
  title: Localized;
  overview: Localized;
  tier: "free" | "pro";
  draft: boolean;
}

export const GUIDE_STAGES: GuideStage[] = [
  {
    id: "1",
    order: 1,
    title: { ar: "الجدوى والموقع", en: "Feasibility and location" },
    overview: {
      ar: "قبل أي التزام، احسب العائد المتوقع وقارن بين أكثر من منطقة.",
      en: "Before you commit, estimate the expected return and compare more than one area.",
    },
    tier: "free",
    draft: true,
  },
  {
    id: "2",
    order: 2,
    title: { ar: "العقد وموافقة الكمبوند", en: "Lease and compound approval" },
    overview: {
      ar: "تأكد أن عقد الإيجار يسمح صراحةً بالتأجير قصير المدة، وراجع قواعد الكمبوند.",
      en: "Make sure the lease explicitly allows short-term rental, and check the compound rules.",
    },
    tier: "free",
    draft: true,
  },
  {
    id: "3",
    order: 3,
    title: { ar: "الميزانية والتجهيز", en: "Budget and furnishing" },
    overview: {
      ar: "خطّط لميزانية التجهيز بندًا بندًا قبل أن تشتري أي شيء.",
      en: "Plan the setup budget item by item before you buy anything.",
    },
    tier: "free",
    draft: true,
  },
  {
    id: "4",
    order: 4,
    title: { ar: "التصوير والإعلان", en: "Photography and listing" },
    overview: {
      ar: "صور احترافية ووصف دقيق يرفعان نسبة الحجز.",
      en: "Professional photos and an accurate description raise bookings.",
    },
    tier: "free",
    draft: true,
  },
  {
    id: "5",
    order: 5,
    title: { ar: "التشغيل اليومي", en: "Day-to-day operations" },
    overview: {
      ar: "التنظيف والمستلزمات والصيانة: نظام ثابت يمنع المفاجآت.",
      en: "Cleaning, supplies and maintenance: a steady routine that prevents surprises.",
    },
    tier: "free",
    draft: true,
  },
  {
    id: "6",
    order: 6,
    title: { ar: "الإطلاق وأول التقييمات", en: "Launch and first reviews" },
    overview: {
      ar: "أول ضيوفك يصنعون سمعة الوحدة، فاهتم بتجربتهم.",
      en: "Your first guests build the unit's reputation, so look after them.",
    },
    tier: "free",
    draft: true,
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
    draft: true,
  },
];

export const STAGE_3_CHECKLIST: Localized[] = [
  { ar: "حدّد الميزانية الإجمالية للتجهيز", en: "Set the total setup budget" },
  { ar: "الأثاث الأساسي (غرف النوم والصالة)", en: "Core furniture (bedrooms and living room)" },
  { ar: "الأجهزة الكهربائية (تكييف، ثلاجة، غسالة)", en: "Appliances (A/C, fridge, washer)" },
  { ar: "أدوات المطبخ والمنزل", en: "Kitchen and household items" },
  { ar: "المفروشات (ملاءات ومناشف وستائر)", en: "Linens (sheets, towels, curtains)" },
  { ar: "أدوات السلامة (طفاية حريق وكاشف دخان)", en: "Safety equipment (fire extinguisher, smoke detector)" },
  { ar: "قفل ذكي أو صندوق مفاتيح", en: "Smart lock or key box" },
  { ar: "قارن الأسعار بين أكثر من مورّد قبل الشراء", en: "Compare prices across suppliers before buying" },
];
