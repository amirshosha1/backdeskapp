import { expect, test, type Page } from "@playwright/test";

/**
 * P.2 slice 1 acceptance for the calculator: the summary leads with the net
 * profit after depreciation and the same-basis break-even (baseline 3BR:
 * -12,215.30 and 20.49 nights, while Example B remains in unit tests),
 * "صافي الربح بعد الإهلاك" and "التعادل شاملًا الإهلاك"); it fits one phone
 * screen above the bottom navigation; everything recalculates in the
 * browser and nothing typed leaves it. The top line says it is kept on this
 * device (accounts are off in this build).
 */

/** Text without the LRI/PDI isolates that wrap numbers inside sentences. */
const plain = async (page: Page, testId: string) => ((await page.getByTestId(testId).textContent()) ?? "").replace(/[⁦-⁩‎]/g, "");

test.describe("calculator", () => {
  test("baseline 3BR: net after depreciation -12,215.30, break-even 20.49 nights", async ({ page }) => {
    await page.goto("/demo/calculator");
    await expect(page.getByTestId("device-banner")).toHaveText("محفوظ على هذا الجهاز");
    await expect(page.getByTestId("hero-figure")).toContainText("-12,215.30");
    expect(await plain(page, "break-even-pill")).toBe("التعادل عند 20.49 ليلة");
    expect(await plain(page, "hero-sentence")).toBe("ينقصك 7 ليالٍ في الشهر لتغطي التكاليف.");
    expect(await plain(page, "summary-costs")).toContain("-49,875.30");
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
    for (let i = 0; i < 7; i++) await page.keyboard.press("ArrowLeft"); // RTL: left raises the value
    await expect(page.getByTestId("hero-figure")).not.toContainText("-12,215.30");
    await page.getByRole("button", { name: "ارفع سعر الليلة 100" }).click();
    await page.getByRole("tab", { name: "كل الأرقام" }).click();
    await expect(page).toHaveURL(/\?tab=all$/);
    await expect(page.getByRole("textbox", { name: /^متوسط سعر الليلة/ })).toHaveValue("2,550");
    await expect(page.getByRole("textbox", { name: /الليالي المحجوزة/ })).toHaveValue("21");
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
    await nights.fill("٢١");
    await expect(page.getByTestId("hero-figure")).not.toContainText("-12,215.30");

    await nights.fill("20.5");
    await expect(page.getByTestId("stale-notice")).toBeVisible();
    await expect(nights).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("hero-figure")).not.toContainText("-12,215.30");

    await page.waitForTimeout(500);
    expect(sent).toEqual([]);
  });

  test("tabbing into a formatted amount and typing replaces it instead of appending", async ({ page }) => {
    await page.goto("/demo/calculator?tab=all");
    const adr = page.getByRole("textbox", { name: /^متوسط سعر الليلة/ });
    await expect(adr).toHaveValue("2,450");
    // Tab focus selects the whole "2,450"; the field then shows the raw "2450", which must stay selected.
    await adr.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(adr).toBeFocused();
    await page.keyboard.type("3000");
    await expect(adr).toHaveValue("3000");
    // A click still places the caret, so a click then typing keeps editing the value.
    await page.getByTestId("hero-figure").click();
    await adr.click();
    await page.keyboard.press("End");
    await page.keyboard.type("5");
    await expect(adr).toHaveValue("30005");
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
    await expect(page.getByTestId("hero-figure")).toContainText("-12,215.30");
    expect(await plain(page, "hero-sentence")).toBe("You need 7 more nights to cover the costs.");
  });
});
