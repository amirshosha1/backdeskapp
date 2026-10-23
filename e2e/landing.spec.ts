import { expect, test, type Page } from "@playwright/test";
import { resetGuestOnEveryLoad, storageStateFor, withOwnUnit } from "./guest";

/**
 * The public landing page (/, /en; Batch 4): a first visit, a crawler or a
 * link preview gets the whole page with no redirect and no JavaScript
 * needed; someone with an apartment saved in this browser goes straight to
 * the app, keeping the query string. One phone screen up to the button,
 * even inside Facebook's in-app browser (about 360×640 of page); no
 * horizontal scroll; every number tabular; nothing sent (this build has no
 * analytics key).
 */
test.use({ storageState: storageStateFor(null) });

const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.122 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/473.0.0.39.109;IABMV/1;]";

function recordSent(page: Page) {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") sent.push(`${request.method()} ${request.url()}`);
  });
  return sent;
}

test("a first visit gets the page itself, in Arabic, with no redirect and nothing sent", async ({ page }) => {
  const sent = recordSent(page);
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["x-robots-tag"]).toBeUndefined();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("شقتك مكسب ولا خسارة؟");
  await expect(page.getByTestId("example-chip")).toHaveText("مثال · أرقام توضيحية");
  await expect(page.getByTestId("landing-verdict")).toHaveText("خسارة");
  await expect(page.getByTestId("device-banner")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  expect(sent).toEqual([]);
});

test("the English page is the same page in English", async ({ page }) => {
  const response = await page.goto("/en");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Is your apartment a profit or a loss?");
  await expect(page.getByTestId("landing-cta")).toHaveAttribute("href", "/en/demo/start?from=landing");
});

test("the server HTML carries the whole page, the Latin name marked as English", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain("شقتك مكسب ولا خسارة؟");
  expect(html).toMatch(/<span lang="en" dir="ltr">Backdesk<\/span>/);
  expect(html).toContain('href="/demo/start?from=landing"');
  expect(html).toContain('href="/privacy"');
  expect(html).toContain('href="mailto:support@backdeskapp.com"');
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the page reads in full and the button still works", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("hero-figure")).toBeVisible();
    await page.getByTestId("landing-cta").click();
    await expect(page).toHaveURL(/\/demo\/start\?from=landing$/);
  });
});

for (const viewport of [
  { width: 360, height: 640 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
]) {
  test.describe(`at ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });
    for (const path of ["/", "/en"]) {
      test(`${path}: the button is on the first screen, and nothing scrolls sideways`, async ({ page }) => {
        await page.goto(path);
        const box = await page.getByTestId("landing-cta").boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      });
    }
  });
}

test("the button opens the first-run flow, and the marker leaves the address bar", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("landing-cta").click();
  await expect(page).toHaveURL(/\/demo\/start$/);
  await expect(page.getByRole("radio", { name: /أستأجرها وأعيد تأجيرها/ })).toBeVisible();
});

test("every number on the page is tabular", async ({ page }) => {
  await page.goto("/");
  const notTabular = await page.evaluate(() => {
    const out: string[] = [];
    const walker = document.createTreeWalker(document.querySelector('[data-testid="landing"]')!, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!/\d/.test(node.textContent ?? "")) continue;
      const style = getComputedStyle(node.parentElement!);
      if (!style.fontFeatureSettings.includes("tnum") || !style.fontVariantNumeric.includes("tabular-nums")) out.push(node.textContent!.trim());
    }
    return out;
  });
  expect(notTabular).toEqual([]);
});

test("the language switch, the privacy link and the privacy page's back arrow", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("landing-language").click();
  await expect(page).toHaveURL(/\/en$/);
  await page.getByTestId("landing-privacy").click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await page.getByRole("link", { name: "Back to the home page" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Is your apartment a profit or a loss?");
});

test("Facebook's in-app browser gets the same page", async ({ browser }) => {
  const context = await browser.newContext({ userAgent: FACEBOOK_ANDROID, viewport: { width: 360, height: 640 }, isMobile: true });
  const page = await context.newPage();
  const response = await page.goto("/?utm_source=facebook");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("شقتك مكسب ولا خسارة؟");
  await expect(page.getByTestId("landing-cta")).toBeInViewport();
  await context.close();
});

test.describe("returning visitors go straight to the app", () => {
  test("an apartment saved in this browser: / → /demo, keeping the query string", async ({ page }) => {
    await resetGuestOnEveryLoad(page, withOwnUnit());
    await page.goto("/?utm_source=facebook&utm_campaign=launch");
    await expect(page).toHaveURL(/\/demo\?utm_source=facebook&utm_campaign=launch$/);
    await expect(page.getByTestId("home-apartment")).toBeVisible();
  });

  test("the same in English: /en → /en/demo", async ({ page }) => {
    await resetGuestOnEveryLoad(page, withOwnUnit());
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en\/demo$/);
  });

  test("someone who finished the flow without an apartment still sees the page", async ({ page }) => {
    await resetGuestOnEveryLoad(page, { v: 1, firstRun: { seen: true, count: null }, units: [] });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("شقتك مكسب ولا خسارة؟");
    await expect(page).toHaveURL(/\/$/);
  });
});

test("robots.txt lets search engines read the landing and keeps them out of the app; the sitemap lists both languages", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Disallow: /demo");
  expect(robots).toContain("Disallow: /en/demo");
  expect(robots).toContain("Sitemap: https://backdeskapp.com/sitemap.xml");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://backdeskapp.com/</loc>");
  expect(sitemap).toContain("<loc>https://backdeskapp.com/en</loc>");
  expect(sitemap).not.toContain("/demo");
});

test("the 'How it works' stations are readable: text contrast against the surface it sits on is at least 4.5:1 (UX-P02)", async ({ page }) => {
  await page.goto("/");
  const ratios = await page.evaluate(() => {
    // Tailwind v4 serves colours as oklch()/color-mix(): let the canvas resolve any CSS colour to sRGB.
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    const parse = (value: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 255] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    // The first opaque background walking up from the element.
    const surface = (el: Element): number[] => {
      for (let node: Element | null = el; node; node = node.parentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c[3] === 1) return c;
      }
      return [255, 255, 255, 1];
    };
    const out: { text: string; ratio: number }[] = [];
    const targets = [...document.querySelectorAll('[data-testid="landing-how"] ol li p, [data-testid="landing-how"] ol li h3, [data-testid="landing-how"] > p')];
    for (const el of targets) {
      const fg = parse(getComputedStyle(el).color);
      const bg = surface(el);
      // Blend a translucent text colour over its surface.
      const a = fg[3]!;
      const blended = [0, 1, 2].map((i) => fg[i]! * a + bg[i]! * (1 - a));
      const l1 = lum(blended);
      const l2 = lum(bg);
      out.push({ text: (el.textContent ?? "").slice(0, 24), ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) });
    }
    return out;
  });
  expect(ratios.length).toBeGreaterThanOrEqual(9);
  for (const { text, ratio } of ratios) expect(ratio, text).toBeGreaterThanOrEqual(4.5);
});
