import { expect, test } from "@playwright/test";
import { resetGuestOnEveryLoad, SEEN, withOwnUnit } from "./guest";

/**
 * Hotfix 2026-10-09: every screen that shows sample data carries its own
 * "مثال · أرقام توضيحية" chip at the top, independent of the top line; no
 * screen showing the person's own data does.
 */
const CHIP_AR = "مثال · أرقام توضيحية";
const CHIP_EN = "Example · illustrative numbers";

const SAMPLE_SCREENS = [
  "/demo/units",
  "/demo/units/downtown-cairo/statement",
  "/demo/guide",
  "/demo/guide/3",
  "/demo/expenses",
  "/demo/expenses/new",
  "/demo/calculator",
  "/demo/calculator?tab=all",
];

test.describe("sample screens are labelled (a visitor with no apartment)", () => {
  test.beforeEach(async ({ page }) => resetGuestOnEveryLoad(page, SEEN));

  for (const path of SAMPLE_SCREENS) {
    test(`${path} shows the example chip at the top, in Arabic and English`, async ({ page }) => {
      await page.goto(path);
      const chip = page.getByTestId("example-chip");
      await expect(chip).toHaveText(CHIP_AR);
      await expect(chip).toBeInViewport();
      await page.goto(`/en${path}`);
      await expect(page.getByTestId("example-chip")).toHaveText(CHIP_EN);
    });
  }

  test("the sample statement is titled as an example and has no PDF or owner-link action", async ({ page }) => {
    await page.goto("/demo/units/downtown-cairo/statement");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("مثال: كشف حساب مالك");
    await expect(page.getByText("تنزيل PDF")).toHaveCount(0);
    await expect(page.getByText("رابط للمالك")).toHaveCount(0);
  });

  test("Units heads the samples «أمثلة توضيحية (ليست بياناتك)»", async ({ page }) => {
    await page.goto("/demo/units");
    await expect(page.getByTestId("examples-heading")).toHaveText("أمثلة توضيحية (ليست بياناتك)");
  });
});

test.describe("the person's own data is never labelled an example", () => {
  test.beforeEach(async ({ page }) => resetGuestOnEveryLoad(page, withOwnUnit()));

  for (const path of ["/demo", "/demo/units", "/demo/calculator", "/demo/calculator?tab=all", "/demo/more", "/en/demo", "/en/demo/units"]) {
    test(`${path} (with the visitor's apartment) has no example chip`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId("hero-figure").or(page.getByTestId("units-hero-count")).or(page.getByTestId("more-language")).first()).toBeVisible();
      await expect(page.getByTestId("example-chip")).toHaveCount(0);
      await expect(page.getByText(CHIP_AR)).toHaveCount(0);
    });
  }
});
