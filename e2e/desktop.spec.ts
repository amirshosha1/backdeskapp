import { expect, test } from "@playwright/test";
import { TAB_SCREENS } from "./screens";

/**
 * BUILD_PLAN.md Phase P.1.1: on a desktop-sized viewport the mobile-first
 * shell stays ~480px wide and centred, with a neutral background outside
 * it — including the floating bottom nav, which is `position: fixed` and
 * would otherwise span the full viewport width.
 */
test.describe("desktop shell (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("the shell is ~480px wide and centred", async ({ page }) => {
    await page.goto("/demo");
    const shell = page.getByTestId("app-shell");
    const box = await shell.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(480);
    expect(box!.width).toBeGreaterThan(400);
    const expectedStart = (1280 - box!.width) / 2;
    expect(Math.abs(box!.x - expectedStart)).toBeLessThan(2);
  });

  for (const path of TAB_SCREENS) {
    test(`${path}: the floating nav stays within the shell's width, not the full viewport`, async ({ page }) => {
      await page.goto(path);
      const shell = await page.getByTestId("app-shell").boundingBox();
      const nav = await page.getByRole("navigation", { name: "التنقل الرئيسي" }).boundingBox();
      expect(shell).not.toBeNull();
      expect(nav).not.toBeNull();
      expect(nav!.width).toBeLessThanOrEqual(shell!.width);
      expect(nav!.x).toBeGreaterThanOrEqual(shell!.x - 1);
      expect(nav!.x + nav!.width).toBeLessThanOrEqual(shell!.x + shell!.width + 1);
    });
  }
});
