import { expect, test } from "@playwright/test";

/**
 * BUILD_PLAN.md Phase P acceptance: IBM Plex Sans Arabic, as served, shows
 * tabular numerals in money columns. The font's Western digits (the
 * default digit style, CLAUDE.md §7) all share one advance width in both
 * shipped weights — verified offline against the actual Google Fonts
 * files during planning — so this only needs to confirm the font is the
 * one actually applied to a money column, not remeasure the glyphs.
 */
test("a money figure on the home screen uses IBM Plex Sans Arabic", async ({ page }) => {
  await page.goto("/demo");
  const money = page.locator(".tabular-nums-money").first();
  await expect(money).toBeVisible();
  const fontFamily = await money.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily).toContain("IBM Plex Sans Arabic");
});
