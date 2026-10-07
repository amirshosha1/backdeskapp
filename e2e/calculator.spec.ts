import { expect, test, type Page } from "@playwright/test";

/**
 * P.2 slice 1 acceptance for the calculator: the summary leads with the net
 * profit after depreciation and the same-basis break-even (Example B:
 * -7,013.67 and 21.41 nights, the figures the old screen showed as
 * "صافي الربح بعد الإهلاك" and "التعادل شاملًا الإهلاك"); it fits one phone
 * screen above the bottom navigation; everything recalculates in the
 * browser and nothing typed leaves it. The "بيانات تجريبية" banner stays.
 */

/** Text without the LRI/PDI isolates that wrap numbers inside sentences. */
const plain = async (page: Page, testId: string) => ((await page.getByTestId(testId).textContent()) ?? "").replace(/[⁦-⁩‎]/g, "");

test.describe("calculator", () => {
  test("Example B: net after depreciation -7,013.67, break-even 21.41 nights", async ({ page }) => {
    await page.goto("/demo/calculator");
    await expect(page.getByTestId("demo-banner")).toHaveText("بيانات تجريبية");
    await expect(page.getByTestId("hero-figure")).toContainText("-7,013.67");
    expect(await plain(page, "break-even-pill")).toBe("التعادل عند 21.41 ليلة");
    expect(await plain(page, "hero-sentence")).toBe("ينقصك 4 ليالٍ في الشهر لتغطي التكاليف.");
    expect(await plain(page, "summary-costs")).toContain("-54,413.67");
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`the summary fits one screen above the bottom nav at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      for (const path of ["/demo/calculator", "/en/demo/calculator"]) {
        await page.goto(path);
        await expect(page.getByTestId("hero-sentence")).toBeVisible();
        const [scrollHeight, innerHeight] = await page.evaluate(() => [document.documentElement.scrollHeight, window.innerHeight]);
        expect(scrollHeight, path).toBeLessThanOrEqual(innerHeight);
      }
    });
  }

  test("the slider and steppers recalculate; the two tabs share one state", async ({ page }) => {
    await page.goto("/demo/calculator");
    const slider = page.getByRole("slider", { name: "الليالي المحجوزة في الشهر" });
    await slider.focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowLeft"); // RTL: left raises the value
    await expect(page.getByTestId("hero-figure")).toContainText("1,220.33");
    await page.getByRole("button", { name: "ارفع سعر الليلة 100" }).click();
    await page.getByRole("tab", { name: "كل الأرقام" }).click();
    await expect(page).toHaveURL(/\?tab=all$/);
    await expect(page.getByRole("textbox", { name: /^متوسط سعر الليلة/ })).toHaveValue("2,600");
    await expect(page.getByRole("textbox", { name: /الليالي المحجوزة/ })).toHaveValue("22");
  });

  test("Example A from the loaders: the owner's net after depreciation 19,975.73 after an 8,010.60 commission", async ({ page }) => {
    await page.goto("/demo/calculator?tab=all");
    await page.getByRole("radio", { name: "إدارة لمالك — وسط البلد" }).click();
    await expect(page.getByTestId("hero-figure")).toContainText("19,975.73");
    await expect(page.getByTestId("section-commission")).toContainText("-8,010.60");
  });

  test("recalculates as the host types, in Arabic-Indic digits too, without sending anything", async ({ page }) => {
    await page.goto("/demo/calculator?tab=all");
    await page.waitForLoadState("networkidle");
    const sent: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "GET" || /[٠-٩]|booked|nights|adr|rent/.test(request.url())) sent.push(`${request.method()} ${request.url()}`);
    });

    const nights = page.getByRole("textbox", { name: /الليالي المحجوزة/ });
    await nights.fill("٢٢");
    await expect(page.getByTestId("hero-figure")).toContainText("1,220.33");

    await nights.fill("20.5");
    await expect(page.getByTestId("stale-notice")).toBeVisible();
    await expect(nights).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("hero-figure")).toContainText("1,220.33");

    await page.waitForTimeout(500);
    expect(sent).toEqual([]);
  });

  test("every field of the managed model fits 360 px without horizontal scroll", async ({ page }) => {
    await page.goto("/demo/calculator?tab=all");
    await page.getByRole("radio", { name: "إدارة لمالك", exact: true }).click();
    await page.getByRole("button", { name: /^عمولة الإدارة/ }).click();
    await page.getByRole("combobox", { name: "أساس العمولة" }).selectOption("hybrid");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("works in English", async ({ page }) => {
    await page.goto("/en/demo/calculator");
    await expect(page.getByTestId("hero-figure")).toContainText("-7,013.67");
    expect(await plain(page, "hero-sentence")).toBe("You need 4 more nights to cover the costs.");
  });
});
