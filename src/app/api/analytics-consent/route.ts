import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { CONSENT_MAX_AGE_SECONDS, consentCookieName, consentCookieSecure, createConsentToken, hasValidConsent } from "@/lib/analytics/consent-token";

const Choice = z.strictObject({ action: z.enum(["accept", "reject"]) });
const noStore = { "cache-control": "no-store" };
const reply = (accepted: boolean, status = 200) => NextResponse.json({ accepted }, { status, headers: noStore });

/** The browser must initiate preference changes from this exact origin. */
function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (!origin || (site && site !== "same-origin")) return false;
  try {
    const supplied = new URL(origin);
    // Next can canonicalize nextUrl.host to localhost behind its dev proxy.
    // Host is the authority the browser actually addressed.
    return supplied.host === (request.headers.get("host") ?? request.nextUrl.host) && supplied.protocol === request.nextUrl.protocol;
  } catch {
    return false;
  }
}

export function GET(request: NextRequest) {
  return reply(hasValidConsent(request));
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply(false, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(false, 415);
  const raw = await request.text();
  if (raw.length > 64) return reply(false, 413);
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return reply(false, 400);
  }
  const choice = Choice.safeParse(data);
  if (!choice.success) return reply(false, 400);

  const response = reply(choice.data.action === "accept");
  const name = consentCookieName(request);
  const secure = consentCookieSecure(request);
  if (choice.data.action === "reject") {
    response.cookies.set(name, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  }
  const token = createConsentToken();
  if (!token) return reply(false, 503); // No configured signing key: linked tier fails closed.
  response.cookies.set(name, token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: CONSENT_MAX_AGE_SECONDS });
  return response;
}
