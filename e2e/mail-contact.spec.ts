import { expect, test } from "@playwright/test";

/**
 * Feedback and contact go by email to support@backdeskapp.com (no WhatsApp).
 * Runs in the main build (no environment variable is involved).
 */
const ADDRESS = "support@backdeskapp.com";

test("the «رأيك؟» link is a mailto with the Arabic subject and the screen path, nothing else", async ({ page }) => {
  await page.goto("/demo/units");
  const href = (await page.getByTestId("feedback-link").first().getAttribute("href"))!;
  expect(href.startsWith(`mailto:${ADDRESS}?`)).toBe(true);
  const query = new URLSearchParams(href.slice(href.indexOf("?") + 1));
  expect(query.get("subject")).toBe("ملاحظة على باك ديسك");
  expect(query.get("body")).toBe("ملاحظتي على شاشة /demo/units في النسخة التجريبية من باك ديسك:");
  expect([...query.keys()].sort()).toEqual(["body", "subject"]);
});

test("when no mail app opens, the address and a copy button appear, with a «تم النسخ» confirmation", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
  await page.goto("/demo/units");
  // A mailto: click does nothing in this browser, like an in-app browser without a mail app.
  await page.getByTestId("feedback-link").first().click();
  const sheet = page.getByTestId("mail-fallback");
  await expect(sheet).toBeVisible({ timeout: 4000 });
  await expect(sheet.getByRole("textbox")).toHaveValue(ADDRESS);
  await sheet.getByTestId("mail-copy").click();
  await expect(page.getByTestId("mail-copy-status")).toHaveText("تم النسخ");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(ADDRESS);
});

test("المزيد has the feedback row with the address, and the pricing contact is a mailto", async ({ page }) => {
  await page.goto("/demo/more");
  const row = page.getByTestId("more-feedback");
  await expect(row).toContainText(ADDRESS);
  expect(await row.getAttribute("href")).toMatch(/^mailto:support@backdeskapp\.com\?subject=/);
  await page.goto("/demo/pricing");
  const contact = page.getByTestId("custom-plans-contact");
  expect(await contact.getAttribute("href")).toMatch(/^mailto:support@backdeskapp\.com\?subject=/);
  expect((await contact.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
});
