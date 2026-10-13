import { defineConfig, devices } from "@playwright/test";
import { storageStateFor } from "./e2e/guest";

/**
 * Anonymous counting (docs/ANALYTICS.md) switched on: NEXT_PUBLIC_POSTHOG_KEY
 * is inlined at build time, so this config builds and serves on its own port
 * with placeholder values, running only `e2e/analytics-env.spec.ts`. The
 * host is a `.invalid` name: nothing can reach PostHog from a test run. The
 * main build has no key, and its specs fail on any non-GET request.
 */
export const POSTHOG_HOST = "https://eu.i.posthog.invalid";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["**/analytics-env.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3030",
    trace: "retain-on-failure",
    // A first visit: nothing in the browser yet.
    storageState: storageStateFor(null),
  },
  projects: [
    {
      name: "mobile-ar",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 360, height: 800 },
        locale: "ar-EG",
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/opt/pw-browsers/chromium" },
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    env: { PORT: "3030", NEXT_PUBLIC_POSTHOG_KEY: "phc_e2e_placeholder", NEXT_PUBLIC_POSTHOG_HOST: POSTHOG_HOST, ANALYTICS_CONSENT_SECRET: "e2e-only-0123456789abcdef0123456789abcdef" },
    url: "http://127.0.0.1:3030",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
