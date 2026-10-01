import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ALL_SCREENS } from "./screens";

/**
 * BUILD_PLAN.md Phase P.1.1, item 11: an automated accessibility sweep of
 * every `/demo` screen at the 360 px mobile-first baseline. Fails the build
 * on any "serious" or "critical" violation; "minor"/"moderate" findings are
 * reported but don't block, since axe's own default ruleset includes some
 * best-practice checks that are noisy for a prototype.
 */
const BLOCKING_IMPACT = new Set(["serious", "critical"]);

for (const path of ALL_SCREENS) {
  test(`${path}: no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).include("body").analyze();
    const blocking = results.violations.filter((v) => BLOCKING_IMPACT.has(v.impact ?? ""));
    const describe = (v: (typeof results.violations)[number]) =>
      `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`;
    expect(blocking.map(describe), `serious/critical a11y violations on ${path}`).toEqual([]);
  });
}
