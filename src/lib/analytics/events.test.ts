import { describe, expect, it } from "vitest";
import { ANALYTICS_EVENTS, utmValue } from "./events";

describe("analytics catalogue", () => {
  it("is exactly the four approved events", () => {
    expect([...ANALYTICS_EVENTS]).toEqual(["landing_view", "landing_cta_click", "first_run_started", "verdict_shown"]);
  });
});

describe("utmValue: a bucket, never free text", () => {
  it("keeps simple values, lowercased", () => {
    expect(utmValue("Facebook")).toBe("facebook");
    expect(utmValue(" fb_group-2 ")).toBe("fb_group-2");
  });

  it("anything else becomes 'other'", () => {
    for (const raw of ["شقق", "a b", "x".repeat(41), "a@b.com", "01001234567?"]) expect(utmValue(raw)).toBe("other");
  });

  it("absent stays absent", () => {
    for (const raw of [null, undefined, ""]) expect(utmValue(raw)).toBeUndefined();
  });
});
