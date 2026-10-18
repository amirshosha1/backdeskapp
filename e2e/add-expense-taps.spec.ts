import { expect, test, type Locator } from "@playwright/test";
import { resetGuestOnEveryLoad, withOwnUnit } from "./guest";
import { ALL_SCREENS } from "./screens";

/**
 * The add-expense screen does not save yet, so since the 2026-10-09 hotfix
 * nothing links to it (Home's "إضافة مصروف", "إضافة دخل" and "تقرير الشهر"
 * are gone). The screen's code stays, reachable only by its URL, and keeps
 * its form tests until it saves for real; then the ≤ 4-taps-from-Home test
 * (CLAUDE.md §7) comes back.
 */
test("no screen links to the add-expense screen", async ({ page }) => {
  await resetGuestOnEveryLoad(page, withOwnUnit());
  for (const path of ALL_SCREENS.filter((p) => p !== "/demo/expenses/new")) {
    await page.goto(path);
    await expect(page.locator('a[href$="/demo/expenses/new"]'), path).toHaveCount(0);
    for (const name of ["إضافة مصروف", "إضافة دخل", "تقرير الشهر"]) {
      await expect(page.getByRole("link", { name }), path).toHaveCount(0);
      await expect(page.getByRole("button", { name }), path).toHaveCount(0);
    }
  }
});

test("by its URL, add expense still completes in 2 taps, excluding the amount digits", async ({ page }) => {
  let taps = 0;
  async function tap(locator: Locator) {
    await locator.click();
    taps += 1;
  }

  await page.goto("/demo/expenses/new");
  await page.locator('input[inputmode="decimal"]').fill("500");
  await tap(page.getByRole("radio", { name: "التنظيف" }));
  await tap(page.getByRole("button", { name: "حفظ المصروف" }));

  await expect(page.getByRole("heading", { name: "مثال فقط: لم يُحفظ المصروف" })).toBeVisible();
  expect(taps).toBe(2);
});

test("Save explains what is missing instead of doing nothing", async ({ page }) => {
  await page.goto("/demo/expenses/new");
  const save = page.getByRole("button", { name: "حفظ المصروف" });
  // Scoped to main: Next.js keeps its own (empty) route-announcer alert in the body.
  const alert = page.getByRole("main").getByRole("alert");
  await expect(save).toBeEnabled();

  await save.click();
  await expect(alert).toHaveText("أدخل المبلغ");

  await page.locator('input[inputmode="decimal"]').fill("100");
  await save.click();
  await expect(alert).toHaveText("اختر فئة المصروف");

  await page.getByRole("radio", { name: "الصيانة" }).click();
  await save.click();
  await expect(page.getByRole("heading", { name: "مثال فقط: لم يُحفظ المصروف" })).toBeVisible();
});

test("an invalid amount shows a distinct message, never the empty-amount one", async ({ page }) => {
  await page.goto("/demo/expenses/new");
  const save = page.getByRole("button", { name: "حفظ المصروف" });
  const alert = page.getByRole("main").getByRole("alert");

  await page.locator('input[inputmode="decimal"]').fill("12.5.5");
  await save.click();
  await expect(alert).toHaveText("المبلغ غير صحيح، اكتب أرقامًا فقط");
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
