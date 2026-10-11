import { expect, test } from "@playwright/test";

/**
 * What Facebook, WhatsApp, X and Google read from the landing page: the
 * title, description, canonical URL and both languages, and a share image
 * that exists, is a 1200×630 PNG and is small enough for WhatsApp. Every
 * URL is absolute, on the production domain.
 */

const SITE = "https://backdeskapp.com";

for (const { path, url, ogLocale, alternateLocale, image, title } of [
  { path: "/", url: SITE, ogLocale: "ar_AR", alternateLocale: "en_US", image: "landing-ar.png", title: "باك ديسك · Backdesk — شقتك مكسب ولا خسارة؟" },
  { path: "/en", url: `${SITE}/en`, ogLocale: "en_US", alternateLocale: "ar_AR", image: "landing-en.png", title: "Backdesk — Is your apartment a profit or a loss?" },
]) {
  test(`${path}: title, description, canonical, languages and share tags`, async ({ page, request }) => {
    await page.goto(path);
    const meta = (selector: string) => page.locator(selector).first().getAttribute("content");
    await expect(page).toHaveTitle(title);
    const description = await meta('meta[name="description"]');
    expect(description!.length).toBeGreaterThan(50);
    expect(description!.length).toBeLessThanOrEqual(155);

    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(url);
    expect(await page.locator('link[rel="alternate"][hreflang="ar"]').getAttribute("href")).toBe(SITE);
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toBe(`${SITE}/en`);
    expect(await page.locator('link[rel="alternate"][hreflang="x-default"]').getAttribute("href")).toBe(SITE);

    expect(await meta('meta[property="og:type"]')).toBe("website");
    expect(await meta('meta[property="og:url"]')).toBe(url);
    expect(await meta('meta[property="og:title"]')).toBe(title);
    expect(await meta('meta[property="og:description"]')).toBe(description);
    expect(await meta('meta[property="og:locale"]')).toBe(ogLocale);
    expect(await meta('meta[property="og:locale:alternate"]')).toBe(alternateLocale);
    expect(await meta('meta[property="og:site_name"]')).toContain("Backdesk");
    expect(await meta('meta[property="og:image:width"]')).toBe("1200");
    expect(await meta('meta[property="og:image:height"]')).toBe("630");
    expect(await meta('meta[property="og:image:type"]')).toBe("image/png");
    expect(await meta('meta[property="og:image:alt"]')).toMatch(path === "/" ? /خسارة 7,014/ : /loss of EGP\s7,014/);
    expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");

    const ogImage = (await meta('meta[property="og:image"]'))!;
    expect(ogImage).toMatch(new RegExp(`^${SITE}/og/${image.replace(".", "\\.")}\\?v=[0-9a-f]{8}$`));
    expect(await meta('meta[name="twitter:image"]')).toBe(ogImage);

    // The same file, served by this build.
    const served = await request.get(new URL(ogImage).pathname + new URL(ogImage).search);
    expect(served.status()).toBe(200);
    expect(served.headers()["content-type"]).toBe("image/png");
    const png = await served.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    expect(png.length).toBeLessThan(300_000);
  });
}

test("other pages share the same image and say what Backdesk does", async ({ page }) => {
  await page.goto("/privacy");
  expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toMatch(/^https:\/\/backdeskapp\.com\/og\/landing-ar\.png\?v=/);
  expect(await page.locator('meta[name="description"]').getAttribute("content")).toContain("مكسب أو خسارة");
});
