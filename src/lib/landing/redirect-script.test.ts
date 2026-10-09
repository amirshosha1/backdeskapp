// @vitest-environment node
import { describe, expect, it } from "vitest";
import { GUEST_KEY } from "@/lib/guest/keys";
import { hasAuthCookie } from "@/lib/supabase/env";
import { LEAVING_ATTR, landingRedirectScript } from "./redirect-script";

/** Runs the inline script against a fake page; the script only touches these four globals. */
function run(opts: { path?: string; search?: string; hash?: string; stored?: string | null; storageThrows?: boolean; cookie?: string; authCookie?: string | null }) {
  const attrs = new Map<string, string>();
  const html = {
    style: { visibility: "" },
    setAttribute: (k: string, v: string) => attrs.set(k, v),
    removeAttribute: (k: string) => attrs.delete(k),
  };
  const replaced: string[] = [];
  const listeners: ((e: { persisted: boolean }) => void)[] = [];
  const page = {
    localStorage: {
      getItem: (key: string) => {
        if (opts.storageThrows) throw new Error("SecurityError");
        return key === GUEST_KEY ? (opts.stored ?? null) : null;
      },
    },
    document: { documentElement: html, cookie: opts.cookie ?? "" },
    location: {
      pathname: opts.path ?? "/",
      search: opts.search ?? "",
      hash: opts.hash ?? "",
      replace: (url: string) => replaced.push(url),
    },
    addEventListener: (type: string, fn: (e: { persisted: boolean }) => void) => type === "pageshow" && listeners.push(fn),
  };
  const script = landingRedirectScript(opts.authCookie === undefined ? "sb-abcd-auth-token" : opts.authCookie);
  new Function("localStorage", "document", "location", "addEventListener", script)(page.localStorage, page.document, page.location, page.addEventListener);
  return {
    replaced,
    hidden: html.style.visibility === "hidden",
    leaving: attrs.has(LEAVING_ATTR),
    restore: (persisted: boolean) => listeners.forEach((fn) => fn({ persisted })),
    page,
    html,
  };
}

const withUnit = JSON.stringify({ v: 1, firstRun: { seen: true, count: null }, units: [{ id: "own-1" }] });
const seenOnly = JSON.stringify({ v: 1, firstRun: { seen: true, count: null }, units: [] });

describe("landingRedirectScript()", () => {
  it("a first visit stays on the landing, visible", () => {
    const r = run({});
    expect(r.replaced).toEqual([]);
    expect(r.hidden).toBe(false);
    expect(r.leaving).toBe(false);
  });

  it("someone who finished the flow without saving an apartment stays", () => {
    expect(run({ stored: seenOnly }).replaced).toEqual([]);
  });

  it("an apartment saved in this browser goes to /demo, hidden, keeping the query string", () => {
    const r = run({ stored: withUnit, search: "?utm_source=facebook", hash: "#x" });
    expect(r.replaced).toEqual(["/demo?utm_source=facebook#x"]);
    expect(r.hidden).toBe(true);
    expect(r.leaving).toBe(true);
  });

  it("the English landing goes to /en/demo", () => {
    expect(run({ stored: withUnit, path: "/en" }).replaced).toEqual(["/en/demo"]);
    expect(run({ stored: withUnit, path: "/en/" }).replaced).toEqual(["/en/demo"]);
  });

  it("a Supabase session cookie, whole or chunked, goes to /demo", () => {
    expect(run({ cookie: "sb-abcd-auth-token=base64-eyJ" }).replaced).toEqual(["/demo"]);
    expect(run({ cookie: "a=1; sb-abcd-auth-token.0=base64-eyJ; sb-abcd-auth-token.1=xyz" }).replaced).toEqual(["/demo"]);
  });

  it("the PKCE code-verifier cookie alone, an empty cookie or another project's cookie stays", () => {
    expect(run({ cookie: "sb-abcd-auth-token-code-verifier=abc" }).replaced).toEqual([]);
    expect(run({ cookie: "sb-abcd-auth-token=" }).replaced).toEqual([]);
    expect(run({ cookie: "sb-other-auth-token=abc" }).replaced).toEqual([]);
  });

  it("matches hasAuthCookie for the same cookie strings", () => {
    for (const cookie of ["sb-abcd-auth-token=x", "sb-abcd-auth-token.3=x", "sb-abcd-auth-token-code-verifier=x", "sb-abcd-auth-token=", "x=sb-abcd-auth-token=1"]) {
      expect(run({ cookie }).replaced.length > 0).toBe(hasAuthCookie(cookie, "sb-abcd-auth-token"));
    }
  });

  it("a build without accounts ignores cookies", () => {
    expect(run({ cookie: "sb-abcd-auth-token=x", authCookie: null }).replaced).toEqual([]);
    expect(run({ stored: withUnit, authCookie: null }).replaced).toEqual(["/demo"]);
  });

  it("another storage version, corrupt or blocked storage stays (signed in still goes)", () => {
    expect(run({ stored: JSON.stringify({ v: 2, units: [{}] }) }).replaced).toEqual([]);
    expect(run({ stored: "{not json" }).replaced).toEqual([]);
    expect(run({ storageThrows: true }).replaced).toEqual([]);
    expect(run({ storageThrows: true, cookie: "sb-abcd-auth-token=x" }).replaced).toEqual(["/demo"]);
  });

  it("a page restored from the back/forward cache is shown again unless it should still leave", () => {
    const r = run({ stored: withUnit });
    r.page.localStorage.getItem = () => null;
    r.restore(false);
    expect(r.html.style.visibility).toBe("hidden");
    r.restore(true);
    expect(r.html.style.visibility).toBe("");
    expect(r.replaced).toEqual(["/demo"]);
    const again = run({ stored: withUnit });
    again.restore(true);
    expect(again.replaced).toEqual(["/demo", "/demo"]);
  });
});
