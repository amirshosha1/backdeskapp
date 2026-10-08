import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { connection, EARLY_USER_ID, TEST_DB } from "./connection";

/**
 * Builds the test database once per run: the Supabase stand-in
 * (shim.sql), one user who "signed up" before any migration (the migration
 * must backfill them), then every file in supabase/migrations/ in order, as
 * `postgres` — not a superuser, like on Supabase — each in a transaction and
 * recorded in supabase_migrations.schema_migrations, like the Supabase CLI.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

async function withClient(config: pg.ClientConfig, fn: (c: pg.Client) => Promise<void>) {
  const client = new pg.Client(config);
  await client.connect();
  try {
    await fn(client);
  } finally {
    await client.end();
  }
}

export default async function setup() {
  await withClient(connection("supabase_admin", "postgres"), async (c) => {
    await c.query(`drop database if exists ${TEST_DB}`);
    await c.query(`create database ${TEST_DB}`);
  });

  await withClient(connection("supabase_admin"), async (c) => {
    await c.query(readFileSync(path.join(ROOT, "tests/db/shim.sql"), "utf8"));
    await c.query(`insert into auth.users (id, aud, role, email) values ($1, 'authenticated', 'authenticated', 'early@example.test')`, [
      EARLY_USER_ID,
    ]);
  });

  const dir = path.join(ROOT, "supabase/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  await withClient(connection("postgres"), async (c) => {
    for (const file of files) {
      const [version, ...rest] = file.replace(/\.sql$/, "").split("_");
      await c.query("begin");
      try {
        await c.query(readFileSync(path.join(dir, file), "utf8"));
        await c.query("insert into supabase_migrations.schema_migrations (version, name) values ($1, $2)", [version, rest.join("_")]);
        await c.query("commit");
      } catch (error) {
        await c.query("rollback");
        throw new Error(`migration ${file} failed: ${(error as Error).message}`);
      }
    }
  });
}
