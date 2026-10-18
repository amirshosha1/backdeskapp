import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ALL_SCREENS, PUBLIC_PAGES, TAB_SCREENS } from "./screens";

/**
 * Private beta gate (docs/STABILIZATION_BETA_GATE.md, "UX regression"): every
 * public page and /demo screen at small mobile, tablet and desktop widths, in
 * Arabic (RTL) and English (LTR). Nothing scrolls sideways, the floating
 * bottom navigation never covers the end of a screen, and English pages pass
 * the same accessibility bar as the Arabic sweep in e2e/a11y.spec.ts.
 */
const VIEWPORTS = [
  { name: "360", width: 360, height: 800 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];
const LOCALES = [
  { name: "ar", prefix: "", nav: "التنقل الرئيسي" },
  { name: "en", prefix: "/en", nav: "Main navigation" },
];
const localized = (prefix: string, path: string) => (prefix && path === "/" ? prefix : `${prefix}${path}`);
const SCREENS = [...new Set([...PUBLIC_PAGES.filter((p) => p !== "/en"), ...ALL_SCREENS])];

for (const viewport of VIEWPORTS) {
  for (const locale of LOCALES) {
    test.describe(`${viewport.name}px · ${locale.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const path of SCREENS) {
        const url = localized(locale.prefix, path);
        test(`${url}: no horizontal scroll`, async ({ page }) => {
          await page.goto(url);
          await page.waitForLoadState("networkidle");
          const [scrollWidth, clientWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
          expect(scrollWidth, `${url} is wider than the ${viewport.width}px viewport`).toBeLessThanOrEqual(clientWidth);
        });
      }

      for (const path of TAB_SCREENS) {
        const url = localized(locale.prefix, path);
        test(`${url}: the bottom navigation never covers the end of the screen`, async ({ page }) => {
          await page.goto(url);
          await page.waitForLoadState("networkidle");
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          const nav = await page.getByRole("navigation", { name: locale.nav }).boundingBox();
          expect(nav).not.toBeNull();
          // The lowest visible piece of content inside <main>, in viewport coordinates.
          const lowest = await page.evaluate(() => {
            let bottom = 0;
            for (const el of Array.from(document.querySelectorAll("main *"))) {
              const r = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              if (r.width === 0 || r.height === 0 || style.visibility === "hidden" || style.position === "fixed") continue;
              if (!el.textContent?.trim() && !el.matches("img, svg, input, button, a, [role=img]")) continue;
              bottom = Math.max(bottom, r.bottom);
            }
            return bottom;
          });
          expect(lowest, `${url}: content ends under the bottom navigation`).toBeLessThanOrEqual(nav!.y + 1);
        });
      }
    });
  }
}

test.describe("1440px · en: accessibility", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  for (const path of SCREENS) {
    const url = localized("/en", path);
    test(`${url}: no serious or critical accessibility violations`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).include("body").analyze();
      const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(blocking.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
