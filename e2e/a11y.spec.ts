import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { resetGuestOnEveryLoad, seedFirstRunAnswers, withOwnUnit } from "./guest";
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

/** Screens whose content depends on the visitor's browser state. */
const STATEFUL = [
  { label: "/demo/units with the visitor's own unit", path: "/demo/units", own: true },
  { label: "/demo/calculator?tab=all with the visitor's own unit", path: "/demo/calculator?tab=all", own: true },
  { label: "/demo/start, verdict step", path: "/demo/start?step=verdict", own: false },
  { label: "/demo/start, apartment count step", path: "/demo/start?step=count", own: false },
];

for (const { label, path, own } of STATEFUL) {
  test(`${label}: no serious or critical accessibility violations`, async ({ page }) => {
    if (own) await resetGuestOnEveryLoad(page, withOwnUnit());
    else await seedFirstRunAnswers(page, { model: "rental_arbitrage", adr: 2500, nights: 18, rent: 35000, commission: 20 });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).include("body").analyze();
    const blocking = results.violations.filter((v) => BLOCKING_IMPACT.has(v.impact ?? ""));
    expect(blocking.map((v) => `${v.id} (${v.impact}): ${v.help}`), `serious/critical a11y violations on ${label}`).toEqual([]);
  });
}
