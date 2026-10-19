import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { track } from "./track";

/**
 * The browser sender: nothing without the key; with it, one small
 * text/plain beacon to /api/e holding the event, its fixed-value
 * properties, the page language and the display mode. It never writes a
 * cookie or browser storage, and never throws.
 */

const beacon = vi.fn((_url: string, _data?: BodyInit | null) => true);
const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 204 }));

/** jsdom's Blob: read it the way a page would. */
function bodyOf(data: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(JSON.parse(String(reader.result)));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(data as Blob);
  });
}

beforeEach(() => {
  Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true, writable: true });
  vi.stubGlobal("fetch", fetchMock);
  document.documentElement.lang = "ar";
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  beacon.mockImplementation(() => true);
});

describe("track()", () => {
  it("sends nothing at all without NEXT_PUBLIC_POSTHOG_KEY", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    track("first_run_started", { entry: "landing" });
    expect(beacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("with the key: one beacon to /api/e with the event, its properties, locale and display mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    document.documentElement.lang = "en";
    track("verdict_shown", { entry: "other", outcome: "loss", model: "owner_operated" });
    expect(beacon).toHaveBeenCalledTimes(1);
    const [url, data] = beacon.mock.calls[0]!;
    expect(url).toBe("/api/e");
    expect((data as Blob).type).toBe("text/plain;charset=utf-8");
    expect(await bodyOf(data)).toEqual({
      event: "verdict_shown",
      properties: { entry: "other", outcome: "loss", model: "owner_operated", locale: "en", display_mode: "browser" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to a keepalive fetch when the beacon is refused", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    beacon.mockImplementation(() => false);
    track("landing_cta_click", {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/e");
    expect(init).toMatchObject({ method: "POST", keepalive: true, credentials: "same-origin" });
  });

  it("never writes a cookie or browser storage", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const cookie = vi.spyOn(document, "cookie", "set");
    track("landing_view", { utm_source: "facebook" });
    expect(setItem).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
    setItem.mockRestore();
    cookie.mockRestore();
  });

  it("never throws, even when both ways to send fail", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    beacon.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => track("first_run_started", { entry: "other" })).not.toThrow();
  });
});
