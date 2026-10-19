import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { connection } from "./connection";

/**
 * docs/verify_after_migration.sql is what Amir runs in the Supabase SQL
 * editor after the migration lands. Here it runs against the local test
 * database: it must be one read-only statement, pass on a correct schema,
 * and FAIL the matching row when the schema is broken.
 */

const SQL = readFileSync(fileURLToPath(new URL("../../docs/verify_after_migration.sql", import.meta.url)), "utf8");
const FK_SQL = readFileSync(fileURLToPath(new URL("../../docs/verify_preserve_fk_set_null.sql", import.meta.url)), "utf8");

interface Row {
  check_name: string;
  result: "PASS" | "FAIL" | "INFO";
  detail: string;
}

const clients: pg.Client[] = [];
async function connect(user: string) {
  const client = new pg.Client(connection(user));
  await client.connect();
  clients.push(client);
  return client;
}
afterAll(async () => {
  await Promise.all(clients.map((c) => c.end()));
});

/** Runs the file with the extended query protocol, which rejects more than one statement. */
async function verify(client: pg.Client): Promise<Row[]> {
  const { rows } = await client.query<Row>({ text: SQL, values: [] });
  return rows;
}

/** Runs the checks after `breakIt`, inside a transaction that is rolled back. */
async function verifyBroken(breakIt: string): Promise<Row[]> {
  const client = await connect("supabase_admin");
  await client.query("begin");
  try {
    await client.query(breakIt);
    return await verify(client);
  } finally {
    await client.query("rollback");
  }
}

const failing = (rows: Row[]) => rows.filter((r) => r.result === "FAIL").map((r) => r.check_name);

describe("docs/verify_after_migration.sql", () => {
  it("is one statement that only reads: it runs in a read-only transaction, as postgres (the SQL editor's role)", async () => {
    const client = await connect("postgres");
    await client.query("begin transaction read only");
    const rows = await verify(client);
    await client.query("rollback");

    console.log(`\n${rows.map((r) => `${r.result.padEnd(4)}  ${r.check_name} — ${r.detail}`).join("\n")}\n`);
    expect(rows.length).toBeGreaterThanOrEqual(15);
    expect(failing(rows)).toEqual([]);
    expect(rows.filter((r) => r.result === "INFO").map((r) => r.check_name)).toEqual([
      "Data API exposed schemas (the private schema must not be listed)",
      "context",
    ]);
  });

  it("prints no email address or key", async () => {
    const client = await connect("postgres");
    const text = JSON.stringify(await verify(client));
    expect(text).not.toMatch(/@/);
    expect(text).not.toMatch(/sb_(publishable|secret)_|eyJ/);
  });

  it.each([
    ["RLS switched off on units", "alter table public.units disable row level security", "Row Level Security is on for every table in public"],
    ["a user could change their plan", "grant update (plan) on public.org_entitlements to authenticated", "signed-in users cannot write plan, limits, dates, ownership, ids or timestamps"],
    ["a user could set created_by", "grant insert (created_by) on public.units to authenticated", "signed-in users cannot write plan, limits, dates, ownership, ids or timestamps"],
    ["anon could read apartments", "grant select on public.units to anon", "anon (signed out) has no privilege on any table or column in public"],
    ["the app lost a grant it needs", "revoke update (name) on public.units from authenticated", "signed-in users can write the apartment and profile fields the app needs"],
    ["users could delete their entitlements", "grant delete on public.org_entitlements to authenticated", "signed-in users can delete only apartments (and never truncate, reference or trigger)"],
    ["the sign-up trigger is missing", "drop trigger on_auth_user_created on auth.users", "sign-up trigger on auth.users is installed and enabled"],
    ["the sign-up trigger is disabled", "alter table auth.users disable trigger on_auth_user_created", "sign-up trigger on auth.users is installed and enabled"],
    ["the limit trigger is missing", "drop trigger units_before_insert on public.units", "apartment-limit trigger on units is installed and enabled"],
    ["postgres cannot delete from auth.users", "revoke delete on auth.users from postgres", [
      "postgres holds DELETE on auth.users (needed by delete_my_account)",
      "the owner of delete_my_account can delete from auth.users",
    ]],
    ["anyone could run delete_my_account", "grant execute on function public.delete_my_account() to public", [
      "no function in public or private can be run by anon or by everyone (PUBLIC)",
      "delete_my_account: no arguments, SECURITY DEFINER, runnable by signed-in users only",
    ]],
    ["a function is runnable by anon", "grant execute on function private.member_org_ids() to anon", "no function in public or private can be run by anon or by everyone (PUBLIC)"],
    ["a definer function lost its search_path", "alter function private.handle_new_user() reset search_path", "every SECURITY DEFINER function pins an empty search_path"],
    ["a user has no org", "insert into auth.users (id) values ('00000000-0000-4000-8000-0000000000f1'); delete from public.org_members where user_id = '00000000-0000-4000-8000-0000000000f1'", "every user has a profile, an owner membership and an entitlements row"],
    ["the private schema is exposed", "alter role authenticator set pgrst.db_schemas = 'public, private'", "Data API exposed schemas (the private schema must not be listed)"],
  ])("FAILs when %s", async (_label, breakIt, checks) => {
    expect(failing(await verifyBroken(breakIt))).toEqual(Array.isArray(checks) ? checks : [checks]);
  });
});

describe("docs/verify_preserve_fk_set_null.sql", () => {
  it("is one read-only statement and passes against the installed migration", async () => {
    const client = await connect("postgres");
    await client.query("begin transaction read only");
    try {
      const { rows } = await client.query<Row>({ text: FK_SQL, values: [] });
      expect(rows).toHaveLength(6);
      expect(failing(rows)).toEqual([]);
      expect(JSON.stringify(rows)).not.toMatch(/@|sb_(publishable|secret)_|eyJ/);
    } finally {
      await client.query("rollback");
    }
  });

  it("fails if the update trigger loses the nested FK guard", async () => {
    const client = await connect("supabase_admin");
    await client.query("begin");
    try {
      await client.query(`create or replace function private.units_before_update()
        returns trigger language plpgsql set search_path = '' as $$
        begin new.created_by := old.created_by; return new; end; $$`);
      const { rows } = await client.query<Row>({ text: FK_SQL, values: [] });
      expect(failing(rows)).toEqual(["update trigger allows only a deleted author to be cleared by a nested update"]);
    } finally {
      await client.query("rollback");
    }
  });
});
