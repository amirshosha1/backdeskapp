import type pg from "pg";

/** The throwaway cluster started by scripts/test-db.sh (no vitest imports: global setup uses this too). */
export const TEST_DB = "backdesk_test";

/** A user created before the migrations run: the migration must give them a profile and an org too. */
export const EARLY_USER_ID = "00000000-0000-4000-8000-00000000e001";

export function connection(user: string, database = TEST_DB): pg.ClientConfig {
  const host = process.env.TEST_PG_HOST;
  if (!host) throw new Error("Run the database tests with `pnpm test:db` (scripts/test-db.sh starts a throwaway Postgres).");
  return { host, port: Number(process.env.TEST_PG_PORT ?? 54329), user, database };
}
