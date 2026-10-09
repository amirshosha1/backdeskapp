import { expect, test, type Page } from "@playwright/test";

/**
 * Anonymous counting in a production build with the key set
 * (playwright.analytics.config.ts). Proves in a real browser what the unit
 * tests can't: the flow sends exactly first_run_started then
 * verdict_shown to this site's own /api/e, carrying fixed values only (no
 * amount, no identifier), sets no cookie and no new storage, and never
 * talks to another host. The real route answers too.
 */

const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

type Sent = { event: string; properties: Record<string, unknown> };

async function record(page: Page) {
  const sent: Sent[] = [];
  const hosts = new Set<string>();
  page.on("request", (request) => hosts.add(new URL(request.url()).host));
  await page.route("**/api/e", async (route) => {
    sent.push(JSON.parse(route.request().postData() ?? "{}") as Sent);
    await route.fulfill({ status: 204 });
  });
  return { sent, hosts };
}

test("Arabic, from the landing button: first_run_started then verdict_shown, fixed values only", async ({ page, context }) => {
  const { sent, hosts } = await record(page);
  await page.goto("/demo/start?from=landing&utm_source=facebook");
  await expect(page).toHaveURL(/\/demo\/start\?utm_source=facebook$/);
  await page.getByRole("radio", { name: /أستأجرها وأعيد تأجيرها/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "اعرض النتيجة" }).click();
  await expect(page.getByTestId("verdict-word")).toHaveText("خسارة");

  await expect.poll(() => sent.length).toBe(2);
  expect(sent).toEqual([
    { event: "first_run_started", properties: { entry: "landing", locale: "ar", display_mode: "browser" } },
    { event: "verdict_shown", properties: { entry: "landing", outcome: "loss", locale: "ar", display_mode: "browser" } },
  ]);
  // No amount ever leaves: no run of three digits in anything sent.
  expect(JSON.stringify(sent)).not.toMatch(/\d{3}/);
  // No cookie, and no storage beyond the flow's own.
  expect(await context.cookies()).toEqual([]);
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
  expect(storage.local.filter((k) => k !== "backdesk:guest")).toEqual([]);
  expect(storage.session.filter((k) => k !== "backdesk:first-run")).toEqual([]);
  expect([...hosts]).toEqual(["127.0.0.1:3030"]);
});

test("English, any other way in: entry is 'other'; a profit is counted as a profit", async ({ page }) => {
  const { sent } = await record(page);
  await page.goto("/en/demo/start");
  await page.getByRole("radio", { name: /own it and run it/i }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: /Show the result/i }).click();
  await expect(page.getByTestId("verdict-word")).toHaveText("Profit");
  await expect.poll(() => sent.length).toBe(2);
  expect(sent.map((e) => [e.event, e.properties.entry, e.properties.outcome, e.properties.locale])).toEqual([
    ["first_run_started", "other", undefined, "en"],
    ["verdict_shown", "other", "profit", "en"],
  ]);
});

test("a returning visitor with answers saved is not counted as starting again", async ({ page }) => {
  const { sent } = await record(page);
  await page.goto("/demo/start");
  await page.getByRole("radio", { name: /أملكها وأديرها/ }).click();
  await expect.poll(() => sent.length).toBe(1);
  // Back to the first question in a new page view, answers still in this tab.
  await page.goto("/demo/start");
  await expect(page.getByRole("radio", { name: /أملكها وأديرها/ })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(sent.map((e) => e.event)).toEqual(["first_run_started"]);
});

test.describe("the real /api/e route", () => {
  const verdict = { event: "verdict_shown", properties: { entry: "other", outcome: "loss", locale: "ar", display_mode: "browser" } };

  test("accepts the catalogue from this site (PostHog unreachable here, still 204)", async ({ request, baseURL }) => {
    const res = await request.post("/api/e", { data: JSON.stringify(verdict), headers: { origin: baseURL!, "user-agent": ANDROID_CHROME, "content-type": "text/plain" } });
    expect(res.status()).toBe(204);
  });

  test("refuses other sites and anything outside the catalogue", async ({ request, baseURL }) => {
    const foreign = await request.post("/api/e", { data: JSON.stringify(verdict), headers: { origin: "https://evil.example", "user-agent": ANDROID_CHROME } });
    expect(foreign.status()).toBe(403);
    const amount = { ...verdict, properties: { ...verdict.properties, amount: 7014 } };
    const bad = await request.post("/api/e", { data: JSON.stringify(amount), headers: { origin: baseURL!, "user-agent": ANDROID_CHROME } });
    expect(bad.status()).toBe(400);
  });
});
