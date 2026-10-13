import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** Short-lived proof that this server processed an explicit analytics choice. */
export const CONSENT_MAX_AGE_SECONDS = 6 * 60 * 60;
const HTTPS_COOKIE = "__Host-backdesk-analytics-consent";
const LOCAL_COOKIE = "backdesk-analytics-consent-local";
const TOKEN_PATTERN = /^v1\.([1-9]\d{9})\.([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/;

export function consentCookieName(request: NextRequest): string {
  return request.nextUrl.protocol === "https:" ? HTTPS_COOKIE : LOCAL_COOKIE;
}

export function consentCookieSecure(request: NextRequest): boolean {
  return request.nextUrl.protocol === "https:";
}

function signingSecret(): string | null {
  const secret = process.env.ANALYTICS_CONSENT_SECRET;
  return secret && Buffer.byteLength(secret, "utf8") >= 32 ? secret : null;
}

export function createConsentToken(now = Date.now()): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  const payload = `v1.${Math.floor(now / 1000) + CONSENT_MAX_AGE_SECONDS}.${randomBytes(16).toString("hex")}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function consentSessionId(request: NextRequest, now = Date.now()): string | null {
  const secret = signingSecret();
  const token = request.cookies.get(consentCookieName(request))?.value;
  if (!secret || !token) return null;
  const match = TOKEN_PATTERN.exec(token);
  if (!match) return null;
  const expiry = Number(match[1]);
  const current = Math.floor(now / 1000);
  if (!Number.isSafeInteger(expiry) || expiry <= current || expiry > current + CONSENT_MAX_AGE_SECONDS) return null;
  const payload = token.slice(0, token.lastIndexOf("."));
  const expected = createHmac("sha256", secret).update(payload).digest();
  const received = Buffer.from(match[3]!, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  // Domain separation keeps the bearer token itself out of PostHog.
  return createHmac("sha256", secret).update(`analytics-session:${match[2]}`).digest("hex");
}

export function hasValidConsent(request: NextRequest, now = Date.now()): boolean {
  return consentSessionId(request, now) !== null;
}
