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

export const ANALYTICS_EVENTS = ["landing_view", "landing_cta_click", "first_run_started", "calc_start", "verdict_shown"] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export const LOCALES = ["ar", "en"] as const;
export const DISPLAY_MODES = ["browser", "standalone"] as const;
/** Where the first-run flow was started from: the landing page's button, or anywhere else. */
export const ENTRIES = ["landing", "other"] as const;
export const OUTCOMES = ["profit", "loss"] as const;
/** The operating model the visitor picked: the same three values as `OperatingModel` (src/lib/finance). */
export const MODELS = ["owner_operated", "rental_arbitrage", "managed_for_owner"] as const;

export type Entry = (typeof ENTRIES)[number];
export type Outcome = (typeof OUTCOMES)[number];
export type Model = (typeof MODELS)[number];

export interface CommonProps {
  locale: (typeof LOCALES)[number];
  display_mode: (typeof DISPLAY_MODES)[number];
}

/**
 * The campaign labels of a visit (GTM:D-063), under the keys PostHog already
 * holds: src = utm_source, campaign = utm_campaign, variant = utm_content;
 * utm_medium rides along. Each is a bucket from `utmValue`, never free text.
 */
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmProps = { [K in UtmKey]?: string };

/** What each event carries besides the common properties. */
export interface EventProps {
  landing_view: UtmProps;
  landing_cta_click: Record<string, never>;
  /** First visit only: no model, no campaign labels, never counted as a landing. */
  first_run_started: { entry: Entry };
  /** Fires only once a model is actually picked; never a default. */
  calc_start: UtmProps & { model: Model };
  verdict_shown: UtmProps & { entry: Entry; outcome: Outcome; model: Model };
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

/** The four campaign labels of a query string, each reduced with `utmValue`; absent stays absent. */
export function utmFromParams(params: URLSearchParams): UtmProps {
  const out: UtmProps = {};
  for (const key of UTM_KEYS) {
    const value = utmValue(params.get(key));
    if (value !== undefined) out[key] = value;
  }
  return out;
}
