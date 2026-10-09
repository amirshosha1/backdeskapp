/**
 * The analytics event catalogue (docs/ANALYTICS.md). Anonymous counting
 * only (Amir, 2026-10-08 and 2026-10-09): no cookie, no browser storage,
 * no identifier, never an amount, a name or free text. Every property is
 * a fixed value from a list below; the server route (src/app/api/e)
 * accepts nothing else. The client adds `locale` and `display_mode`; the
 * server adds `in_app_browser`, `env` and `country`.
 *
 * Shared by the browser and the route, so no Zod here (CLAUDE.md §6.6).
 */

export const ANALYTICS_PATH = "/api/e";

export const ANALYTICS_EVENTS = ["landing_view", "landing_cta_click", "first_run_started", "verdict_shown"] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export const LOCALES = ["ar", "en"] as const;
export const DISPLAY_MODES = ["browser", "standalone"] as const;
/** Where the first-run flow was started from: the landing page's button, or anywhere else. */
export const ENTRIES = ["landing", "other"] as const;
export const OUTCOMES = ["profit", "loss"] as const;

export type Entry = (typeof ENTRIES)[number];
export type Outcome = (typeof OUTCOMES)[number];

export interface CommonProps {
  locale: (typeof LOCALES)[number];
  display_mode: (typeof DISPLAY_MODES)[number];
}

/** What each event carries besides the common properties. */
export interface EventProps {
  landing_view: { utm_source?: string; utm_medium?: string; utm_campaign?: string };
  landing_cta_click: Record<string, never>;
  first_run_started: { entry: Entry };
  verdict_shown: { entry: Entry; outcome: Outcome };
}

/** A utm_* value as it may be sent: lowercase letters, digits, "-" and "_", at most 40. */
export const UTM_PATTERN = /^[a-z0-9_-]{1,40}$/;

/**
 * A utm_* query value reduced to a bucket: lowercased, kept when it fits
 * UTM_PATTERN, otherwise "other" (never free text); absent stays absent.
 */
export function utmValue(raw: string | null | undefined): string | undefined {
  if (raw === null || raw === undefined || raw === "") return undefined;
  const value = raw.trim().toLowerCase();
  return UTM_PATTERN.test(value) ? value : "other";
}
