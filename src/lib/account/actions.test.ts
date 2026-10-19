// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { ENGINE_VERSION } from "@/lib/finance/version";

/**
 * The server actions against a recording stand-in for the Supabase client:
 * which table, which operation, which columns and filters. The database's
 * own rules are proved in tests/db/; here the point is what the app sends.
 */

type Result = { data: unknown; error: { code: string; message: string } | null; status: number };
interface Call {
  table: string;
  ops: { name: string; args: unknown[] }[];
}

const state = {
  calls: [] as Call[],
  respond: (_call: Call): Result => ({ data: null, error: null, status: 200 }),
  claims: { data: { claims: { sub: "user-1" } }, error: null } as { data: { claims: { sub: string } } | null; error: { name: string; status?: number } | null },
  rpc: vi.fn(async (_fn: string): Promise<Result> => ({ data: null, error: null, status: 204 })),
  signOut: vi.fn(async () => ({ error: null })),
  configured: true,
};

function builder(table: string) {
  const call: Call = { table, ops: [] };
  state.calls.push(call);
  const chain: Record<string, unknown> = {};
  for (const name of ["select", "insert", "update", "delete", "eq", "in", "is", "order", "limit", "maybeSingle", "single"]) {
    chain[name] = (...args: unknown[]) => {
      call.ops.push({ name, args });
      return chain;
    };
  }
  chain.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(state.respond(call)).then(resolve, reject);
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: async () =>
    state.configured
      ? {
          auth: { getClaims: async () => state.claims, signOut: state.signOut },
          from: (table: string) => builder(table),
          rpc: state.rpc,
        }
      : null,
}));

const { adoptGuestUnit, createUnit, deleteMyAccount, deleteUnit, saveApartmentCount, updateUnit } = await import("./actions");

const form = CALCULATOR_PRESETS[0]!.form;
const other = CALCULATOR_PRESETS[1]!.form;
const inputs = { form, assumed: ["deposit"] };
const UNIT_ID = "6f1b8f2e-6a43-4b5e-9a57-0d3a3c1f2b11";
const ORG_ID = "0e7d1c2b-1a2b-4c3d-8e9f-001122334455";
const row = { id: UNIT_ID, name: "شقة 2", operating_model: form.operatingModel, calculator_inputs: inputs, engine_version: ENGINE_VERSION, created_at: "t", updated_at: "t" };

const op = (call: Call | undefined, name: string) => call?.ops.find((o) => o.name === name);

/** Membership lookup → the personal org; anything else → `rest`. */
function respondWith(rest: (call: Call) => Result) {
  state.respond = (call) => (call.table === "org_members" ? { data: { org_id: ORG_ID }, error: null, status: 200 } : rest(call));
}

beforeEach(() => {
  state.calls = [];
  state.configured = true;
  state.claims = { data: { claims: { sub: "user-1" } }, error: null };
  state.rpc.mockClear();
  state.rpc.mockImplementation(async () => ({ data: null, error: null, status: 204 }));
  state.signOut.mockClear();
  respondWith(() => ({ data: row, error: null, status: 201 }));
});

describe("createUnit", () => {
  it("inserts exactly the five granted columns, with the engine version and the person's own org", async () => {
    const result = await createUnit({ name: "  شقة 2 ", inputs });
    expect(result).toEqual({ ok: true, data: row });
    const membership = state.calls.find((c) => c.table === "org_members");
    expect(op(membership, "eq")?.args).toEqual(["user_id", "user-1"]);
    expect(op(membership, "in")?.args).toEqual(["role", ["owner", "admin", "member"]]);
    const insert = op(state.calls.find((c) => c.table === "units"), "insert")!.args[0] as Record<string, unknown>;
    expect(Object.keys(insert).sort()).toEqual(["calculator_inputs", "engine_version", "name", "operating_model", "org_id"]);
    expect(insert).toMatchObject({ org_id: ORG_ID, name: "شقة 2", operating_model: form.operatingModel, engine_version: ENGINE_VERSION });
    expect(insert.calculator_inputs).toEqual(inputs);
  });

  it("never sends invalid input to the database", async () => {
    for (const bad of [null, {}, { name: "", inputs }, { name: "x", inputs: { form, assumed: [], netProfit: 1 } }, { name: "x", inputs, org_id: ORG_ID }]) {
      expect(await createUnit(bad)).toEqual({ ok: false, error: "invalid" });
    }
    expect(state.calls).toEqual([]);
  });

  it("returns unit_limit_reached when the database refuses the 6th apartment", async () => {
    respondWith(() => ({ data: null, error: { code: "P0001", message: "unit_limit_reached" }, status: 400 }));
    expect(await createUnit({ name: "شقة 6", inputs })).toEqual({ ok: false, error: "unit_limit_reached" });
  });

  it("needs a session, and accounts configured", async () => {
    state.claims = { data: null, error: null };
    expect(await createUnit({ name: "x", inputs })).toEqual({ ok: false, error: "not_signed_in" });
    state.claims = { data: null, error: { name: "AuthApiError", status: 400 } };
    expect(await createUnit({ name: "x", inputs })).toEqual({ ok: false, error: "session_expired" });
    state.configured = false;
    expect(await createUnit({ name: "x", inputs })).toEqual({ ok: false, error: "not_configured" });
    expect(state.calls).toEqual([]);
  });

  it("rejects a write sent as A when the server receives B's session", async () => {
    expect(await createUnit({ name: "A unit", inputs }, "user-A")).toEqual({ ok: false, error: "identity_changed" });
    expect(state.calls).toEqual([]);
  });

  it("is forbidden without an org the person may edit", async () => {
    state.respond = () => ({ data: null, error: null, status: 200 });
    expect(await createUnit({ name: "x", inputs })).toEqual({ ok: false, error: "forbidden" });
    expect(state.calls.some((c) => c.table === "units")).toBe(false);
  });
});

describe("updateUnit", () => {
  it("never sends org_id; saving inputs also sets operating_model and engine_version", async () => {
    await updateUnit({ id: UNIT_ID, inputs: { form: other, assumed: [] } });
    const call = state.calls.find((c) => c.table === "units")!;
    const payload = op(call, "update")!.args[0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(["calculator_inputs", "engine_version", "operating_model"]);
    expect(payload.operating_model).toBe(other.operatingModel);
    expect(payload.engine_version).toBe(ENGINE_VERSION);
    expect(op(call, "eq")?.args).toEqual(["id", UNIT_ID]);
  });

  it("a rename sends the name only", async () => {
    await updateUnit({ id: UNIT_ID, name: " شقة الساحل " });
    const payload = op(state.calls.find((c) => c.table === "units"), "update")!.args[0];
    expect(payload).toEqual({ name: "شقة الساحل" });
  });

  it("0 rows changed (someone else's or deleted) is not_found", async () => {
    respondWith(() => ({ data: null, error: null, status: 200 }));
    expect(await updateUnit({ id: UNIT_ID, name: "x" })).toEqual({ ok: false, error: "not_found" });
  });

  it("rejects a non-UUID id and an empty update before the database", async () => {
    expect(await updateUnit({ id: "own-1", name: "x" })).toEqual({ ok: false, error: "invalid" });
    expect(await updateUnit({ id: UNIT_ID })).toEqual({ ok: false, error: "invalid" });
    expect(state.calls).toEqual([]);
  });
});

describe("deleteUnit", () => {
  it("deletes by id", async () => {
    respondWith(() => ({ data: { id: UNIT_ID }, error: null, status: 200 }));
    expect(await deleteUnit(UNIT_ID)).toEqual({ ok: true, data: { id: UNIT_ID } });
    const call = state.calls.find((c) => c.table === "units")!;
    expect(op(call, "delete")).toBeDefined();
    expect(op(call, "eq")?.args).toEqual(["id", UNIT_ID]);
  });

  it("0 rows is not_found", async () => {
    respondWith(() => ({ data: null, error: null, status: 200 }));
    expect(await deleteUnit(UNIT_ID)).toEqual({ ok: false, error: "not_found" });
  });
});

describe("adoptGuestUnit", () => {
  const guest = { name: "شقتي الأولى", inputs, apartmentCount: "2-3" };

  it("adds the browser apartment to an empty account", async () => {
    respondWith((call) => (op(call, "insert") ? { data: row, error: null, status: 201 } : { data: [], error: null, status: 200 }));
    expect(await adoptGuestUnit(guest)).toEqual({ ok: true, data: { outcome: "added", unit: row } });
  });

  it("recognises the same numbers already in the account and writes nothing", async () => {
    respondWith(() => ({ data: [{ id: UNIT_ID, calculator_inputs: { form, assumed: [] } }], error: null, status: 200 }));
    expect(await adoptGuestUnit(guest)).toEqual({ ok: true, data: { outcome: "duplicate", unitId: UNIT_ID } });
    expect(state.calls.some((c) => op(c, "insert"))).toBe(false);
  });

  it("asks when the account holds other apartments, and writes nothing", async () => {
    respondWith(() => ({ data: [{ id: UNIT_ID, calculator_inputs: { form: other, assumed: [] } }], error: null, status: 200 }));
    expect(await adoptGuestUnit(guest)).toEqual({ ok: true, data: { outcome: "ask" } });
    expect(state.calls.some((c) => op(c, "insert"))).toBe(false);
  });
});

describe("saveApartmentCount", () => {
  it("updates only the person's own profile", async () => {
    respondWith(() => ({ data: [{ user_id: "user-1" }], error: null, status: 200 }));
    expect(await saveApartmentCount("4-10")).toEqual({ ok: true, data: { saved: true } });
    const call = state.calls.find((c) => c.table === "profiles")!;
    expect(op(call, "update")?.args[0]).toEqual({ apartment_count_answer: "4-10" });
    expect(op(call, "eq")?.args).toEqual(["user_id", "user-1"]);
    expect(op(call, "is")).toBeUndefined();
  });

  it("the sign-in copy never replaces an existing answer", async () => {
    respondWith(() => ({ data: [], error: null, status: 200 }));
    expect(await saveApartmentCount("1", true)).toEqual({ ok: true, data: { saved: false } });
    expect(op(state.calls.find((c) => c.table === "profiles"), "is")?.args).toEqual(["apartment_count_answer", null]);
  });

  it("rejects answers outside the four ranges", async () => {
    expect(await saveApartmentCount("11")).toEqual({ ok: false, error: "invalid" });
    expect(state.calls).toEqual([]);
  });
});

describe("deleteMyAccount", () => {
  it("calls delete_my_account (no arguments, no secret key), then signs this device out", async () => {
    expect(await deleteMyAccount()).toEqual({ ok: true, data: undefined });
    expect(state.rpc).toHaveBeenCalledWith("delete_my_account");
    expect(state.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(state.rpc.mock.invocationCallOrder[0]!).toBeLessThan(state.signOut.mock.invocationCallOrder[0]!);
  });

  it("keeps the person signed in when the deletion fails, and says why", async () => {
    state.rpc.mockImplementation(async () => ({ data: null, error: { code: "42501", message: "permission denied for function delete_my_account" }, status: 403 }));
    expect(await deleteMyAccount()).toEqual({ ok: false, error: "forbidden" });
    expect(state.signOut).not.toHaveBeenCalled();
  });

  it("keeps the person signed in when shared-org ownership must be transferred", async () => {
    state.rpc.mockImplementation(async () => ({
      data: null,
      error: { code: "P0001", message: "shared_org_requires_owner_transfer" },
      status: 400,
    }));
    expect(await deleteMyAccount()).toEqual({ ok: false, error: "shared_org_requires_owner_transfer" });
    expect(state.signOut).not.toHaveBeenCalled();
  });

  it("needs a session", async () => {
    state.claims = { data: null, error: null };
    expect(await deleteMyAccount()).toEqual({ ok: false, error: "not_signed_in" });
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
