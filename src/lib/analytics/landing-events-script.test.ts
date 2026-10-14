import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { utmValue } from "./events";
import { landingEventsScript } from "./landing-events-script";
import { track } from "./track";

/**
 * The landing's inline event script sends exactly what `track()` would for
 * the same event (same route, same body, same utm buckets), once per page
 * load, nothing while the page is leaving for the app, and no second view
 * on a language switch.
 */

const beacon = vi.fn((_url: string, _data?: BodyInit | null) => true);
const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 204 }));

function bodyOf(data: unknown): Promise<{ event: string; properties: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(JSON.parse(String(reader.result)));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(data as Blob);
  });
}

const sentBodies = () => Promise.all(beacon.mock.calls.map(([, data]) => bodyOf(data)));
const listeners: [string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined][] = [];

function load({ path = "/", search = "", referrer = "" }: { path?: string; search?: string; referrer?: string } = {}) {
  window.history.replaceState(null, "", `${path}${search}`);
  Object.defineProperty(document, "referrer", { value: referrer, configurable: true });
  // Keep track of the click listener so each test starts clean.
  const add = document.addEventListener.bind(document);
  document.addEventListener = ((type: string, fn: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) => {
    listeners.push([type, fn, opts]);
    add(type, fn, opts);
  }) as typeof document.addEventListener;
  new Function(landingEventsScript())();
  document.addEventListener = add;
}

beforeEach(() => {
  Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true, writable: true });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
  document.documentElement.lang = "ar";
  document.documentElement.removeAttribute("data-leaving");
  document.body.innerHTML = `<main><a href="/demo/start?from=landing" data-cta><span>احسب</span></a><a href="/privacy">privacy</a></main>`;
});

afterEach(() => {
  for (const [type, fn, opts] of listeners.splice(0)) document.removeEventListener(type, fn, opts);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
  beacon.mockImplementation(() => true);
});

describe("landingEventsScript()", () => {
  it("sends landing_view once, with the same body track() sends", async () => {
    load({ search: "?utm_source=Facebook&utm_medium=social&utm_campaign=post%201" });
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0]![0]).toBe("/api/e");
    const [view] = await sentBodies();
    expect(view).toEqual({
      event: "landing_view",
      properties: { utm_source: "facebook", utm_medium: "social", utm_campaign: "other", locale: "ar", display_mode: "browser" },
    });

    beacon.mockClear();
    track("landing_view", { utm_source: "facebook", utm_medium: "social", utm_campaign: "other" });
    const [fromTrack] = await sentBodies();
    expect(view).toEqual(fromTrack);
  });

  it("buckets utm values exactly like utmValue()", async () => {
    const inputs = ["fb", "FB", " ig ", "a b", "x".repeat(41), "x".repeat(40), "ok_1-2", "عربي", "  "];
    for (const raw of inputs) {
      beacon.mockClear();
      load({ search: `?utm_source=${encodeURIComponent(raw)}` });
      const [view] = await sentBodies();
      expect(view!.properties.utm_source, JSON.stringify(raw)).toBe(utmValue(raw));
    }
  });

  it("without utm_* sends no utm properties; English pages say so", async () => {
    document.documentElement.lang = "en";
    load({ path: "/en" });
    const [view] = await sentBodies();
    expect(view!.properties).toEqual({ locale: "en", display_mode: "browser" });
  });

  it("a tap sends the CTA through a keepalive request before navigation; other links send nothing", () => {
    load();
    beacon.mockClear();
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => {}));
    document.querySelector("a[href='/privacy']")!.addEventListener("click", (e) => e.preventDefault());
    (document.querySelector("a[href='/privacy']") as HTMLElement).click();
    expect(beacon).not.toHaveBeenCalled();
    const cta = document.querySelector("[data-cta]") as HTMLElement;
    const clicked = (cta.querySelector("span") as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(clicked).toBe(false);
    expect(beacon).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/e");
    expect(init).toMatchObject({ method: "POST", keepalive: true, credentials: "same-origin" });
    const click = JSON.parse(String(init?.body));
    expect(click).toEqual({ event: "landing_cta_click", properties: { locale: "ar", display_mode: "browser" } });
  });

  it("falls back to a keepalive fetch when the beacon is refused", () => {
    beacon.mockImplementation(() => false);
    load();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/e");
    expect(init).toMatchObject({ method: "POST", keepalive: true, credentials: "same-origin" });
  });

  it("sends nothing while the page is leaving for the app", () => {
    document.documentElement.setAttribute("data-leaving", "");
    load();
    (document.querySelector("[data-cta]") as HTMLElement).addEventListener("click", (e) => e.preventDefault());
    (document.querySelector("[data-cta]") as HTMLElement).click();
    expect(beacon).not.toHaveBeenCalled();
  });

  it("a language switch from the other landing is not a new view; other referrers are", () => {
    const origin = window.location.origin;
    load({ path: "/en", referrer: `${origin}/` });
    expect(beacon).not.toHaveBeenCalled();
    load({ path: "/", referrer: `${origin}/en` });
    expect(beacon).not.toHaveBeenCalled();
    load({ path: "/", referrer: `${origin}/privacy` });
    load({ path: "/", referrer: "https://l.facebook.com/" });
    load({ path: "/", referrer: `${origin}/` });
    expect(beacon).toHaveBeenCalledTimes(3);
  });

  it("never throws, even without sendBeacon or fetch", () => {
    Object.defineProperty(navigator, "sendBeacon", { value: undefined, configurable: true, writable: true });
    vi.stubGlobal("fetch", () => {
      throw new Error("blocked");
    });
    expect(() => load()).not.toThrow();
  });
});
