import { defineConfig, devices } from "@playwright/test";

/**
 * `NEXT_PUBLIC_PREORDER_URL` (and `NEXT_PUBLIC_FEEDBACK_WHATSAPP`) are
 * inlined into the client bundle at build time, so verifying the pre-order
 * button's real `href`/`target`/`rel` needs a build with them set — the
 * main suite's build (playwright.config.ts) has neither, so every pre-order
 * button there shows the "opens soon" toast instead. This config builds and
 * serves on a separate port with the vars set, running only
 * `e2e/preorder-env.spec.ts` (BUILD_PLAN.md Phase P.1.1, item 13).
 */
const PREORDER_URL = "https://wa.me/201234567890";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["**/preorder-env.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3010",
    trace: "retain-on-failure",
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
    env: { PORT: "3010", NEXT_PUBLIC_PREORDER_URL: PREORDER_URL },
    url: "http://127.0.0.1:3010",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

export { PREORDER_URL };
