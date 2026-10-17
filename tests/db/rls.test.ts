import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EARLY_USER_ID } from "./connection";
import {
  addUnit,
  admin,
  ANON,
  CALCULATOR_INPUTS,
  CHECK_VIOLATION,
  closePools,
  DENIED,
  expectPgError,
  INSERT_UNIT,
  openRequest,
  owner,
  RAISED,
  run,
  signUp,
  unitCount,
  user,
  type Account,
} from "./db";

/**
 * Proof for Batch 3's security requirements (docs/BUILD_PLAN.md, Phase 0b
 * slice 1). Every statement runs the way the Data API would run it for a
 * signed-in user (`authenticated` + the user's JWT claims) or a signed-out
 * visitor (`anon`), against the real migration, on a cluster where
 * `postgres` is not a superuser.
 *
 * Two kinds of "no" are asserted, because Postgres says no in two ways:
 *   - a missing privilege, or a row the policy forbids writing: the
 *     statement fails with 42501;
 *   - a row the policy hides: the statement succeeds but sees or changes
 *     0 rows, so the tests also check that the other user's row is untouched.
 */

const TABLES = ["orgs", "org_members", "profiles", "org_entitlements", "units"] as const;

afterAll(closePools);

describe("sign-up (the trigger on auth.users, run as supabase_auth_admin)", () => {
  it("creates a profile, a personal org, an owner membership and a free entitlements row with 5 apartments", async () => {
    const a = await signUp("signup");
    const { rows } = await admin.query(
      `select p.apartment_count_answer, o.type, o.default_currency, o.timezone, m.role,
              e.plan, e.max_units, e.trial_started_at, e.trial_ends_at, e.paid_until, e.is_founding
         from public.profiles p
         join public.org_members m on m.user_id = p.user_id
         join public.orgs o on o.id = m.org_id
         join public.org_entitlements e on e.org_id = o.id
        where p.user_id = $1`,
      [a.id],
    );
    expect(rows).toEqual([
      {
        apartment_count_answer: null,
        type: "individual",
        default_currency: "EGP",
        timezone: "Africa/Cairo",
        role: "owner",
        plan: "free",
        max_units: 5,
        trial_started_at: null,
        trial_ends_at: null,
        paid_until: null,
        is_founding: false,
      },
    ]);
  });

  it("gave a user who signed up before the migration the same rows (backfill)", async () => {
    const { rows } = await admin.query(
      `select (select count(*) from public.profiles where user_id = $1)::int as profiles,
              (select count(*) from public.org_members where user_id = $1 and role = 'owner')::int as memberships,
              (select count(*) from public.org_entitlements e join public.org_members m on m.org_id = e.org_id where m.user_id = $1)::int as entitlements`,
      [EARLY_USER_ID],
    );
    expect(rows[0]).toEqual({ profiles: 1, memberships: 1, entitlements: 1 });
  });
});

describe("user B cannot read, change or delete user A's apartment", () => {
  let a: Account;
  let b: Account;
  let unitId: string;
  let before: unknown;

  beforeAll(async () => {
    a = await signUp("user-a");
    b = await signUp("user-b");
    await addUnit(b, "شقة B");
    unitId = await addUnit(a, "شقة A");
    before = (await admin.query("select * from public.units where id = $1", [unitId])).rows[0];
  });

  it("A can read the apartment A created", async () => {
    const { rows } = await run(user(a.id), "select id, name from public.units where id = $1", [unitId]);
    expect(rows).toEqual([{ id: unitId, name: "شقة A" }]);
  });

  it("B reads it: 0 rows", async () => {
    const { rowCount } = await run(user(b.id), "select * from public.units where id = $1", [unitId]);
    expect(rowCount).toBe(0);
    const all = await run(user(b.id), "select org_id from public.units");
    expect(all.rows.every((r) => r.org_id === b.orgId)).toBe(true);
  });

  it("B updates it: 0 rows changed, and A's apartment is unchanged", async () => {
    const { rowCount } = await run(user(b.id), "update public.units set name = 'hacked', calculator_inputs = '{}' where id = $1", [unitId]);
    expect(rowCount).toBe(0);
    expect((await admin.query("select * from public.units where id = $1", [unitId])).rows[0]).toEqual(before);
  });

  it("B deletes it: 0 rows deleted, and A's apartment is still there", async () => {
    const { rowCount } = await run(user(b.id), "delete from public.units where id = $1", [unitId]);
    expect(rowCount).toBe(0);
    expect((await admin.query("select * from public.units where id = $1", [unitId])).rows[0]).toEqual(before);
  });

  it("B adds an apartment to A's org: rejected (42501)", async () => {
    await expectPgError(
      run(
        user(b.id),
        `insert into public.units (org_id, name, operating_model, calculator_inputs, engine_version)
         values ($1, 'intruder', 'owner_operated', $2, '1.0.0')`,
        [a.orgId, JSON.stringify(CALCULATOR_INPUTS)],
      ),
      DENIED,
      /row-level security/,
    );
    expect(await unitCount(a.orgId)).toBe(1);
  });

  it("B moves B's own apartment into A's org: rejected (42501, no UPDATE privilege on org_id)", async () => {
    await expectPgError(run(user(b.id), "update public.units set org_id = $1 where org_id = $2", [a.orgId, b.orgId]), DENIED);
    expect(await unitCount(a.orgId)).toBe(1);
  });

  it("B reads A's profile, org, membership and entitlements: 0 rows each", async () => {
    const queries = [
      ["select * from public.profiles where user_id = $1", a.id],
      ["select * from public.orgs where id = $1", a.orgId],
      ["select * from public.org_members where user_id = $1 or org_id = $2", a.id, a.orgId],
      ["select * from public.org_entitlements where org_id = $1", a.orgId],
    ] as const;
    for (const [text, ...values] of queries) {
      const { rowCount } = await run(user(b.id), text, [...values]);
      expect(rowCount, text).toBe(0);
    }
  });

  it("B changes A's answer on A's profile: 0 rows changed", async () => {
    const { rowCount } = await run(user(b.id), "update public.profiles set apartment_count_answer = '10+' where user_id = $1", [a.id]);
    expect(rowCount).toBe(0);
    expect((await admin.query("select apartment_count_answer from public.profiles where user_id = $1", [a.id])).rows[0]).toEqual({
      apartment_count_answer: null,
    });
  });
});

describe("no user can raise their own plan, limit or dates (org_entitlements is read-only)", () => {
  let b: Account;
  beforeAll(async () => {
    b = await signUp("plan");
  });

  it("B can read B's own entitlements row (free, 5 apartments)", async () => {
    const { rows } = await run(user(b.id), "select plan, max_units from public.org_entitlements");
    expect(rows).toEqual([{ plan: "free", max_units: 5 }]);
  });

  it.each([
    "plan = 'pro'",
    "max_units = 100",
    "paid_until = now() + interval '1 year'",
    "trial_started_at = now()",
    "trial_ends_at = now() + interval '1 year'",
    "is_founding = true",
    "org_id = gen_random_uuid()",
    "created_at = now() - interval '1 year'",
    "updated_at = now()",
  ])("B: update B's own row, set %s → permission denied (42501)", async (assignment) => {
    await expectPgError(run(user(b.id), `update public.org_entitlements set ${assignment} where org_id = $1`, [b.orgId]), DENIED);
  });

  it("B: insert an entitlements row → permission denied (42501)", async () => {
    await expectPgError(run(user(b.id), "insert into public.org_entitlements (org_id, plan, max_units) values ($1, 'pro', 100)", [b.orgId]), DENIED);
  });

  it("B: delete B's own entitlements row → permission denied (42501)", async () => {
    await expectPgError(run(user(b.id), "delete from public.org_entitlements where org_id = $1", [b.orgId]), DENIED);
  });

  it("after every attempt, B is still on free with 5 apartments", async () => {
    const { rows } = await admin.query("select plan, max_units, paid_until, trial_ends_at, is_founding from public.org_entitlements where org_id = $1", [
      b.orgId,
    ]);
    expect(rows).toEqual([{ plan: "free", max_units: 5, paid_until: null, trial_ends_at: null, is_founding: false }]);
  });

  it("B: change B's own role, join A's org, or leave B's org → permission denied (42501)", async () => {
    const a = await signUp("other-org");
    await expectPgError(run(user(b.id), "update public.org_members set role = 'admin' where user_id = $1", [b.id]), DENIED);
    await expectPgError(run(user(b.id), "insert into public.org_members (org_id, user_id, role) values ($1, $2, 'owner')", [a.orgId, b.id]), DENIED);
    await expectPgError(run(user(b.id), "delete from public.org_members where user_id = $1", [b.id]), DENIED);
  });

  it("B: change B's org (currency, name, type), create an org, or delete B's org → permission denied (42501)", async () => {
    await expectPgError(run(user(b.id), "update public.orgs set default_currency = 'USD' where id = $1", [b.orgId]), DENIED);
    await expectPgError(run(user(b.id), "update public.orgs set name = 'x' where id = $1", [b.orgId]), DENIED);
    await expectPgError(run(user(b.id), "update public.orgs set type = 'company' where id = $1", [b.orgId]), DENIED);
    await expectPgError(run(user(b.id), "insert into public.orgs default values"), DENIED);
    await expectPgError(run(user(b.id), "delete from public.orgs where id = $1", [b.orgId]), DENIED);
  });
});

describe("ownership, ids and timestamps come from the database, never the request", () => {
  let a: Account;
  let b: Account;
  let unitId: string;
  beforeAll(async () => {
    a = await signUp("owner-a");
    b = await signUp("owner-b");
    unitId = await addUnit(b);
  });

  it.each([
    ["created_by", "$2"],
    ["created_at", "now() - interval '1 year'"],
    ["updated_at", "now() - interval '1 year'"],
    ["id", "gen_random_uuid()"],
    ["currency", "'USD'"],
  ])("B: add an apartment setting %s → permission denied (42501)", async (column, value) => {
    await expectPgError(
      run(
        user(b.id),
        `insert into public.units (org_id, name, operating_model, calculator_inputs, engine_version, ${column})
         values ($1, 'x', 'owner_operated', '{}', '1.0.0', ${value})`,
        column === "created_by" ? [b.orgId, a.id] : [b.orgId],
      ),
      DENIED,
    );
  });

  it.each([
    ["org_id", "$2", "other org"],
    ["created_by", "$2", "other user"],
    ["created_at", "now() - interval '1 year'", null],
    ["updated_at", "now() - interval '1 year'", null],
    ["id", "gen_random_uuid()", null],
    ["currency", "'USD'", null],
  ])("B: change %s on B's own apartment → permission denied (42501)", async (column, value, other) => {
    const values = other === "other org" ? [unitId, a.orgId] : other === "other user" ? [unitId, a.id] : [unitId];
    await expectPgError(run(user(b.id), `update public.units set ${column} = ${value} where id = $1`, values), DENIED);
  });

  it("an apartment B adds is owned by B's org and created by B, with fresh timestamps", async () => {
    const { rows } = await admin.query(
      "select org_id, created_by, created_at > now() - interval '1 minute' as fresh, currency from public.units where id = $1",
      [unitId],
    );
    expect(rows).toEqual([{ org_id: b.orgId, created_by: b.id, fresh: true, currency: "EGP" }]);
  });

  it("B can rename and edit B's apartment; created_by and created_at stay as they were", async () => {
    const before = (await admin.query("select created_by, created_at from public.units where id = $1", [unitId])).rows[0];
    const { rowCount } = await run(user(b.id), "update public.units set name = 'شقة الساحل', operating_model = 'owner_operated' where id = $1", [unitId]);
    expect(rowCount).toBe(1);
    const after = (await admin.query("select name, created_by, created_at, updated_at >= created_at as touched from public.units where id = $1", [unitId]))
      .rows[0];
    expect(after).toEqual({ name: "شقة الساحل", created_by: before.created_by, created_at: before.created_at, touched: true });
  });

  it("an authenticated editor cannot directly clear created_by, even on their own apartment", async () => {
    const before = (await admin.query("select created_by from public.units where id = $1", [unitId])).rows[0];
    await expectPgError(run(user(b.id), "update public.units set created_by = null where id = $1", [unitId]), DENIED);
    expect((await admin.query("select created_by from public.units where id = $1", [unitId])).rows[0]).toEqual(before);
  });

  it("profiles: B may change only the apartment-count answer", async () => {
    const ok = await run(user(b.id), "update public.profiles set apartment_count_answer = '2-3' where user_id = $1", [b.id]);
    expect(ok.rowCount).toBe(1);
    await expectPgError(run(user(b.id), "update public.profiles set apartment_count_answer = '7' where user_id = $1", [b.id]), CHECK_VIOLATION);
    await expectPgError(run(user(b.id), "update public.profiles set user_id = $2 where user_id = $1", [b.id, a.id]), DENIED);
    await expectPgError(run(user(b.id), "update public.profiles set created_at = now() where user_id = $1", [b.id]), DENIED);
    await expectPgError(run(user(b.id), "insert into public.profiles (user_id) values ($1)", [b.id]), DENIED);
    await expectPgError(run(user(b.id), "delete from public.profiles where user_id = $1", [b.id]), DENIED);
  });

  it.each([
    ["an empty name", "'   '", "'{}'::jsonb", "'1.0.0'", "'owner_operated'"],
    ["a name with a control character", "E'a\\nb'", "'{}'::jsonb", "'1.0.0'", "'owner_operated'"],
    ["a name over 60 characters", "repeat('x', 61)", "'{}'::jsonb", "'1.0.0'", "'owner_operated'"],
    ["an unknown operating model", "'x'", "'{}'::jsonb", "'1.0.0'", "'hotel'"],
    ["calculator inputs that are not an object", "'x'", "'[1]'::jsonb", "'1.0.0'", "'owner_operated'"],
    ["calculator inputs over 8 KB", "'x'", "jsonb_build_object('pad', repeat('x', 9000))", "'1.0.0'", "'owner_operated'"],
    ["a malformed engine version", "'x'", "'{}'::jsonb", "'latest'", "'owner_operated'"],
  ])("apartment content is checked: %s → rejected (23514)", async (_label, name, inputs, version, model) => {
    await expectPgError(
      run(
        user(b.id),
        `insert into public.units (org_id, name, operating_model, calculator_inputs, engine_version) values ($1, ${name}, ${model}, ${inputs}, ${version})`,
        [b.orgId],
      ),
      CHECK_VIOLATION,
    );
  });
});

describe("the 5-apartment limit is enforced by the database", () => {
  it("5 apartments are accepted; the 6th is rejected with unit_limit_reached (P0001)", async () => {
    const c = await signUp("cap");
    for (let i = 1; i <= 5; i++) await addUnit(c, `شقة ${i}`);
    await expectPgError(addUnit(c, "شقة 6"), RAISED, /unit_limit_reached/);
    expect(await unitCount(c.orgId)).toBe(5);
  });

  it("two simultaneous adds at 4 apartments: the second waits for the first, then is rejected", async () => {
    const c = await signUp("race");
    for (let i = 1; i <= 4; i++) await addUnit(c, `شقة ${i}`);
    const inputs = JSON.stringify(CALCULATOR_INPUTS);

    // Request 1 adds the 5th apartment and keeps its transaction open.
    const first = await openRequest(user(c.id));
    const second = await openRequest(user(c.id));
    try {
      await first.query(INSERT_UNIT, [c.orgId, "first", inputs]);

      // Request 2 starts while request 1 is uncommitted. Without the lock it
      // would still count 4 apartments and get in; with it, it waits.
      let settled = false;
      const secondInsert = second.query(INSERT_UNIT, [c.orgId, "second", inputs]).finally(() => {
        settled = true;
      });
      secondInsert.catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(settled, "request 2 should be waiting for request 1's lock").toBe(false);

      await first.commit();
      await expectPgError(secondInsert, RAISED, /unit_limit_reached/);
    } finally {
      await first.rollback();
      await second.rollback();
    }
    expect(await unitCount(c.orgId)).toBe(5);
  });

  it("deleting an apartment makes room for another", async () => {
    const c = await signUp("room");
    const ids: string[] = [];
    for (let i = 1; i <= 5; i++) ids.push(await addUnit(c, `شقة ${i}`));
    await run(user(c.id), "delete from public.units where id = $1", [ids[0]]);
    await addUnit(c, "شقة 6");
    expect(await unitCount(c.orgId)).toBe(5);
  });

  it("the limit is org_entitlements.max_units: when the project owner raises it (custom plan), a 6th is accepted", async () => {
    const c = await signUp("custom");
    for (let i = 1; i <= 5; i++) await addUnit(c, `شقة ${i}`);
    await owner.query("update public.org_entitlements set max_units = 6 where org_id = $1", [c.orgId]);
    await addUnit(c, "شقة 6");
    expect(await unitCount(c.orgId)).toBe(6);
    await expectPgError(addUnit(c, "شقة 7"), RAISED, /unit_limit_reached/);
  });

  it("the limit error is never raised for someone else's org: B adding to a full org A gets the RLS error, not the limit", async () => {
    const full = await signUp("full");
    for (let i = 1; i <= 5; i++) await addUnit(full, `شقة ${i}`);
    const b = await signUp("prober");
    await expectPgError(
      run(
        user(b.id),
        "insert into public.units (org_id, name, operating_model, calculator_inputs, engine_version) values ($1, 'x', 'owner_operated', '{}', '1.0.0')",
        [full.orgId],
      ),
      DENIED,
      /row-level security/,
    );
  });
});

describe("a signed-out visitor (anon, publishable key only) reaches nothing", () => {
  it.each(TABLES)("anon: read, add, change or delete in %s → permission denied (42501)", async (table) => {
    await expectPgError(run(ANON, `select * from public.${table}`), DENIED);
    await expectPgError(run(ANON, `insert into public.${table} default values`), DENIED);
    await expectPgError(run(ANON, `update public.${table} set created_at = now()`), DENIED);
    await expectPgError(run(ANON, `delete from public.${table}`), DENIED);
  });

  it("anon: delete_my_account → permission denied (42501)", async () => {
    await expectPgError(run(ANON, "select public.delete_my_account()"), DENIED);
  });

  it("anon: the private helpers → permission denied (42501)", async () => {
    await expectPgError(run(ANON, "select * from private.member_org_ids()"), DENIED);
  });
});

describe("delete_my_account (no service-role key: a SECURITY DEFINER function acting on auth.uid() only)", () => {
  it("refuses without a signed-in user (not_authenticated)", async () => {
    await expectPgError(run({ kind: "signed-in-without-user" }, "select public.delete_my_account()"), DENIED, /not_authenticated/);
  });

  it("deletes everything of B's — auth user, Google identity, sessions, profile, org, membership, entitlements, apartments — and nothing of A's", async () => {
    const a = await signUp("keep");
    const b = await signUp("leave");
    const aUnit = await addUnit(a);
    await addUnit(b);
    await addUnit(b, "شقة 2");

    await run(user(b.id), "select public.delete_my_account()");

    const left = await admin.query(
      `select
         (select count(*) from auth.users where id = $1)::int as users,
         (select count(*) from auth.identities where user_id = $1)::int as identities,
         (select count(*) from auth.sessions where user_id = $1)::int as sessions,
         (select count(*) from public.profiles where user_id = $1)::int as profiles,
         (select count(*) from public.org_members where user_id = $1)::int as memberships,
         (select count(*) from public.orgs where id = $2)::int as orgs,
         (select count(*) from public.org_entitlements where org_id = $2)::int as entitlements,
         (select count(*) from public.units where org_id = $2)::int as units`,
      [b.id, b.orgId],
    );
    expect(left.rows[0]).toEqual({ users: 0, identities: 0, sessions: 0, profiles: 0, memberships: 0, orgs: 0, entitlements: 0, units: 0 });

    const kept = await admin.query(
      `select
         (select count(*) from auth.users where id = $1)::int as users,
         (select count(*) from public.org_entitlements where org_id = $2)::int as entitlements,
         (select count(*) from public.units where id = $3)::int as units`,
      [a.id, a.orgId, aUnit],
    );
    expect(kept.rows[0]).toEqual({ users: 1, entitlements: 1, units: 1 });
  });

  it("keeps a shared org and its apartment for the surviving member", async () => {
    const leaving = await signUp("shared-leaving");
    const staying = await signUp("shared-staying");
    const unitId = await addUnit(leaving, "shared apartment");
    await owner.query(
      "insert into public.org_members (org_id, user_id, role) values ($1, $2, 'member')",
      [leaving.orgId, staying.id],
    );

    await run(user(leaving.id), "select public.delete_my_account()");

    expect((await admin.query("select count(*)::int as n from auth.users where id = $1", [leaving.id])).rows[0].n).toBe(0);
    expect((await admin.query("select count(*)::int as n from public.orgs where id = $1", [leaving.orgId])).rows[0].n).toBe(1);
    expect((await admin.query("select count(*)::int as n from public.org_entitlements where org_id = $1", [leaving.orgId])).rows[0].n).toBe(1);
    expect((await admin.query("select user_id, role from public.org_members where org_id = $1", [leaving.orgId])).rows).toEqual([
      { user_id: staying.id, role: "member" },
    ]);
    expect((await admin.query("select org_id, created_by from public.units where id = $1", [unitId])).rows).toEqual([
      { org_id: leaving.orgId, created_by: null },
    ]);
    expect((await run(user(staying.id), "select id from public.units where id = $1", [unitId])).rows).toEqual([{ id: unitId }]);
    expect((await run(user(staying.id), "select org_id from public.org_entitlements where org_id = $1", [leaving.orgId])).rows).toEqual([
      { org_id: leaving.orgId },
    ]);
    expect((await run(user(leaving.id), "select id from public.units where id = $1", [unitId])).rows).toEqual([]);
  });

  it("an access token left after deletion cannot read the deleted user's rows", async () => {
    const deleted = await signUp("stale-token");
    const surviving = await signUp("stale-survivor");
    const unitId = await addUnit(deleted);
    const otherUnitId = await addUnit(surviving);
    await run(user(deleted.id), "select public.delete_my_account()");
    for (const table of TABLES) {
      expect((await run(user(deleted.id), `select * from public.${table}`)).rows, `${table} visible to deleted-user token`).toEqual([]);
    }
    expect((await run(user(deleted.id), "select id from public.units where id in ($1, $2)", [unitId, otherUnitId])).rows).toEqual([]);
    expect((await run(user(surviving.id), "select id from public.units where id = $1", [otherUnitId])).rows).toEqual([{ id: otherUnitId }]);
  });

  it("takes no argument: there is no way to name another user", async () => {
    const { rows } = await admin.query(
      "select pronargs from pg_proc where oid = 'public.delete_my_account'::regproc",
    );
    expect(rows).toEqual([{ pronargs: 0 }]);
  });
});

describe("guards for this migration and every later one", () => {
  it("every table in public has Row Level Security enabled", async () => {
    const { rows } = await admin.query(
      "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity",
    );
    expect(rows).toEqual([]);
  });

  it("anon holds no privilege on any table or column in public", async () => {
    const { rows } = await admin.query(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')
          and (has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate, references, trigger')
               or has_any_column_privilege('anon', c.oid, 'select, insert, update, references'))`,
    );
    expect(rows).toEqual([]);
  });

  it("no function in public or private can be run by PUBLIC or anon", async () => {
    const { rows } = await admin.query(
      `select p.oid::regprocedure::text as fn from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'private')
          and (has_function_privilege('anon', p.oid, 'execute')
               or exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'))`,
    );
    expect(rows).toEqual([]);
  });

  it("every SECURITY DEFINER function pins an empty search_path", async () => {
    const { rows } = await admin.query(
      `select p.oid::regprocedure::text as fn from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'private') and p.prosecdef
          and not coalesce(p.proconfig @> array['search_path=""'], false)`,
    );
    expect(rows).toEqual([]);
  });

  it("a table a later migration adds is not reachable by anon or authenticated until it is granted", async () => {
    await owner.query("create table public.probe_future_table (id int)");
    try {
      const { rows } = await admin.query(
        "select has_table_privilege('anon', 'public.probe_future_table', 'select') as anon, has_table_privilege('authenticated', 'public.probe_future_table', 'select') as authenticated",
      );
      expect(rows).toEqual([{ anon: false, authenticated: false }]);
    } finally {
      await owner.query("drop table public.probe_future_table");
    }
  });
});
