import { expect, test } from "@playwright/test";
import { ALL_SCREENS } from "./screens";

/**
 * Phase P acceptance: `/demo` responses carry noindex, via both the
 * response header (next.config.ts) and the page's robots meta
 * (demo/layout.tsx), in both locales; every screen has the same top line
 * (never "بيانات تجريبية", since the 2026-10-09 hotfix), and every price is
 * labelled as a sample.
 */
test.describe("/demo stays out of search results", () => {
  for (const path of ["/demo", "/en/demo", "/demo/expenses", "/en/demo/pricing"]) {
    test(`${path} sends X-Robots-Tag and a robots meta tag with noindex`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
      const content = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(content).toContain("noindex");
    });
  }
});

test.describe("one top line, and prices labelled", () => {
  test('every screen says "محفوظ على هذا الجهاز" (accounts off), never "بيانات تجريبية"', async ({ page }) => {
    for (const path of ALL_SCREENS) {
      await page.goto(path);
      await expect(page.getByTestId("device-banner"), path).toHaveText("محفوظ على هذا الجهاز");
      await expect(page.getByText("بيانات تجريبية", { exact: true }), path).toHaveCount(0);
    }
  });

  test("prices on the pricing page are labelled as samples", async ({ page }) => {
    await page.goto("/demo/pricing");
    await expect(page.getByText("تجريبي", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("كل الأسعار تجريبية وستتحدد قبل الإطلاق.")).toBeVisible();
  });
});
