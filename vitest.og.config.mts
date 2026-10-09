import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * `pnpm og:render`: draws the landing page's share images in Chromium
 * (scripts/og/render.og.ts) and writes public/og/landing-{ar,en}.png and
 * src/lib/landing/share-images.json. Not part of `pnpm test` and not run in
 * CI; the guard in src/lib/landing/share-images.test.ts says when to re-run
 * it. Vitest only because it already resolves the app's imports and JSX.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["scripts/og/render.og.ts"],
    testTimeout: 120_000,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
