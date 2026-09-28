import { expect, test, type Locator } from "@playwright/test";

/**
 * CLAUDE.md §7 / BUILD_PLAN.md Phase P: add expense in ≤ 4 taps from Home,
 * not counting the amount digits. Typing the amount uses `fill`, which is
 * not counted; only `tap()` calls are, and there are exactly 3: Home's
 * "إضافة مصروف" pill, a category, and Save.
 */
test("add expense completes in 3 taps, excluding the amount digits", async ({ page }) => {
  let taps = 0;
  async function tap(locator: Locator) {
    await locator.click();
    taps += 1;
  }

  await page.goto("/demo");

  await tap(page.getByRole("link", { name: "إضافة مصروف" }));
  await expect(page).toHaveURL(/\/demo\/expenses\/new$/);

  await page.locator('input[inputmode="decimal"]').fill("500");

  await tap(page.getByRole("radio", { name: "التنظيف" }));
  await tap(page.getByRole("button", { name: "حفظ المصروف" }));

  await expect(page.getByRole("heading", { name: "تم حفظ المصروف (تجريبيًا)" })).toBeVisible();
  expect(taps).toBe(3);
});

test("Save explains what is missing instead of doing nothing", async ({ page }) => {
  await page.goto("/demo/expenses/new");
  const save = page.getByRole("button", { name: "حفظ المصروف" });
  // Scoped to main: Next.js keeps its own (empty) route-announcer alert in the body.
  const alert = page.getByRole("main").getByRole("alert");
  await expect(save).toBeEnabled();

  await save.click();
  await expect(alert).toHaveText("أدخل المبلغ أولًا");

  await page.locator('input[inputmode="decimal"]').fill("100");
  await save.click();
  await expect(alert).toHaveText("اختر فئة المصروف");

  await page.getByRole("radio", { name: "الصيانة" }).click();
  await save.click();
  await expect(page.getByRole("heading", { name: "تم حفظ المصروف (تجريبيًا)" })).toBeVisible();
});

test("the unit can be changed from a bottom sheet, and the date shows today", async ({ page }) => {
  await page.goto("/demo/expenses/new");
  await expect(page.getByTestId("expense-date")).toContainText("اليوم");
  await page.getByRole("button", { name: /الوحدة/ }).click();
  const sheet = page.getByRole("dialog", { name: "اختر الوحدة" });
  await sheet.getByRole("radio", { name: "شقة الشيخ زايد" }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: /الوحدة/ })).toContainText("شقة الشيخ زايد");
});
