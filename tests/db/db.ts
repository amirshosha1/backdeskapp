import { randomUUID } from "node:crypto";
import pg from "pg";
import { expect } from "vitest";
import { connection } from "./connection";

/**
 * Connections to the throwaway test cluster started by scripts/test-db.sh,
 * one per Supabase role that matters:
 *   - `authenticator`: what the Data API logs in as. Each request becomes
 *     `anon` or `authenticated` with the caller's JWT claims, exactly as
 *     PostgREST does it (`set local role` + `request.jwt.claims`).
 *   - `supabase_auth_admin`: what Supabase Auth writes users as.
 *   - `postgres`: the project owner (the dashboard and the SQL editor).
 *   - `supabase_admin`: the superuser, for looking around in tests.
 */

const pools = new Map<string, pg.Pool>();
function pool(user: string): pg.Pool {
  let p = pools.get(user);
  if (!p) {
    p = new pg.Pool({ ...connection(user), max: 4 });
    pools.set(user, p);
  }
  return p;
}

export async function closePools(): Promise<void> {
  await Promise.all([...pools.values()].map((p) => p.end()));
  pools.clear();
}

/** The superuser: reads anything, for assertions. */
export const admin = { query: (text: string, values?: unknown[]) => pool("supabase_admin").query(text, values) };
/** The project owner, as in the Supabase dashboard. */
export const owner = { query: (text: string, values?: unknown[]) => pool("postgres").query(text, values) };

export type Actor = { kind: "user"; id: string } | { kind: "anon" } | { kind: "signed-in-without-user" };
export const user = (id: string): Actor => ({ kind: "user", id });
export const ANON: Actor = { kind: "anon" };

/**
 * Runs `fn` as one Data API request: one transaction as `anon` or
 * `authenticated`, with the JWT claims PostgREST would set. Commits on
 * success (so 0-row updates really happened and can be checked afterwards),
 * rolls back on error.
 */
export async function as<T>(actor: Actor, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool("authenticator").connect();
  try {
    await client.query("begin");
    await client.query(actor.kind === "anon" ? "set local role anon" : "set local role authenticated");
    const claims =
      actor.kind === "user"
        ? { sub: actor.id, role: "authenticated", aud: "authenticated" }
        : { role: actor.kind === "anon" ? "anon" : "authenticated" };
    await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * An open request: a transaction as `actor` that stays open until `commit()`
 * or `rollback()`. For racing two requests deterministically.
 */
export async function openRequest(actor: Actor) {
  const client = await pool("authenticator").connect();
  await client.query("begin");
  await client.query(actor.kind === "anon" ? "set local role anon" : "set local role authenticated");
  const claims = actor.kind === "user" ? { sub: actor.id, role: "authenticated" } : { role: actor.kind === "anon" ? "anon" : "authenticated" };
  await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
  let ended = false;
  // Idempotent, so a test can always clean up in `finally`.
  const end = async (sql: "commit" | "rollback") => {
    if (ended) return;
    ended = true;
    try {
      await client.query(sql);
    } finally {
      client.release();
    }
  };
  return {
    query: (text: string, values?: unknown[]) => client.query(text, values),
    commit: () => end("commit"),
    rollback: () => end("rollback"),
  };
}

export const INSERT_UNIT = `insert into public.units (org_id, name, operating_model, calculator_inputs, engine_version)
  values ($1, $2, 'rental_arbitrage', $3, '1.0.0') returning id`;

/** One statement as `actor`. */
export function run(actor: Actor, text: string, values?: unknown[]) {
  return as(actor, (c) => c.query(text, values));
}

export interface Account {
  id: string;
  orgId: string;
}

/** Signs a user up the way Supabase Auth does: an insert into auth.users as supabase_auth_admin. */
export async function signUp(label: string): Promise<Account> {
  const id = randomUUID();
  const auth = pool("supabase_auth_admin");
  await auth.query(
    `insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
     values ($1, 'authenticated', 'authenticated', $2, '{"provider":"google","providers":["google"]}', '{}')`,
    [id, `${label}-${id.slice(0, 8)}@example.test`],
  );
  await auth.query(`insert into auth.identities (user_id, provider, identity_data) values ($1, 'google', '{}')`, [id]);
  await auth.query(`insert into auth.sessions (user_id) values ($1)`, [id]);
  const { rows } = await admin.query("select org_id from public.org_members where user_id = $1", [id]);
  if (rows.length !== 1) throw new Error(`sign-up did not create exactly one membership for ${label}`);
  return { id, orgId: rows[0].org_id as string };
}

/** A valid apartment as the app writes it (the calculator's rental-arbitrage example). */
export const CALCULATOR_INPUTS = {
  form: {
    operatingModel: "rental_arbitrage",
    values: {
      adr: "2500",
      bookedNights: "18",
      blockedNights: "0",
      avgLengthOfStay: "3",
      cleaningFeePerStay: "400",
      platformFeePercent: "15.5",
      utilities: "2500",
      internet: "600",
      compoundFees: "1000",
      cleaningCost: "350",
      consumables: "150",
      repairs: "800",
      setupCost: "250000",
      usefulLifeMonths: "60",
      rent: "35000",
      deposit: "70000",
      commissionPercent: "20",
      fixedFee: "0",
    },
    commission: { basis: "net_payout", hybridMode: "max", hybridBasis: "gross_revenue", includeCleaningFees: true },
  },
  assumed: ["platformFeePercent"],
};

/** Adds an apartment as `account` through the Data API path; returns its id. */
export async function addUnit(account: Account, name = "شقة 1"): Promise<string> {
  const { rows } = await run(
    user(account.id),
    INSERT_UNIT,
    [account.orgId, name, JSON.stringify(CALCULATOR_INPUTS)],
  );
  return rows[0].id as string;
}

export async function unitCount(orgId: string): Promise<number> {
  const { rows } = await admin.query("select count(*)::int as n from public.units where org_id = $1", [orgId]);
  return rows[0].n as number;
}

/** Asserts a Postgres error with this SQLSTATE (and, optionally, message fragment). */
export async function expectPgError(promise: Promise<unknown>, code: string, message?: string | RegExp): Promise<void> {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected Postgres error ${code}, but the statement succeeded`).toBeInstanceOf(Error);
  const err = caught as { code?: string; message?: string };
  expect(err.code, err.message).toBe(code);
  if (message !== undefined) expect(err.message).toMatch(message);
}

/** SQLSTATEs used in the assertions. */
export const DENIED = "42501"; // insufficient_privilege: missing grant, or a row-level security violation
export const CHECK_VIOLATION = "23514";
export const RAISED = "P0001"; // raise exception (the apartment limit)
