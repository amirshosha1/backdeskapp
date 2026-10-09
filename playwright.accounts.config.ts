import { defineConfig, devices } from "@playwright/test";
import { SEEN, storageStateFor } from "./e2e/guest";

/**
 * Accounts switched on. The two Supabase values are inlined at build time,
 * so this builds with placeholders and serves on its own port; the main
 * suite's build has none, so accounts are off there. The placeholder host
 * (`.invalid`) never resolves: the browser's calls to it are intercepted by
 * the spec, and the server's sign-in exchange fails fast, which is exactly
 * the failure path. Runs only e2e/accounts-env.spec.ts.
 */
export const SUPABASE_URL = "https://e2e-ref.supabase.invalid";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["**/accounts-env.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3020",
    trace: "retain-on-failure",
    storageState: storageStateFor(SEEN, "http://127.0.0.1:3020"),
  },
  projects: [
    {
      name: "mobile-ar",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 360, height: 800 },
        locale: "ar-EG",
        launchOptions: { executablePath: "/opt/pw-browsers/chromium" },
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    env: { PORT: "3020", NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_e2e_placeholder" },
    url: "http://127.0.0.1:3020",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
