// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The sign-in callback with stand-ins for next/headers' cookie store and
 * the Supabase client. What matters: the code exchange, the redirect only
 * to an allow-listed page from the cookie, the cookie deleted, failures
 * reported by a one-shot cookie (never in the URL), and no caching.
 */

const jar = new Map<string, string>();
const setCalls: { name: string; value: string; options?: Record<string, unknown> }[] = [];
const deleted: string[] = [];
const exchange = vi.fn(async (_code: string) => ({ error: null as null | { message: string } }));
let configured = true;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string, options?: Record<string, unknown>) => setCalls.push({ name, value, options }),
    delete: (name: string) => deleted.push(name),
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: async () => (configured ? { auth: { exchangeCodeForSession: exchange } } : null),
}));

const { GET } = await import("./route");

const request = (query: string) => new NextRequest(`https://backdeskapp.com/auth/callback${query}`);

beforeEach(() => {
  jar.clear();
  setCalls.length = 0;
  deleted.length = 0;
  exchange.mockClear();
  exchange.mockImplementation(async () => ({ error: null }));
  configured = true;
});

describe("GET /auth/callback", () => {
  it("exchanges the code and returns to the page in the cookie", async () => {
    jar.set("bd_next", "%2Fen%2Fdemo%2Fmore");
    const res = await GET(request("?code=abc"));
    expect(exchange).toHaveBeenCalledWith("abc");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://backdeskapp.com/en/demo/more");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(deleted).toContain("bd_next");
    expect(setCalls.find((c) => c.name === "bd_flash")).toBeUndefined();
  });

  it("goes to Units when the cookie is missing or points anywhere else", async () => {
    for (const value of [undefined, "https://evil.example", "//evil.example", "/auth/callback"]) {
      jar.clear();
      if (value) jar.set("bd_next", value);
      const res = await GET(request("?code=abc"));
      expect(res.headers.get("location")).toBe("https://backdeskapp.com/demo/units");
    }
  });

  it("reports a failed exchange with a one-shot cookie, not in the URL", async () => {
    jar.set("bd_next", "/demo/more");
    exchange.mockImplementation(async () => ({ error: { message: "invalid flow state" } }));
    const res = await GET(request("?code=abc"));
    expect(res.headers.get("location")).toBe("https://backdeskapp.com/demo/more");
    const flash = setCalls.find((c) => c.name === "bd_flash");
    expect(flash).toMatchObject({ value: "signin_failed", options: { path: "/", maxAge: 60, sameSite: "lax", secure: true } });
  });

  it("does not exchange when Google or Supabase reports an error, or there is no code", async () => {
    for (const query of ["?error=access_denied&error_description=denied", "?code=abc&error=server_error", ""]) {
      setCalls.length = 0;
      const res = await GET(request(query));
      expect(res.status).toBe(303);
      expect(setCalls.find((c) => c.name === "bd_flash")?.value).toBe("signin_failed");
    }
    expect(exchange).not.toHaveBeenCalled();
  });

  it("fails cleanly when accounts are not configured", async () => {
    configured = false;
    const res = await GET(request("?code=abc"));
    expect(res.status).toBe(303);
    expect(setCalls.find((c) => c.name === "bd_flash")?.value).toBe("signin_failed");
  });
});
