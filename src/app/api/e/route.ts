import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { detectInAppBrowser } from "@/lib/browser/in-app";
import { DISPLAY_MODES, ENTRIES, LOCALES, OUTCOMES, UTM_PATTERN } from "@/lib/analytics/events";
import { consentSessionId } from "@/lib/analytics/consent-token";

/**
 * The first-party analytics endpoint (docs/ANALYTICS.md). The browser
 * sends one catalogued event (src/lib/analytics/track.ts); this route
 * accepts only the catalogue, adds three server-side facts and forwards it
 * to PostHog EU. Without verified consent each event gets a fresh random
 * distinct_id. Accepted events share a short-lived server-derived id.
 * No person profile or IP lookup; the country comes from Vercel's header, and the IP itself is never sent
 * (PostHog sees only Vercel's server). Without NEXT_PUBLIC_POSTHOG_KEY it
 * does nothing.
 */

export const MAX_BODY_BYTES = 2048;
const DEFAULT_HOST = "https://eu.i.posthog.com";
/** Crawlers and test robots that run JavaScript (the rest never send). "\bbot\b" spares phone brands such as CUBOT. */
const BOT_UA = /googlebot|bingbot|yandex|baiduspider|duckduckbot|applebot|petalbot|facebookexternalhit|crawler|spider|headlesschrome|chrome-lighthouse|pagespeed|gtmetrix|\bbot\b/i;

const common = {
  locale: z.enum(LOCALES),
  display_mode: z.enum(DISPLAY_MODES),
};
const utm = z.string().regex(UTM_PATTERN).optional();
const entry = z.enum(ENTRIES);

const EventSchema = z.discriminatedUnion("event", [
  z.strictObject({
    event: z.literal("landing_view"),
    properties: z.strictObject({ ...common, utm_source: utm, utm_medium: utm, utm_campaign: utm }),
  }),
  z.strictObject({ event: z.literal("landing_cta_click"), properties: z.strictObject(common) }),
  z.strictObject({ event: z.literal("first_run_started"), properties: z.strictObject({ ...common, entry }) }),
  z.strictObject({ event: z.literal("verdict_shown"), properties: z.strictObject({ ...common, entry, outcome: z.enum(OUTCOMES) }) }),
]);

const noContent = () => new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
const refuse = (status: number) => new NextResponse(null, { status, headers: { "cache-control": "no-store" } });

/** Sent by this site's own pages only. */
function sameOrigin(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (!origin) return site === "same-origin";
  try {
    const supplied = new URL(origin);
    return supplied.host === (request.headers.get("host") ?? request.nextUrl.host) && supplied.protocol === request.nextUrl.protocol;
  } catch {
    return false;
  }
}

function posthogHost(): string | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_POSTHOG_HOST || DEFAULT_HOST);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

function deploymentEnv(): "production" | "preview" | "development" {
  const env = process.env.VERCEL_ENV;
  return env === "production" || env === "preview" ? env : "development";
}

export async function POST(request: NextRequest) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = posthogHost();
  if (!key || !host) return noContent();
  if (!sameOrigin(request)) return refuse(403);

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_UA.test(userAgent)) return noContent();

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return refuse(413);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return refuse(413);

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return refuse(400);
  }
  const parsed = EventSchema.safeParse(json);
  if (!parsed.success) return refuse(400);

  const country = request.headers.get("x-vercel-ip-country");
  const payload = {
    api_key: key,
    event: parsed.data.event,
    distinct_id: consentSessionId(request) ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    properties: {
      ...parsed.data.properties,
      in_app_browser: detectInAppBrowser(userAgent).inApp,
      env: deploymentEnv(),
      ...(country && /^[A-Z]{2}$/.test(country) ? { country } : {}),
      $process_person_profile: false,
      $geoip_disable: true,
      $lib: "backdesk",
    },
  };

  try {
    await fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // PostHog unreachable: the event is lost, the visitor never notices.
  }
  return noContent();
}
