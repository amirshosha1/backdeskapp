import { expect, test, type Page } from "@playwright/test";
import { resetGuestOnEveryLoad, SEEN, withOwnUnit, type GuestState } from "./guest";
import { ALL_SCREENS } from "./screens";

/**
 * Phase P.1 tap audit: no silent taps. On every screen, every visible
 * button and link either navigates, changes the screen (a toast, a sheet,
 * a toggled state) or opens an external link. Nothing is disabled.
 *
 * The screen is reloaded before each tap so every element is tested from
 * the same starting state — including the visitor's browser storage, which
 * is re-seeded before every load (a tap that saves something must not leak
 * into the next reload). The current tab, an already-selected option and
 * the selected calculator tab are exempt: tapping them is a no-op by design.
 *
 * Screens that change with the visitor's own unit are crawled in both states.
 */
const CRAWLS: { path: string; state: GuestState; label: string }[] = [
  ...ALL_SCREENS.map((path) => ({ path, state: SEEN, label: path })),
  ...["/demo/units", "/demo/calculator", "/demo/calculator?tab=all", "/demo/more"].map((path) => ({
    path,
    state: withOwnUnit(),
    label: `${path} (with the visitor's own unit)`,
  })),
];
const TAPPABLE = 'a[href], button, [role="button"], [role="radio"], [role="link"]';

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  let previous = "";
  for (let i = 0; i < 20; i++) {
    const current = await page.evaluate(() => document.body.innerHTML);
    if (current === previous) return;
    previous = current;
    await page.waitForTimeout(150);
  }
}

async function visibleTappables(page: Page) {
  return page.locator(TAPPABLE).evaluateAll((elements) =>
    elements
      .map((el, index) => ({ el, index }))
      .filter(({ el }) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
      })
      .map(({ el, index }) => ({
        index,
        label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
        exempt:
          el.getAttribute("aria-current") === "page" ||
          el.getAttribute("aria-checked") === "true" ||
          el.getAttribute("aria-selected") === "true",
        external: el instanceof HTMLAnchorElement && /^https?:/.test(el.getAttribute("href") ?? ""),
        disabled: (el as HTMLButtonElement).disabled === true || el.getAttribute("aria-disabled") === "true",
      })),
  );
}

for (const { path, state, label } of CRAWLS) {
  test(`${label}: every tap does something`, async ({ page }) => {
    test.setTimeout(240_000);
    await resetGuestOnEveryLoad(page, state);
    await page.goto(path);
    await settle(page);
    const elements = await visibleTappables(page);
    expect(elements.length).toBeGreaterThan(0);

    const silent: string[] = [];
    for (const element of elements) {
      expect(element.disabled, `"${element.label}" is disabled`).toBe(false);
      if (element.exempt || element.external) continue;

      await page.goto(path);
      await settle(page);
      const before = { url: page.url(), html: await page.evaluate(() => document.body.innerHTML) };
      await page.locator(TAPPABLE).nth(element.index).click();

      const reacted = await expect
        .poll(
          async () =>
            page.url() !== before.url ||
            (await page.evaluate(() => document.body.innerHTML)) !== before.html,
          { timeout: 3_000 },
        )
        .toBe(true)
        .then(() => true)
        .catch(() => false);
      if (!reacted) silent.push(element.label);
    }
    expect(silent, `silent taps on ${path}`).toEqual([]);
  });
}
