import { expect, test, type Locator } from "@playwright/test";

/**
 * BUILD_PLAN.md Phase P/5 acceptance: add expense in ≤ 4 taps, not
 * counting the amount digits. Typing the amount uses `fill`, which is not
 * counted below — only `click()` calls are, and there are exactly 3: the
 * Home "Add expense" button, a category chip, and Save.
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

  // Typing the amount is explicitly excluded from the tap budget.
  await page.locator('input[inputmode="decimal"]').fill("500");

  await tap(page.getByRole("button", { name: "التنظيف" }));
  await tap(page.getByRole("button", { name: "حفظ" }));

  await expect(page.getByText("تم الحفظ (تجريبيًا)")).toBeVisible();
  expect(taps).toBe(3);
  expect(taps).toBeLessThanOrEqual(4);
});

test("Save is disabled until an amount and a category are both set", async ({ page }) => {
  await page.goto("/demo/expenses/new");
  const save = page.getByRole("button", { name: "حفظ" });
  await expect(save).toBeDisabled();

  await page.locator('input[inputmode="decimal"]').fill("100");
  await expect(save).toBeDisabled();

  await page.getByRole("button", { name: "الصيانة" }).click();
  await expect(save).toBeEnabled();
});
