import { expect, test } from "@playwright/test";

/**
 * Phase P.1: the Arabic/English switch. The URL is the only source of the
 * locale (no Accept-Language detection, no cookie), so a shared link always
 * opens in the language it was shared in, and switching keeps the screen.
 */
test("switching language keeps the current screen, both ways", async ({ page }) => {
  await page.goto("/demo/units");
  await page.getByTestId("language-switch").click();
  await expect(page).toHaveURL(/\/en\/demo\/units$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Units");

  await page.getByTestId("language-switch").click();
  await expect(page).toHaveURL(/\/demo\/units$/);
  await expect(page).not.toHaveURL(/\/en\//);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("the language row on More switches too", async ({ page }) => {
  await page.goto("/demo/more");
  await page.getByTestId("more-language").click();
  await expect(page).toHaveURL(/\/en\/demo\/more$/);
});

test.describe("an English browser", () => {
  test.use({ locale: "en-US", extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" } });

  test("still lands on Arabic at /demo (no automatic redirect)", async ({ page }) => {
    await page.goto("/demo");
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });
});

test.describe("localized 404", () => {
  test("an unknown /demo path shows the Arabic not-found screen with a way home", async ({ page }) => {
    const response = await page.goto("/demo/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "لم نجد هذه الصفحة" })).toBeVisible();
    await page.getByRole("link", { name: "العودة للرئيسية" }).click();
    await expect(page).toHaveURL(/\/demo$/);
  });

  test("a statement that doesn't exist in the prototype is a 404, not a crash", async ({ page }) => {
    const response = await page.goto("/demo/units/rehab/statement");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "لم نجد هذه الصفحة" })).toBeVisible();
  });

  test("the English 404 is in English", async ({ page }) => {
    const response = await page.goto("/en/demo/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We couldn't find this page" })).toBeVisible();
  });
});
