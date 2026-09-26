import { expect, test } from "@playwright/test";

/**
 * BUILD_PLAN.md Phase P acceptance: every screen is reachable from the
 * bottom navigation and renders correctly in Arabic RTL at 360 px, with no
 * horizontal scroll.
 */
const TABS = [
  { name: "الرئيسية", path: "/demo" },
  { name: "الحاسبة", path: "/demo/calculator" },
  { name: "الدليل", path: "/demo/guide" },
  { name: "الوحدات", path: "/demo/units" },
  { name: "المزيد", path: "/demo/more" },
];

test.describe("bottom navigation", () => {
  for (const tab of TABS) {
    test(`the ${tab.name} tab is reachable and lands on ${tab.path}`, async ({ page }) => {
      await page.goto("/demo");
      await page.getByRole("navigation").getByRole("link", { name: tab.name }).click();
      await expect(page).toHaveURL(new RegExp(`${tab.path}$`));
    });
  }

  test("every tab stays reachable in a single walkthrough", async ({ page }) => {
    await page.goto("/demo");
    for (const tab of TABS) {
      await page.getByRole("navigation").getByRole("link", { name: tab.name }).click();
      await expect(page).toHaveURL(new RegExp(`${tab.path}$`));
    }
  });
});

test.describe("deeper screens", () => {
  test("Units → owner statement", async ({ page }) => {
    await page.goto("/demo/units");
    await page.getByRole("link", { name: "عرض كشف الحساب" }).click();
    await expect(page).toHaveURL(/\/demo\/units\/downtown-cairo\/statement$/);
    await expect(page.getByRole("heading", { name: "كشف حساب المالك" })).toBeVisible();
  });

  test("Guide → stage 3 detail", async ({ page }) => {
    await page.goto("/demo/guide");
    await page.getByRole("link", { name: /الميزانية والفرش/ }).click();
    await expect(page).toHaveURL(/\/demo\/guide\/3$/);
  });

  test("Home → Add expense", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("link", { name: "إضافة مصروف" }).click();
    await expect(page).toHaveURL(/\/demo\/expenses\/new$/);
  });

  test("More → Pricing", async ({ page }) => {
    await page.goto("/demo/more");
    await page.getByRole("link", { name: "الأسعار والباقات" }).click();
    await expect(page).toHaveURL(/\/demo\/pricing$/);
  });
});

test.describe("360 px layout", () => {
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
    test(`${path} has no horizontal scroll at 360 px`, async ({ page }) => {
      await page.goto(path);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test(`${path} renders right-to-left`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    });
  }
});
