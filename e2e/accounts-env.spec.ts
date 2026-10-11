import { expect, test, type Page } from "@playwright/test";
import { SUPABASE_URL } from "../playwright.accounts.config";

/**
 * Accounts switched on (playwright.accounts.config.ts), in a production
 * build. No real Supabase: every browser request to the placeholder host is
 * intercepted. Proves what the unit tests can't: the built app sends Google
 * sign-in to Supabase with redirect_to exactly <origin>/auth/callback (no
 * query) and PKCE; the page to come back to is a cookie; /auth/callback is
 * served outside the locales and reports failure without touching the URL;
 * inside Facebook's browser, the sheet replaces the sign-in.
 */

const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.122 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/473.0.0.39.109;IABMV/1;]";

async function interceptSupabase(page: Page) {
  const requests: string[] = [];
  await page.route(`${SUPABASE_URL}/**`, (route) => {
    requests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/html", body: "<p>supabase stand-in</p>" });
  });
  return requests;
}

test("a visitor sees sign-in on المزيد, and nothing is requested from Supabase before a tap", async ({ page }) => {
  const requests = await interceptSupabase(page);
  await page.goto("/demo/more");
  await expect(page.getByTestId("sign-in")).toBeVisible();
  await expect(page.getByTestId("guest-banner")).toHaveText("محفوظ على هذا الجهاز · سجّل الدخول لتحفظه في حسابك");
  await expect(page.getByText("بيانات تجريبية")).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  expect(requests).toEqual([]);
});

test("the visitor's top line is a way in: tapping it starts Google sign-in", async ({ page }) => {
  const requests = await interceptSupabase(page);
  await page.goto("/demo/units");
  await page.getByTestId("guest-banner").click();
  await page.waitForURL(`${SUPABASE_URL}/**`);
  expect(requests.some((u) => u.includes("/auth/v1/authorize"))).toBe(true);
});

test("Google sign-in: redirect_to is exactly /auth/callback, PKCE, and the page travels in a cookie", async ({ page, context, baseURL }) => {
  const requests = await interceptSupabase(page);
  await page.goto("/en/demo/more");
  await page.getByTestId("sign-in").click();
  await page.waitForURL(`${SUPABASE_URL}/**`);
  const authorize = new URL(requests.find((u) => u.includes("/auth/v1/authorize"))!);
  expect(authorize.searchParams.get("provider")).toBe("google");
  expect(authorize.searchParams.get("redirect_to")).toBe(`${baseURL}/auth/callback`);
  expect(authorize.searchParams.get("code_challenge_method")).toBe("s256");
  expect(authorize.searchParams.get("code_challenge")).toBeTruthy();
  expect(authorize.searchParams.get("prompt")).toBe("select_account");
  const cookies = await context.cookies(baseURL);
  expect(cookies.find((c) => c.name === "bd_next")?.value).toBe(encodeURIComponent("/en/demo/more"));
  expect(cookies.some((c) => c.name === "sb-e2e-ref-auth-token-code-verifier")).toBe(true);
});

test("the callback is served outside the locales, never echoes an error in the URL, and the page says sign-in failed", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "bd_next", value: encodeURIComponent("/demo/more"), url: baseURL! }]);
  const response = await page.request.get("/auth/callback?code=not-a-real-code", { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect(response.headers()["location"]).toBe("/demo/more");
  expect(response.headers()["cache-control"]).toBe("no-store");

  await page.goto("/auth/callback?error=access_denied&error_description=denied");
  await expect(page).toHaveURL(`${baseURL}/demo/units`);
  await expect(page.getByTestId("toast")).toHaveText("لم يكتمل تسجيل الدخول. حاول مرة أخرى.");
});

test("a hostile return page is ignored", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "bd_next", value: encodeURIComponent("//evil.example/x"), url: baseURL! }]);
  const response = await page.request.get("/auth/callback", { maxRedirects: 0 });
  expect(response.headers()["location"]).toBe("/demo/units");
});

test.describe("inside Facebook's in-app browser", () => {
  test.use({ userAgent: FACEBOOK_ANDROID });

  test("sign-in opens the «open in your browser» sheet, and nothing goes to Google", async ({ page }) => {
    const requests = await interceptSupabase(page);
    await page.goto("/demo/more");
    await page.getByTestId("sign-in").click();
    const sheet = page.getByTestId("in-app-sheet");
    await expect(sheet).toBeVisible();
    await expect(page.getByRole("dialog", { name: "افتح الصفحة في المتصفح لتسجيل الدخول" })).toBeVisible();
    const intent = await sheet.getByTestId("in-app-open-chrome").getAttribute("href");
    expect(intent).toMatch(/^intent:\/\/127\.0\.0\.1:3020\/demo\/more#Intent;scheme=http;package=com\.android\.chrome;S\.browser_fallback_url=/);
    await expect(sheet.getByRole("textbox")).toHaveValue(/\/demo\/more$/);
    expect(requests).toEqual([]);
    await expect(page).toHaveURL(/\/demo\/more$/);
  });

  test("the guest flow keeps working: the calculator and Units are usable", async ({ page }) => {
    await page.goto("/demo/calculator");
    await expect(page.getByTestId("hero-sentence")).toBeVisible();
    await page.goto("/demo/units");
    await expect(page.getByTestId("add-first-unit")).toBeVisible();
  });
});

test.describe("the landing page with accounts on", () => {
  const cookie = (name: string, baseURL: string) => ({ name, value: "base64-e30", url: baseURL });

  test("a signed-in person skips it: / → /demo; the sign-in's code verifier alone does not count", async ({ page, context, baseURL }) => {
    await interceptSupabase(page);
    await context.addCookies([cookie("sb-e2e-ref-auth-token-code-verifier", baseURL!)]);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("شقتك مكسب ولا خسارة؟");

    await context.addCookies([cookie("sb-e2e-ref-auth-token.0", baseURL!)]);
    await page.goto("/en?utm_source=facebook");
    await expect(page).toHaveURL(/\/en\/demo\?utm_source=facebook$/);
  });
});
