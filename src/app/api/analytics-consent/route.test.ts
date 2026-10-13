// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const base = "https://backdeskapp.com/api/analytics-consent";
function post(action: string, headers: Record<string, string> = {}) {
  return new NextRequest(base, { method: "POST", body: JSON.stringify({ action }), headers: { origin: "https://backdeskapp.com", "sec-fetch-site": "same-origin", "content-type": "application/json", ...headers } });
}
beforeEach(() => vi.stubEnv("ANALYTICS_CONSENT_SECRET", "0123456789abcdef0123456789abcdef"));
afterEach(() => vi.unstubAllEnvs());

describe("analytics consent endpoint", () => {
  it("accepts with a secure short-lived HttpOnly cookie and reads it back", async () => {
    const response = await POST(post("accept"));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/__Host-backdesk-analytics-consent=.*Secure.*HttpOnly.*SameSite=lax/i);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=21600");
    const token = response.cookies.get("__Host-backdesk-analytics-consent")!.value;
    expect((await GET(new NextRequest(base, { headers: { cookie: `__Host-backdesk-analytics-consent=${token}` } })).json()).accepted).toBe(true);
  });

  it("rejects and withdraws by clearing the cookie", async () => {
    const response = await POST(post("reject"));
    expect(response.cookies.get("__Host-backdesk-analytics-consent")?.value).toBe("");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect((await response.json()).accepted).toBe(false);
  });

  it("fails closed for missing signing config and forged requests", async () => {
    vi.stubEnv("ANALYTICS_CONSENT_SECRET", "");
    expect((await POST(post("accept"))).status).toBe(503);
    expect((await GET(new NextRequest(base)).json()).accepted).toBe(false);
    vi.stubEnv("ANALYTICS_CONSENT_SECRET", "0123456789abcdef0123456789abcdef");
    expect((await POST(post("accept", { origin: "https://evil.example" }))).status).toBe(403);
    expect((await POST(post("accept", { "sec-fetch-site": "cross-site" }))).status).toBe(403);
    expect((await POST(post("accept", { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(post("other"))).status).toBe(400);
    const missingOrigin = post("accept"); missingOrigin.headers.delete("origin");
    expect((await POST(missingOrigin)).status).toBe(403);
  });
});
