// @vitest-environment node
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { callbackUrl, DEFAULT_NEXT, nextFromLocation, safeNextPath } from "./next-path";

describe("callbackUrl", () => {
  it("is exactly <origin>/auth/callback: no query string, no fragment, no path from the origin", () => {
    expect(callbackUrl("https://backdeskapp.com")).toBe("https://backdeskapp.com/auth/callback");
    expect(callbackUrl("https://backdeskapp.com/")).toBe("https://backdeskapp.com/auth/callback");
    expect(callbackUrl("http://localhost:3000")).toBe("http://localhost:3000/auth/callback");
    expect(callbackUrl("https://x.vercel.app/demo/more?tab=all#top")).toBe("https://x.vercel.app/auth/callback");
  });
});

describe("safeNextPath", () => {
  it("keeps the app's own pages, in both languages", () => {
    for (const path of ["/demo", "/demo/units", "/demo/more", "/en/demo/units", "/demo/units/downtown-cairo/statement", "/privacy", "/en/privacy"]) {
      expect(safeNextPath(path)).toBe(path);
    }
    expect(safeNextPath("%2Fen%2Fdemo%2Fmore")).toBe("/en/demo/more");
  });

  it("falls back to Units for anything else", () => {
    const hostile = [
      undefined,
      null,
      "",
      "/",
      "https://evil.example/demo",
      "//evil.example/demo",
      "/\\evil.example",
      "/demo/../../etc",
      "/demo/..%2F..%2Fadmin",
      "%2F%2Fevil.example",
      "%252Fdemo",
      "/demo?x=1",
      "/demo#x",
      "/demo/units ",
      "/demo/%0d%0aSet-Cookie:x",
      "/auth/callback",
      "/en/en/demo",
      "/fr/demo",
      "javascript:alert(1)",
      "/demo/" + "a".repeat(250),
      "%E0%A4%A",
    ];
    for (const raw of hostile) expect(safeNextPath(raw), String(raw)).toBe(DEFAULT_NEXT);
  });

  it("always returns an allow-listed, same-site path and never throws (property)", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.webUrl(), fc.webPath(), fc.string({ unit: "binary" })), (raw) => {
        const next = safeNextPath(raw);
        expect(next.startsWith("/")).toBe(true);
        expect(next.startsWith("//")).toBe(false);
        expect(next).toMatch(/^\/(?:en\/)?(?:demo(?:\/[A-Za-z0-9_-]+)*|privacy)$/);
      }),
      { numRuns: 2000 },
    );
  });
});

describe("nextFromLocation", () => {
  it("uses the path only", () => {
    expect(nextFromLocation("/demo/more")).toBe("/demo/more");
    expect(nextFromLocation("/en/demo/units/")).toBe("/en/demo/units");
    expect(nextFromLocation("/")).toBe(DEFAULT_NEXT);
  });
});
