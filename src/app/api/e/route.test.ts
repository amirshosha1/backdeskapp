// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MAX_BODY_BYTES, POST } from "./route";

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

  it("does nothing without the key", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    expect((await POST(post(verdict))).status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses requests from other sites", async () => {
    expect((await POST(post(verdict, { "sec-fetch-site": "cross-site" }))).status).toBe(403);
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

describe("POST /api/e: campaign labels and calc_start (GTM:D-063)", () => {
  const common = { locale: "ar", display_mode: "browser" };
  const tags = { utm_source: "facebook", utm_medium: "social", utm_campaign: "oct-1", utm_content: "hook-a" };

  it("accepts calc_start with the labels and a model, and forwards them unchanged", async () => {
    const res = await POST(post({ event: "calc_start", properties: { ...common, ...tags, model: "rental_arbitrage" } }));
    expect(res.status).toBe(204);
    expect(sent().body.properties).toMatchObject({ ...tags, model: "rental_arbitrage" });
  });

  it("calc_start without a model is refused: it never fires before a model is picked", async () => {
    expect((await POST(post({ event: "calc_start", properties: { ...common, ...tags } }))).status).toBe(400);
    expect((await POST(post({ event: "calc_start", properties: { ...common, model: "default" } }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts verdict_shown with the labels and the model, and landing_view with utm_content", async () => {
    expect((await POST(post({ event: "verdict_shown", properties: { ...common, ...tags, entry: "landing", outcome: "loss", model: "managed_for_owner" } }))).status).toBe(204);
    expect((await POST(post({ event: "landing_view", properties: { ...common, ...tags } }))).status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("first_run_started stays model-free and label-free", async () => {
    const base = { event: "first_run_started", properties: { ...common, entry: "landing" } };
    expect((await POST(post({ ...base, properties: { ...base.properties, model: "owner_operated" } }))).status).toBe(400);
    expect((await POST(post({ ...base, properties: { ...base.properties, utm_source: "facebook" } }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a URL, path, referrer, identifier or any other key, and values that are not a bucket", async () => {
    const extras: Record<string, unknown>[] = [
      { url: "https://backdeskapp.com/demo/start?utm_source=fb" },
      { path: "/demo/start" },
      { referrer: "https://l.facebook.com/" },
      { session_id: "abc" },
      { distinct_id: "abc" },
      { utm_term: "x" },
      { utm_source: "https://evil.example/?a=1" },
      { utm_content: "Hook A" },
    ];
    for (const extra of extras) {
      for (const event of ["landing_view", "calc_start", "verdict_shown"] as const) {
        const own = event === "calc_start" ? { model: "owner_operated" } : event === "verdict_shown" ? { entry: "other", outcome: "loss", model: "owner_operated" } : {};
        const res = await POST(post({ event, properties: { ...common, ...own, ...extra } }));
        expect(res.status, `${event} + ${Object.keys(extra)[0]}`).toBe(400);
      }
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
