import { expect, test } from "@playwright/test";

/**
 * BUILD_PLAN.md Phase P acceptance: `/demo` responses carry noindex, via
 * both the response header (next.config.ts) and the page's robots meta
 * (demo/layout.tsx), in both locales.
 */
test.describe("/demo stays out of search results", () => {
  for (const path of ["/demo", "/en/demo", "/demo/calculator", "/en/demo/pricing"]) {
    test(`${path} sends X-Robots-Tag: noindex`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    });

    test(`${path} has a noindex robots meta tag`, async ({ page }) => {
      await page.goto(path);
      const content = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(content).toContain("noindex");
    });
  }

  test("the sample-data banner appears on every screen", async ({ page }) => {
    const paths = [
      "/demo",
      "/demo/calculator",
      "/demo/guide",
      "/demo/guide/3",
      "/demo/units",
      "/demo/units/downtown-cairo/statement",
      "/demo/expenses/new",
      "/demo/pricing",
      "/demo/more",
    ];
    for (const path of paths) {
      await page.goto(path);
      await expect(page.getByText("بيانات تجريبية")).toBeVisible();
    }
  });

  test("prices on the pricing page are labelled SAMPLE", async ({ page }) => {
    await page.goto("/demo/pricing");
    await expect(page.getByText("عيّنة").first()).toBeVisible();
  });
});
