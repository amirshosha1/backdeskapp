import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**"],
    css: false,
    coverage: {
      provider: "v8",
      // BUILD_PLAN.md Phase 1 acceptance: line and branch coverage ≥ 95%
      // for the finance engine. `pnpm test:coverage` enforces it.
      include: ["src/lib/finance/**/*.ts"],
      exclude: ["src/lib/finance/**/*.test.ts"],
      reporter: ["text", "text-summary"],
      thresholds: {
        lines: 95,
        branches: 95,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The real `server-only` throws outside an RSC build; see the stub.
      "server-only": fileURLToPath(new URL("./src/test/stubs/server-only.ts", import.meta.url)),
    },
  },
});
