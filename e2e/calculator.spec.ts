import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 1 acceptance: the `/demo` calculator, fed the Example A and B
 * inputs, shows the finance engine's results; it recalculates live as the
 * host types (Arabic-Indic digits included); and nothing typed leaves the
 * browser. The "بيانات تجريبية" banner stays.
 */

/** Text without the LRI/PDI isolates that wrap numbers inside sentences. */
const plain = async (page: Page, testId: string) =>
  ((await page.getByTestId(testId).textContent()) ?? "").replace(/[⁦-⁩]/g, "");

test.describe("live calculator", () => {
  test("Example B (default): NOI −2,847.00, break-even 19.38 nights / 64.6%, 18.99 without maintenance", async ({ page }) => {
    await page.goto("/demo/calculator");
    await expect(page.getByTestId("demo-banner")).toHaveText("بيانات تجريبية");
    await expect(page.getByTestId("hero-figure")).toContainText("-2,847.00");
    await expect(page.getByTestId("break-even-nights")).toHaveText("19.38");
    await expect(page.getByTestId("break-even-occupancy")).toHaveText("64.6%");
    expect(await plain(page, "break-even-excluding-maintenance")).toContain("18.99 ليلة (63.3%)");
    expect(await plain(page, "verdict")).toBe("بإشغال 60% الوحدة تخسر، والتعادل عند 64.6%");
  });

  test("Example A: owner net before depreciation 24,142.40 after an 8,010.60 commission", async ({ page }) => {
    await page.goto("/demo/calculator");
    await page.getByRole("radio", { name: "إدارة لمالك — وسط البلد" }).click();
    await expect(page.getByTestId("hero-figure")).toContainText("24,142.40");
    await expect(page.getByTestId("results")).toContainText("-8,010.60");
    await expect(page.getByTestId("results")).toContainText("+32,153.00");
  });

  test("recalculates as the host types, in Arabic-Indic digits too, without sending anything", async ({ page }) => {
    await page.goto("/demo/calculator");
    await page.waitForLoadState("networkidle");
    const sent: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "GET" || /[٠-٩]|1270|booked|nights/.test(request.url())) sent.push(`${request.method()} ${request.url()}`);
    });

    const nights = page.getByRole("textbox", { name: /الليالي المحجوزة/ });
    await nights.fill("٢٠");
    // 2,058.50 × 20 − 39,900 = 1,270.00
    await expect(page.getByTestId("hero-figure")).toContainText("1,270.00");
    expect(await plain(page, "verdict")).toBe("بإشغال 67% الوحدة تربح، والتعادل عند 64.6%");

    await nights.fill("20.5");
    await expect(page.getByTestId("stale-notice")).toBeVisible();
    await expect(nights).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("hero-figure")).toContainText("1,270.00");

    await page.waitForTimeout(500);
    expect(sent).toEqual([]);
  });

  test("every field of the managed model fits 360 px without horizontal scroll", async ({ page }) => {
    await page.goto("/demo/calculator");
    await page.getByRole("radio", { name: "إدارة لحساب مالك" }).click();
    await page.getByRole("combobox", { name: "أساس العمولة" }).selectOption("hybrid");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("works in English", async ({ page }) => {
    await page.goto("/en/demo/calculator");
    await expect(page.getByTestId("hero-figure")).toContainText("-2,847.00");
    expect(await plain(page, "verdict")).toBe("At 60% occupancy this unit loses money; break-even is 64.6%");
  });
});
