import { expect, test, type Page } from "@playwright/test";
import { FIRST_RUN_ANSWERS_KEY, GUEST_KEY, storageStateFor } from "./guest";

/**
 * P.2 slice 1 acceptance for the first-run flow, from an empty browser:
 * the app entry opens it; the order is right for each model; skip, back,
 * restart and re-run work; the visitor's unit survives a reload and the
 * flow never comes back; and the answers never leave the browser (not in a
 * request, not in the URL).
 */
test.use({ storageState: storageStateFor(null) });

const heading = (page: Page) => page.getByRole("heading", { level: 1 });

async function answerArbitrage(page: Page) {
  await page.getByRole("radio", { name: /أستأجرها وأعيد تأجيرها/ }).click();
  await expect(page).toHaveURL(/\?step=price$/);
  await page.getByRole("button", { name: "ارفع السعر 100" }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await expect(heading(page)).toHaveText("كم تدفع إيجارًا في الشهر؟");
  await page.getByRole("button", { name: "اعرض النتيجة" }).click();
}

test("a first visit to the app entry opens the flow; a returning one never does", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/demo\/start$/);
  await expect(page.getByTestId("device-banner")).toHaveText("محفوظ على هذا الجهاز");
  await page.getByRole("link", { name: "تخطَّ" }).click();
  await expect(page).toHaveURL(/\/demo\/units$/);
  await expect(page.getByRole("link", { name: /أضف شقتك الأولى/ })).toBeVisible();
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/demo$/);
  await page.reload();
  await expect(page).toHaveURL(/\/demo$/);
});

test("rental arbitrage: model → price → nights → rent → verdict → count, saved as the first unit", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" || /2600|35000|nights=|adr=/.test(request.url())) sent.push(`${request.method()} ${request.url()}`);
  });
  await page.goto("/demo/start");
  await answerArbitrage(page);
  await expect(page.getByTestId("verdict-word")).toHaveText("خسارة");
  await expect(page.getByText("تُحفظ هذه الشقة كأول وحدة لك على هذا الجهاز.")).toBeVisible();
  // Only the step is in the URL; the answers stay in this tab's sessionStorage.
  expect(page.url()).toMatch(/\/demo\/start\?step=verdict$/);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), FIRST_RUN_ANSWERS_KEY)).toContain('"adr":2600');

  await page.getByRole("button", { name: "كمّل" }).click();
  await page.getByRole("radio", { name: "شقة واحدة" }).click();
  await expect(page.getByTestId("plan-line")).toContainText("شقتك الأولى مجانية.");
  await page.getByRole("button", { name: "ادخل التطبيق" }).click();
  await expect(page).toHaveURL(/\/demo\/units$/);
  await expect(page.getByTestId("own-unit-card")).toContainText("شقتك الأولى");

  // A reload keeps the unit, and the app entry no longer opens the flow.
  await page.reload();
  await expect(page.getByTestId("own-unit-card")).toContainText("2,600");
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/demo$/);
  expect(sent).toEqual([]);
});

test("owner-operated skips the cost question (3 segments); managed asks the commission (4)", async ({ page }) => {
  await page.goto("/demo/start");
  await page.getByRole("radio", { name: /أملكها وأديرها/ }).click();
  await expect(page.getByTestId("first-run-progress").locator("span")).toHaveCount(3);
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "اعرض النتيجة" }).click();
  await expect(page).toHaveURL(/\?step=verdict$/);

  await page.getByRole("button", { name: "رجوع" }).click();
  await page.getByRole("button", { name: "رجوع" }).click();
  await page.getByRole("button", { name: "رجوع" }).click();
  await page.getByRole("radio", { name: /أديرها لحساب مالك/ }).click();
  await expect(page.getByTestId("first-run-progress").locator("span")).toHaveCount(4);
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await expect(heading(page)).toHaveText("كم نسبة عمولة الإدارة؟");
  await page.getByRole("button", { name: "اعرض النتيجة" }).click();
  await expect(page.getByTestId("verdict-word")).toHaveText("مكسب المالك");
});

test("a language switch mid-flow keeps the step and the answers", async ({ page }) => {
  await page.goto("/demo/start");
  await page.getByRole("radio", { name: /أستأجرها وأعيد تأجيرها/ }).click();
  await page.getByRole("button", { name: "ارفع السعر 100" }).click();
  await page.getByTestId("language-switch").click();
  await expect(page).toHaveURL(/\/en\/demo\/start\?step=price$/);
  await expect(page.getByTestId("dial-value")).toHaveText("2,600");
});

test("start over, then re-run from More: it asks first and replaces the unit only at the new verdict", async ({ page }) => {
  await page.goto("/demo/start");
  await answerArbitrage(page);
  await page.getByRole("button", { name: "ابدأ من جديد" }).click();
  await expect(heading(page)).toHaveText("ابدأ بشقة واحدة. كيف تشغّلها؟");

  await page.goto("/demo/more");
  await page.getByRole("button", { name: "أعد أسئلة البداية" }).click();
  await expect(page.getByRole("dialog")).toContainText("إعادة أسئلة البداية؟");
  await page.getByRole("button", { name: "ابدأ الأسئلة" }).click();
  await expect(page).toHaveURL(/\/demo\/start$/);
  // Skipping mid re-run keeps the saved numbers.
  await page.getByRole("radio", { name: /أملكها وأديرها/ }).click();
  await page.getByRole("link", { name: "تخطَّ" }).click();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), GUEST_KEY);
  expect(stored.units[0].form.operatingModel).toBe("rental_arbitrage");
  expect(stored.units[0].form.values.adr).toBe("2600");
});
