import { expect, test } from "@playwright/test";
import { resetGuestOnEveryLoad, withOwnUnit } from "./guest";

/**
 * Phase P acceptance: IBM Plex Sans Arabic, as served, shows tabular
 * numerals in money columns. The font's Western digits (the default digit
 * style, CLAUDE.md §7) share one advance width, so this only confirms the
 * font is the one applied to a money figure and that tabular numerals are
 * requested.
 */
test("the home figure uses IBM Plex Sans Arabic with tabular numerals", async ({ page }) => {
  await resetGuestOnEveryLoad(page, withOwnUnit());
  await page.goto("/demo");
  const money = page.locator(".tabular-nums-money").first();
  await expect(money).toBeVisible();
  const style = await money.evaluate((el) => {
    const computed = getComputedStyle(el);
    return { fontFamily: computed.fontFamily, numeric: computed.fontVariantNumeric };
  });
  expect(style.fontFamily).toContain("IBM Plex Sans Arabic");
  expect(style.numeric).toContain("tabular-nums");
});
