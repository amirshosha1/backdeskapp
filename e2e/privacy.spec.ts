import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Batch 3 PR B: /privacy and /en/privacy. Outside /demo, so indexable (it is
 * linked from Google's consent screen) and without the sample-data banner;
 * RTL at 360 px with no horizontal scroll; the contact is support@.
 */
for (const { path, lang, dir, heading } of [
  { path: "/privacy", lang: "ar", dir: "rtl", heading: "سياسة الخصوصية" },
  { path: "/en/privacy", lang: "en", dir: "ltr", heading: "Privacy policy" },
]) {
  test.describe(path, () => {
    test("renders, is indexable, and names support@backdeskapp.com", async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["x-robots-tag"]).toBeUndefined();
      expect(await page.locator('meta[name="robots"]').count()).toBe(0);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("html")).toHaveAttribute("dir", dir);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page.getByRole("link", { name: "support@backdeskapp.com" })).toHaveAttribute("href", "mailto:support@backdeskapp.com");
      await expect(page.getByTestId("demo-banner")).toHaveCount(0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("no serious or critical accessibility violations", async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).include("body").analyze();
      const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  });
}

test("the back button returns to المزيد and the language switch keeps the page", async ({ page }) => {
  await page.goto("/privacy");
  await page.getByTestId("language-switch").click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await page.getByRole("link", { name: "Back to the app" }).click();
  await expect(page).toHaveURL(/\/en\/demo\/more$/);
});

test("المزيد links to the privacy page", async ({ page }) => {
  await page.goto("/demo/more");
  await page.getByRole("link", { name: /سياسة الخصوصية/ }).click();
  await expect(page).toHaveURL(/\/privacy$/);
});
