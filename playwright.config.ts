import { defineConfig, devices } from "@playwright/test";
import { SEEN, storageStateFor } from "./e2e/guest";

/**
 * Phase P / P.1 e2e coverage (BUILD_PLAN.md §5): navigation reachability,
 * the "بيانات تجريبية" banner, the 360 px layout with no horizontal scroll
 * and no content hidden under the nav, the `/demo` noindex header, the
 * add-expense tap count, the language switch and 404s, and the
 * no-silent-taps crawler. Runs against Chromium only — the pre-installed browser in this
 * environment, and the one that matches the mid-range Android target.
 */
export default defineConfig({
  testDir: "./e2e",
  // NEXT_PUBLIC_PREORDER_URL is inlined at build time, so exercising it for
  // real needs its own build (playwright.preorder.config.ts) with the
  // env var set — this default build has none.
  // The same goes for accounts: the Supabase values are inlined at build
  // time, so e2e/accounts-env.spec.ts has its own build
  // (playwright.accounts.config.ts). This build has none: accounts are off.
  // Analytics too (playwright.analytics.config.ts): this build has no
  // NEXT_PUBLIC_POSTHOG_KEY, so nothing is ever sent.
  testIgnore: ["**/preorder-env.spec.ts", "**/accounts-env.spec.ts", "**/analytics-env.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // A returning visitor by default: the first-run flow is already seen, so
    // the app entry shows Home. e2e/first-run.spec.ts starts from an empty browser.
    storageState: storageStateFor(SEEN),
  },
  projects: [
    {
      name: "mobile-ar",
      use: {
        ...devices["Pixel 7"],
        // CLAUDE.md §7: 360 px is the mobile-first baseline, checked in RTL.
        viewport: { width: 360, height: 800 },
        locale: "ar-EG",
        // This environment's pinned Chromium build (see the repo's session
        // README for the agent proxy) doesn't include the headless-shell
        // variant Playwright defaults to; the full browser works headless too.
        launchOptions: { executablePath: "/opt/pw-browsers/chromium" },
      },
    },
  ],
  webServer: {
    // `pnpm start -- -p 3000` mis-forwards its args under pnpm 9 (the `--`
    // itself reaches `next start`); PORT is next's own env var instead.
    command: "pnpm build && pnpm start",
    env: { PORT: "3000" },
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
