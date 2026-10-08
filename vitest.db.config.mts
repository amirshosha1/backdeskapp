import { defineConfig } from "vitest/config";

/**
 * `pnpm test:db` only (scripts/test-db.sh starts the throwaway Postgres
 * these connect to). `pnpm test` never runs these: it needs no database.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    globalSetup: ["./tests/db/global-setup.ts"],
    // One database for the whole run; files must not interleave.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    reporters: ["verbose"],
  },
});
