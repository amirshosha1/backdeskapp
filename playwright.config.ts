import { defineConfig, devices } from "@playwright/test";

/**
 * Phase P e2e coverage (BUILD_PLAN.md §5, Phase P acceptance): navigation
 * reachability, the "بيانات تجريبية" banner, the 360 px layout with no
 * horizontal scroll, the `/demo` noindex header, and the add-expense tap
 * count. Runs against Chromium only — the pre-installed browser in this
 * environment, and the one that matches the mid-range Android target.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
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
