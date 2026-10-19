import { describe, expect, it } from "vitest";
import { ANALYTICS_EVENTS, MODELS, utmFromParams, utmValue } from "./events";

describe("analytics catalogue", () => {
  it("is exactly the five approved events", () => {
    expect([...ANALYTICS_EVENTS]).toEqual(["landing_view", "landing_cta_click", "first_run_started", "calc_start", "verdict_shown"]);
  });
});

describe("models", () => {
  it("are the three operating models and nothing else", () => {
    expect([...MODELS]).toEqual(["owner_operated", "rental_arbitrage", "managed_for_owner"]);
  });
});

describe("utmFromParams: the four labels, each a bucket (src = utm_source, campaign = utm_campaign, variant = utm_content)", () => {
  it("reads utm_source, utm_medium, utm_campaign and utm_content through utmValue", () => {
    const params = new URLSearchParams("utm_source=Facebook&utm_medium=social&utm_campaign=Oct%20post&utm_content=Hook-A&gclid=abc&q=1");
    expect(utmFromParams(params)).toEqual({ utm_source: "facebook", utm_medium: "social", utm_campaign: "other", utm_content: "hook-a" });
  });

  it("absent stays absent; nothing else in the query is read", () => {
    expect(utmFromParams(new URLSearchParams("from=landing&fbclid=xyz"))).toEqual({});
    expect(utmFromParams(new URLSearchParams("utm_content="))).toEqual({});
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
