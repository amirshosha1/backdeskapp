// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { CONSENT_MAX_AGE_SECONDS, consentSessionId, createConsentToken, hasValidConsent } from "./consent-token";

const secret = "0123456789abcdef0123456789abcdef";
const request = (token?: string) => new NextRequest("https://backdeskapp.com/", { headers: token ? { cookie: `__Host-backdesk-analytics-consent=${token}` } : {} });
afterEach(() => vi.unstubAllEnvs());

describe("signed analytics consent", () => {
  it("fails closed without a strong server secret", () => {
    vi.stubEnv("ANALYTICS_CONSENT_SECRET", "short");
    expect(createConsentToken()).toBeNull();
    expect(consentSessionId(request("forged"))).toBeNull();
  });

  it("gives one session ID across events, tabs and reloads after explicit acceptance", () => {
    vi.stubEnv("ANALYTICS_CONSENT_SECRET", secret);
    const now = Date.now();
    const token = createConsentToken(now)!;
    expect(hasValidConsent(request(token), now)).toBe(true);
    expect(consentSessionId(request(token), now)).toMatch(/^[a-f0-9]{64}$/);
    expect(consentSessionId(request(token), now)).toBe(consentSessionId(request(token), now));
    expect(consentSessionId(request(createConsentToken(now)!), now)).not.toBe(consentSessionId(request(token), now));
    expect(consentSessionId(request(), now)).toBeNull();
  });

  it("rejects forgery, a changed secret and expiry", () => {
    vi.stubEnv("ANALYTICS_CONSENT_SECRET", secret);
    const now = Date.now();
    const token = createConsentToken(now)!;
    expect(consentSessionId(request(`${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`), now)).toBeNull();
    expect(consentSessionId(request(token), now + CONSENT_MAX_AGE_SECONDS * 1000)).toBeNull();
    vi.stubEnv("ANALYTICS_CONSENT_SECRET", "abcdefghijklmnopqrstuvwxyz012345");
    expect(consentSessionId(request(token), now)).toBeNull();
  });
});
