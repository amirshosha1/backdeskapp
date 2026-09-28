import type { UnitFixture } from "./types";

/**
 * Sample units for `/demo`. Madinaty and Sheikh Zayed reuse the revenue and
 * cost figures from BUILD_PLAN.md §4.6 Examples A and B, but applied under
 * the owner-operated and rental-arbitrage models (no commission) rather
 * than the managed model those examples were written for. Downtown Cairo
 * keeps Example A exactly as written (managed, 20% commission on net
 * payout). Rehab reuses the same base revenue under Example C's hybrid
 * commission. Every unit looking alike is a known Phase P gap, closed in
 * Phase 1 when the engine generates varied sample data (docs/PROGRESS.md).
 */
export const UNITS: UnitFixture[] = [
  {
    id: "madinaty",
    name: { ar: "شقة مدينتي", en: "Madinaty apartment" },
    area: { ar: "مدينتي، القاهرة الجديدة", en: "Madinaty, New Cairo" },
    operatingModel: "owner_operated",
    currency: "EGP",
    occupancy: 0.6,
    adr: "2500.00",
    revpar: "1500.00",
    netProfit: "32153.00",
  },
  {
    id: "sheikh-zayed",
    name: { ar: "شقة الشيخ زايد", en: "Sheikh Zayed apartment" },
    area: { ar: "الشيخ زايد، الجيزة", en: "Sheikh Zayed, Giza" },
    operatingModel: "rental_arbitrage",
    currency: "EGP",
    occupancy: 0.6,
    adr: "2500.00",
    revpar: "1500.00",
    netProfit: "-2847.00",
  },
  {
    id: "downtown-cairo",
    name: { ar: "شقة وسط البلد", en: "Downtown Cairo apartment" },
    area: { ar: "وسط البلد، القاهرة", en: "Downtown, Cairo" },
    operatingModel: "managed_for_owner",
    currency: "EGP",
    occupancy: 0.6,
    adr: "2500.00",
    revpar: "1500.00",
    managerProfit: "8010.60",
    owner: { ar: "أحمد يوسف", en: "Ahmed Youssef" },
    hasStatement: true,
  },
  {
    id: "rehab",
    name: { ar: "شقة الرحاب", en: "Rehab apartment" },
    area: { ar: "الرحاب، القاهرة الجديدة", en: "Rehab, New Cairo" },
    operatingModel: "managed_for_owner",
    currency: "EGP",
    occupancy: 0.6,
    adr: "2500.00",
    revpar: "1500.00",
    managerProfit: "4740.00",
    // Spelled with ya (مني), not the grammatically-standard alif maksura
    // (منى): at UI text sizes the nun's dot sits right against alif
    // maksura's tail and reads as invisible in every font tested
    // (IBM Plex Sans Arabic, the system sans fallback, monospace) — not a
    // rendering bug, just how this specific letter pair looks small. Ya's
    // two dots make the nun unambiguous. Sample data, so no real name is
    // affected by the respelling.
    owner: { ar: "مني عزيز", en: "Mona Aziz" },
    hasStatement: false,
  },
];

export const PORTFOLIO_OVERHEAD = "-1500.00";
