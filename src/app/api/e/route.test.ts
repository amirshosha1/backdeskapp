// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MAX_BODY_BYTES, POST } from "./route";
import { createConsentToken } from "@/lib/analytics/consent-token";

/**
 * The analytics route: only the catalogue, only from this site, never from
 * a robot; it forwards one anonymous event to PostHog EU (a fresh random
 * id, no person profile, no IP lookup) and does nothing without the key.
 */

const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.122 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/473.0.0.39.109;IABMV/1;]";

const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 200 }));

const verdict = { event: "verdict_shown", properties: { entry: "landing", outcome: "loss", locale: "ar", display_mode: "browser" } };

function post(body: unknown, headers: Record<string, string> = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new NextRequest("https://backdeskapp.com/api/e", {
    method: "POST",
    body: text,
    headers: {
      host: "backdeskapp.com",
      "sec-fetch-site": "same-origin",
      "user-agent": ANDROID_CHROME,
      "content-type": "text/plain;charset=UTF-8",
      ...headers,
    },
  });
}

function sent() {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0]!;
  return { url: String(url), body: JSON.parse(String(init!.body)) as Record<string, unknown> & { properties: Record<string, unknown> } };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");
  vi.stubEnv("VERCEL_ENV", "preview");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("POST /api/e", () => {
  it("forwards one anonymous event to PostHog EU", async () => {
    const res = await POST(post(verdict, { "x-vercel-ip-country": "EG", "user-agent": FACEBOOK_ANDROID }));
    expect(res.status).toBe(204);
    const { url, body } = sent();
    expect(url).toBe("https://eu.i.posthog.com/i/v0/e/");
    expect(body.api_key).toBe("phc_test");
    expect(body.event).toBe("verdict_shown");
    expect(body.distinct_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.properties).toEqual({
      entry: "landing",
      outcome: "loss",
      locale: "ar",
      display_mode: "browser",
      in_app_browser: true,
      env: "preview",
      country: "EG",
      $process_person_profile: false,
      $geoip_disable: true,
      $lib: "backdesk",
    });
    // No IP and no user agent leave this server.
    expect(JSON.stringify(body)).not.toMatch(/FB_IAB|Android|\d+\.\d+\.\d+\.\d+/);
  });

  it("a new random id for every event: nothing links two events", async () => {
    await POST(post(verdict));
    await POST(post(verdict));
    const ids = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init!.body)).distinct_id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("links only events carrying a valid accepted cookie", async () => {
    vi.stubEnv("ANALYTICS_CONSENT_SECRET", "0123456789abcdef0123456789abcdef");
    const token = createConsentToken()!;
    await POST(post(verdict));
    await POST(post({ event: "landing_view", properties: { locale: "ar", display_mode: "browser" } }, { cookie: `__Host-backdesk-analytics-consent=${token}` }));
    await POST(post(verdict, { cookie: `__Host-backdesk-analytics-consent=${token}` }));
    await POST(post(verdict));
    const ids = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init!.body)).distinct_id);
    expect(ids[1]).toBe(ids[2]);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[3]).not.toBe(ids[1]);
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(token);
  });

  it("does nothing without the key", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    expect((await POST(post(verdict))).status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses requests from other sites", async () => {
    expect((await POST(post(verdict, { "sec-fetch-site": "cross-site" }))).status).toBe(403);
    expect((await POST(post(verdict, { origin: "https://evil.example" }))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a same-origin Origin header when Sec-Fetch-Site is absent, and refuses a foreign one", async () => {
    const own = post(verdict, { origin: "https://backdeskapp.com" });
    own.headers.delete("sec-fetch-site");
    expect((await POST(own)).status).toBe(204);
    const foreign = post(verdict, { origin: "https://evil.example" });
    foreign.headers.delete("sec-fetch-site");
    expect((await POST(foreign)).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("drops robots that run JavaScript", async () => {
    for (const ua of ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "Mozilla/5.0 HeadlessChrome/126.0", "Chrome-Lighthouse"]) {
      expect((await POST(post(verdict, { "user-agent": ua }))).status).toBe(204);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses anything outside the catalogue", async () => {
    const bad: unknown[] = [
      { event: "page_view", properties: { locale: "ar", display_mode: "browser" } },
      { ...verdict, properties: { ...verdict.properties, amount: 7014 } },
      { ...verdict, properties: { ...verdict.properties, outcome: "maybe" } },
      { ...verdict, extra: true },
      { event: "landing_view", properties: { locale: "ar", display_mode: "browser", utm_source: "Free Text Here" } },
      "not json",
    ];
    for (const body of bad) expect((await POST(post(body))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an oversized body", async () => {
    const big = JSON.stringify({ ...verdict, pad: "x".repeat(MAX_BODY_BYTES) });
    expect((await POST(post(big))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 204 even when PostHog is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    expect((await POST(post(verdict))).status).toBe(204);
  });

  it("accepts the landing events with sanitised utm values", async () => {
    const res = await POST(post({ event: "landing_view", properties: { locale: "en", display_mode: "standalone", utm_source: "facebook", utm_campaign: "launch-1" } }));
    expect(res.status).toBe(204);
    expect(sent().body.properties).toMatchObject({ utm_source: "facebook", utm_campaign: "launch-1", env: "preview" });
  });
});
