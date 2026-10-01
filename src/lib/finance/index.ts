/**
 * The finance engine (BUILD_PLAN.md §4): the one source of truth for every
 * financial figure (CLAUDE.md §6.1). Pure functions, `Decimal` money, the
 * unit currency only.
 *
 * `projection.ts` is deliberately NOT re-exported: it is server-only
 * (CLAUDE.md §6.5), and re-exporting it here would pull it into every
 * client bundle that imports the engine. Import it directly, from server
 * code only.
 */

export * from "./breakeven";
export * from "./commission";
export * from "./fees";
export * from "./fx";
export * from "./investment";
export * from "./kpis";
export * from "./model";
export * from "./money";
export * from "./org-profit";
export * from "./period";
export * from "./pnl";
export * from "./result";
export * from "./scenario";
export * from "./sensitivity";
export * from "./statement";
export * from "./tax";
export * from "./verdict";
export * from "./version";
