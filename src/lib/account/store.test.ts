import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { clearGuest, GUEST_KEY, readGuest, saveOwnUnit } from "@/lib/guest/store";

/**
 * The browser's account store, with the Supabase client and the server
 * actions replaced by recorders. Proves: a visitor without a session cookie
 * loads nothing; sign-in goes to exactly /auth/callback with the page in a
 * cookie; reads build the state; writes update it; deletion clears this
 * browser.
 */

const form = CALCULATOR_PRESETS[0]!.form;
const row = (id: string, name: string) => ({
  id,
  name,
  operating_model: form.operatingModel,
  calculator_inputs: { form, assumed: [] },
  engine_version: "1.0.0",
  created_at: "2026-10-08T10:00:00Z",
  updated_at: "2026-10-08T10:00:00Z",
});

type TestUser = { id: string; email: string };
const A: TestUser = { id: "a", email: "a@example.com" };
const B: TestUser = { id: "b", email: "b@example.com" };
let authUser: TestUser | null = A;
const session = (user: TestUser | null) => ({ data: { session: user ? { user } : null }, error: null });

const fake = {
  signInWithOAuth: vi.fn(async (_args: unknown) => ({ data: {}, error: null as null | Error })),
  signOut: vi.fn(async (_args: unknown) => { authUser = null; return { error: null as Error | null }; }),
  getSession: vi.fn(async () => session(authUser)),
  tables: {} as Record<string, { data: unknown; error: unknown; status: number }>,
  unitResponse: null as Promise<{ data: unknown; error: unknown; status: number }> | null,
  authCallback: null as ((event: string, value: { user: TestUser } | null) => void) | null,
};
const loadBrowserSupabase = vi.fn(() =>
  Promise.resolve({
    auth: { signInWithOAuth: fake.signInWithOAuth, signOut: fake.signOut, getSession: fake.getSession, onAuthStateChange: (callback: (event: string, value: { user: TestUser } | null) => void) => {
      fake.authCallback = callback;
      return { data: { subscription: { unsubscribe() {} } } };
    } },
    from: (table: string) => {
      const result = (table === "units" && fake.unitResponse) || fake.tables[table] || { data: null, error: null, status: 200 };
      const chain: Record<string, unknown> = {};
      for (const m of ["select", "order", "maybeSingle"]) chain[m] = () => chain;
      chain.then = (resolve: (r: unknown) => unknown) => Promise.resolve(result).then(resolve);
      return chain;
    },
  }),
);
vi.mock("@/lib/supabase/browser", () => ({ loadBrowserSupabase: () => loadBrowserSupabase() }));

const actions = {
  createUnit: vi.fn(),
  updateUnit: vi.fn(),
  deleteUnit: vi.fn(),
  adoptGuestUnit: vi.fn(),
  saveApartmentCount: vi.fn(),
  deleteMyAccount: vi.fn(),
};
vi.mock("./actions", () => actions);

const store = await import("./store");

function switchToB() {
  authUser = B;
  fake.authCallback?.("SIGNED_IN", { user: B });
}

function clearCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  store.resetAccountForTests();
  fake.tables = {};
  fake.unitResponse = null;
  fake.authCallback = null;
  authUser = A;
  clearGuest();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  clearCookies();
});

describe("account store: who is this?", () => {
  it("accounts are off without the two public values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(store.readAccount()).toEqual({ status: "off" });
    expect(loadBrowserSupabase).not.toHaveBeenCalled();
  });

  it("a visitor without a session cookie is a guest, and the Supabase client is never loaded", () => {
    expect(store.readAccount()).toEqual({ status: "guest" });
    expect(loadBrowserSupabase).not.toHaveBeenCalled();
  });

  it("with a session cookie: loading, then the account's apartments, answer and limit", async () => {
    document.cookie = "sb-abcd-auth-token.0=base64-x; Path=/";
    fake.tables = {
      units: { data: [row("u1", "شقة التجمع"), row("u2", "شاليه الساحل")], error: null, status: 200 },
      profiles: { data: { apartment_count_answer: "2-3" }, error: null, status: 200 },
      org_entitlements: { data: { max_units: 5 }, error: null, status: 200 },
    };
    expect(store.readAccount()).toEqual({ status: "loading" });
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    const state = store.readAccount();
    if (state.status !== "signed_in") throw new Error("not signed in");
    expect(state.userId).toBe("a");
    expect(state.email).toBe("a@example.com");
    expect(state.units.map((u) => u.name)).toEqual(["شقة التجمع", "شاليه الساحل"]);
    expect(state.units[0]!.inputs?.form).toEqual(form);
    expect(state.maxUnits).toBe(5);
    expect(state.apartmentCount).toBe("2-3");
    expect(state.loadError).toBeNull();
  });

  it("a cookie without a live session is a guest", async () => {
    document.cookie = "sb-abcd-auth-token=base64-x; Path=/";
    authUser = null;
    store.readAccount();
    await vi.waitFor(() => expect(store.readAccount()).toEqual({ status: "guest" }));
  });
});

describe("account store: sign-in and sign-out", () => {
  const accountA = () => store.resetAccountForTests({
    status: "signed_in", userId: "a", email: "a@example.com",
    units: [{ id: "a", name: "A only", operatingModel: form.operatingModel, inputs: { form, assumed: [] }, engineVersion: "1.0.0", updatedAt: row("a", "A only").updated_at }],
    maxUnits: 5, apartmentCount: "2-3", loadError: null,
  });

  async function subscribedAsA() {
    await store.signInWithGoogle("/demo");
    accountA();
  }

  it("Google sign-in returns to exactly /auth/callback; the page travels in a cookie, not the URL", async () => {
    window.history.replaceState(null, "", "/en/demo/more?tab=x");
    await store.signInWithGoogle(window.location.pathname);
    expect(fake.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
    expect(document.cookie).toContain(`bd_next=${encodeURIComponent("/en/demo/more")}`);
  });

  it("signs out this device only", async () => {
    store.resetAccountForTests({ status: "signed_in", userId: "a", email: null, units: [], maxUnits: 5, apartmentCount: null, loadError: null });
    await store.signOut();
    expect(fake.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(store.readAccount()).toEqual({ status: "guest" });
  });

  it("does not restore a signed-out account when an older load finishes late", async () => {
    accountA();
    let finishSession!: (value: ReturnType<typeof session>) => void;
    fake.getSession.mockImplementationOnce(
      () => new Promise((resolve) => { finishSession = resolve; }),
    );
    const loading = store.load();
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    await store.signOut();
    finishSession(session(A));
    await loading;
    expect(store.readAccount()).toEqual({ status: "guest" });
  });

  it("hides A immediately on B sign-in, then shows only B after its read", async () => {
    await subscribedAsA();
    let finishUnits!: (value: { data: unknown; error: null; status: number }) => void;
    fake.unitResponse = new Promise((resolve) => { finishUnits = resolve; });
    fake.tables.profiles = { data: { apartment_count_answer: "1" }, error: null, status: 200 };
    switchToB();
    expect(store.readAccount()).toEqual({ status: "loading" });
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    expect(store.readAccount()).toEqual({ status: "loading" });
    finishUnits({ data: [row("b", "B only")], error: null, status: 200 });
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    const next = store.readAccount();
    expect(next.status === "signed_in" && [next.email, next.units.map((u) => u.name), next.apartmentCount]).toEqual([
      "b@example.com", ["B only"], "1",
    ]);
  });

  it("discards A's pending read when the session becomes B without an auth event", async () => {
    await subscribedAsA();
    let finishUnits!: (value: { data: unknown; error: null; status: number }) => void;
    fake.unitResponse = new Promise((resolve) => { finishUnits = resolve; });
    const reading = store.load();
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    authUser = B;
    fake.unitResponse = null;
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    finishUnits({ data: [row("b", "B row from A's pending request")], error: null, status: 200 });
    await reading;
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    const next = store.readAccount();
    expect(next.status === "signed_in" && [next.userId, next.units.map((u) => u.name)]).toEqual(["b", ["B only"]]);
  });

  it("keeps a pending read hidden when its final identity check cannot be verified", async () => {
    await subscribedAsA();
    let finishUnits!: (value: { data: unknown; error: null; status: number }) => void;
    fake.unitResponse = new Promise((resolve) => { finishUnits = resolve; });
    const reading = store.load();
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    fake.getSession.mockRejectedValueOnce(new Error("refresh failed"));
    finishUnits({ data: [row("a", "A only")], error: null, status: 200 });
    await reading;
    expect(store.readAccount()).toEqual({ status: "loading" });
  });

  it("keeps A's form state mounted on a same-user refocus event", async () => {
    await subscribedAsA();
    const before = store.readAccount();
    fake.authCallback?.("SIGNED_IN", { user: A });
    expect(store.readAccount()).toBe(before);
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    expect(store.readAccount()).toBe(before);
  });

  it("does not unmount A on a transient same-user refocus verification error", async () => {
    await subscribedAsA();
    const before = store.readAccount();
    fake.getSession.mockRejectedValueOnce(new Error("temporary network failure"));
    fake.authCallback?.("SIGNED_IN", { user: A });
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    expect(store.readAccount()).toBe(before);
  });

  it("restores B after a delayed SIGNED_OUT and keeps B hidden on an older A sign-in until B is confirmed", async () => {
    await subscribedAsA();
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    switchToB();
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    fake.authCallback?.("SIGNED_OUT", null);
    expect(store.readAccount()).toEqual({ status: "loading" });
    await vi.waitFor(() => expect(fake.getSession.mock.calls.length).toBeGreaterThanOrEqual(2));
    expect(store.readAccount()).toEqual({ status: "loading" });
    switchToB();
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    fake.authCallback?.("SIGNED_IN", { user: A });
    expect(store.readAccount()).toEqual({ status: "loading" });
    await vi.waitFor(() => expect(fake.getSession.mock.calls.length).toBeGreaterThanOrEqual(3));
    expect(store.readAccount()).toEqual({ status: "loading" });
    switchToB();
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    const next = store.readAccount();
    expect(next.status === "signed_in" && [next.userId, next.units.map((u) => u.name)]).toEqual(["b", ["B only"]]);
  });

  it("does not rehydrate A from an old session after SIGNED_OUT", async () => {
    await subscribedAsA();
    fake.authCallback?.("SIGNED_OUT", null);
    expect(store.readAccount()).toEqual({ status: "loading" });
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    expect(store.readAccount()).toEqual({ status: "loading" });
    authUser = null;
    fake.authCallback?.("SIGNED_OUT", null);
    await vi.waitFor(() => expect(store.readAccount()).toEqual({ status: "guest" }));
  });

  it("does not restore A when a B sign-in event arrives before the session read catches up", async () => {
    await subscribedAsA();
    fake.authCallback?.("SIGNED_IN", { user: B });
    expect(store.readAccount()).toEqual({ status: "loading" });
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    expect(store.readAccount()).toEqual({ status: "loading" });
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    switchToB();
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    const next = store.readAccount();
    expect(next.status === "signed_in" && [next.userId, next.units.map((u) => u.name)]).toEqual(["b", ["B only"]]);
  });

  it("ignores an A unit read that finishes after sign-out", async () => {
    await subscribedAsA();
    let finishUnits!: (value: { data: unknown; error: null; status: number }) => void;
    fake.unitResponse = new Promise((resolve) => { finishUnits = resolve; });
    const loading = store.load();
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    const signingOut = store.signOut();
    expect(store.readAccount()).toEqual({ status: "loading" });
    finishUnits({ data: [row("a", "A only")], error: null, status: 200 });
    await Promise.all([loading, signingOut]);
    expect(store.readAccount()).toEqual({ status: "guest" });
  });

  it("hides A before the sign-out request finishes", async () => {
    await subscribedAsA();
    let finishSignOut!: (value: { error: null }) => void;
    fake.signOut.mockImplementationOnce(() => new Promise((resolve) => { finishSignOut = resolve; }));
    const signingOut = store.signOut();
    expect(store.readAccount()).toEqual({ status: "loading" });
    await vi.waitFor(() => expect(fake.signOut).toHaveBeenCalled());
    authUser = null;
    finishSignOut({ error: null });
    expect(await signingOut).toEqual({ ok: true, data: undefined });
  });

  it("does not sign B out when an older sign-out was waiting for the client", async () => {
    await subscribedAsA();
    const signingOut = store.signOut();
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    switchToB();
    await signingOut;
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    expect(fake.signOut).not.toHaveBeenCalled();
    const next = store.readAccount();
    expect(next.status === "signed_in" && next.email).toBe("b@example.com");
  });

  it.each(["returned error", "thrown error"] as const)("keeps data hidden and offers retry when sign-out has a %s", async (failure) => {
    await subscribedAsA();
    if (failure === "returned error") fake.signOut.mockResolvedValueOnce({ error: new Error("network") });
    else fake.signOut.mockRejectedValueOnce(new Error("lock timeout"));
    expect(await store.signOut()).toEqual({ ok: false, error: "network" });
    expect(store.readAccount()).toEqual({ status: "sign_out_error", userId: "a" });
    expect(authUser).toEqual(A);
    fake.authCallback?.("SIGNED_OUT", null);
    fake.authCallback?.("SIGNED_IN", { user: A });
    await vi.waitFor(() => expect(fake.getSession.mock.calls.length).toBeGreaterThanOrEqual(4));
    expect(store.readAccount()).toEqual({ status: "sign_out_error", userId: "a" });
    expect(await store.signOut()).toEqual({ ok: true, data: undefined });
    expect(store.readAccount()).toEqual({ status: "guest" });
  });

  it("refuses to report sign-out success when the SDK returns no error but A remains authenticated", async () => {
    await subscribedAsA();
    fake.signOut.mockImplementationOnce(async () => ({ error: null }));
    expect(await store.signOut()).toEqual({ ok: false, error: "network" });
    expect(store.readAccount()).toEqual({ status: "sign_out_error", userId: "a" });
  });

  it("same-user SIGNED_IN while sign-out is pending does not cancel it", async () => {
    await subscribedAsA();
    let finishSignOut!: (value: { error: null }) => void;
    fake.signOut.mockImplementationOnce(() => new Promise((resolve) => { finishSignOut = resolve; }));
    const signingOut = store.signOut();
    await vi.waitFor(() => expect(fake.signOut).toHaveBeenCalled());
    fake.authCallback?.("SIGNED_IN", { user: A });
    expect(store.readAccount()).toEqual({ status: "loading" });
    authUser = null;
    finishSignOut({ error: null });
    expect(await signingOut).toEqual({ ok: true, data: undefined });
  });

  it("reads the callback's one-shot notice once", () => {
    document.cookie = "bd_flash=signin_failed; Path=/";
    expect(store.takeFlash()).toBe("signin_failed");
    expect(store.takeFlash()).toBeNull();
  });
});

describe("account store: writes", () => {
  const signedIn = (units = [row("u1", "شقة 1")]) =>
    store.resetAccountForTests({
      status: "signed_in",
      userId: "a",
      email: null,
      units: units.map((r) => ({ id: r.id, name: r.name, operatingModel: form.operatingModel, inputs: { form, assumed: [] }, engineVersion: "1.0.0", updatedAt: r.updated_at })),
      maxUnits: 5,
      apartmentCount: null,
      loadError: null,
    });

  it("an added apartment joins the list with what the database returned", async () => {
    signedIn();
    actions.createUnit.mockResolvedValueOnce({ ok: true, data: row("u2", "شقة 2") });
    const result = await store.addUnit("شقة 2", { form, assumed: [] });
    expect(result.ok).toBe(true);
    expect(actions.createUnit).toHaveBeenCalledWith({ name: "شقة 2", inputs: { form, assumed: [] } }, "a");
    const state = store.readAccount();
    expect(state.status === "signed_in" && state.units.map((u) => u.id)).toEqual(["u1", "u2"]);
  });

  it("the 6th apartment: the database's refusal comes back as unit_limit_reached and nothing changes", async () => {
    signedIn();
    actions.createUnit.mockResolvedValueOnce({ ok: false, error: "unit_limit_reached" });
    expect(await store.addUnit("شقة 6", { form, assumed: [] })).toEqual({ ok: false, error: "unit_limit_reached" });
    const state = store.readAccount();
    expect(state.status === "signed_in" && state.units).toHaveLength(1);
  });

  it("refreshes the browser's session before every write (no refresh race with the server after a long absence)", async () => {
    signedIn();
    actions.updateUnit.mockResolvedValueOnce({ ok: true, data: row("u1", "شقة الساحل") });
    await store.renameUnit("u1", "شقة الساحل");
    expect(fake.getSession.mock.invocationCallOrder[0]!).toBeLessThan(actions.updateUnit.mock.invocationCallOrder[0]!);
  });

  it("keeps an in-flight autosave valid across same-user tab refocus", async () => {
    signedIn();
    await store.signInWithGoogle("/demo");
    let finishWrite!: (value: { ok: true; data: ReturnType<typeof row> }) => void;
    actions.updateUnit.mockImplementationOnce(() => new Promise((resolve) => { finishWrite = resolve; }));
    const saving = store.saveUnitInputs("u1", { form, assumed: [] });
    await vi.waitFor(() => expect(actions.updateUnit).toHaveBeenCalled());
    const before = store.readAccount();
    fake.authCallback?.("SIGNED_IN", { user: A });
    expect(store.readAccount()).toBe(before);
    finishWrite({ ok: true, data: row("u1", "Saved A") });
    expect((await saving).ok).toBe(true);
    const next = store.readAccount();
    expect(next.status === "signed_in" && next.units[0]?.name).toBe("Saved A");
  });

  it("blocks a create when the cookie changed to B without an auth event", async () => {
    signedIn();
    authUser = B;
    expect(await store.addUnit("A's new unit", { form, assumed: [] })).toEqual({ ok: false, error: "superseded" });
    expect(actions.createUnit).not.toHaveBeenCalled();
    expect(store.readAccount()).toEqual({ status: "loading" });
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    const next = store.readAccount();
    expect(next.status === "signed_in" && next.userId).toBe("b");
  });

  const staleCases = [
    { name: "add", mock: actions.createUnit, run: () => store.addUnit("A new", { form, assumed: [] }), data: row("a2", "A new") },
    { name: "rename", mock: actions.updateUnit, run: () => store.renameUnit("u1", "A renamed"), data: row("u1", "A renamed") },
    { name: "save inputs", mock: actions.updateUnit, run: () => store.saveUnitInputs("u1", { form, assumed: [] }), data: row("u1", "A saved") },
    { name: "remove", mock: actions.deleteUnit, run: () => store.removeUnit("u1"), data: { id: "u1" } },
    { name: "adoption", mock: actions.adoptGuestUnit, run: () => store.adoptBrowserUnit("A guest", { form, assumed: [] }), data: { outcome: "added", unit: row("a2", "A guest") } },
    { name: "profile count", mock: actions.saveApartmentCount, run: () => store.saveCount("2-3"), data: { saved: true } },
  ] as const;

  it.each(staleCases)("discards stale $name results after A switches to B", async ({ name, mock, run, data }) => {
    signedIn();
    await store.signInWithGoogle("/demo");
    if (name === "adoption") saveOwnUnit(form, []);
    let finishWrite!: (value: unknown) => void;
    mock.mockImplementationOnce(() => new Promise((resolve) => { finishWrite = resolve; }));
    const writing = run();
    await vi.waitFor(() => expect(mock).toHaveBeenCalled());
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    switchToB();
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    finishWrite({ ok: true, data });
    expect(await writing).toEqual({ ok: false, error: "superseded" });
    const next = store.readAccount();
    expect(next.status === "signed_in" && [next.userId, next.units.map((u) => u.name), next.apartmentCount]).toEqual(["b", ["B only"], null]);
    if (name === "adoption") expect(readGuest().units).toHaveLength(1);
  });

  it("a write that finds no session shows the person as signed out", async () => {
    signedIn();
    actions.deleteUnit.mockResolvedValueOnce({ ok: false, error: "not_signed_in" });
    await store.removeUnit("u1");
    expect(store.readAccount()).toEqual({ status: "guest" });
  });

  it("hides stale A after a server identity mismatch even if browser session still says A", async () => {
    signedIn();
    actions.updateUnit.mockResolvedValueOnce({ ok: false, error: "identity_changed" });
    expect(await store.renameUnit("u1", "A renamed")).toEqual({ ok: false, error: "identity_changed" });
    expect(store.readAccount()).toEqual({ status: "loading" });
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    expect(store.readAccount()).toEqual({ status: "loading" });
    expect(actions.updateUnit).toHaveBeenCalledWith({ id: "u1", name: "A renamed" }, "a");
  });

  it("does not put a late A write into B's account", async () => {
    signedIn();
    await store.signInWithGoogle("/demo");
    let finishWrite!: (value: { ok: true; data: ReturnType<typeof row> }) => void;
    actions.updateUnit.mockImplementationOnce(() => new Promise((resolve) => { finishWrite = resolve; }));
    const writing = store.renameUnit("u1", "A renamed");
    await vi.waitFor(() => expect(actions.updateUnit).toHaveBeenCalled());
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    switchToB();
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    finishWrite({ ok: true, data: row("u1", "A renamed") });
    expect(await writing).toEqual({ ok: false, error: "superseded" });
    const next = store.readAccount();
    expect(next.status === "signed_in" && [next.email, next.units.map((u) => u.name)]).toEqual(["b@example.com", ["B only"]]);
  });

  it("does not start A's write after its session refresh loses a race to B sign-in", async () => {
    signedIn();
    await store.signInWithGoogle("/demo");
    let finishSession!: (value: ReturnType<typeof session>) => void;
    fake.getSession.mockImplementationOnce(() => new Promise((resolve) => { finishSession = resolve; }));
    const writing = store.renameUnit("u1", "A renamed");
    await vi.waitFor(() => expect(fake.getSession).toHaveBeenCalled());
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    switchToB();
    finishSession(session(A));
    expect(await writing).toEqual({ ok: false, error: "superseded" });
    expect(actions.updateUnit).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    const next = store.readAccount();
    expect(next.status === "signed_in" && next.email).toBe("b@example.com");
  });

  it("does not clear B on a late A authentication error", async () => {
    signedIn();
    await store.signInWithGoogle("/demo");
    let finishWrite!: (value: { ok: false; error: "not_signed_in" }) => void;
    actions.deleteUnit.mockImplementationOnce(() => new Promise((resolve) => { finishWrite = resolve; }));
    const writing = store.removeUnit("u1");
    await vi.waitFor(() => expect(actions.deleteUnit).toHaveBeenCalled());
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    switchToB();
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    finishWrite({ ok: false, error: "not_signed_in" });
    expect(await writing).toEqual({ ok: false, error: "superseded" });
    const next = store.readAccount();
    expect(next.status === "signed_in" && next.email).toBe("b@example.com");
  });

  it("deleting the account signs out and forgets this browser's Backdesk data", async () => {
    signedIn();
    saveOwnUnit(form, []);
    actions.deleteMyAccount.mockResolvedValueOnce({ ok: true, data: undefined });
    expect(await store.deleteAccount()).toEqual({ ok: true, data: undefined });
    expect(fake.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(window.localStorage.getItem(GUEST_KEY)).toBeNull();
    expect(readGuest().units).toEqual([]);
    expect(store.readAccount()).toEqual({ status: "guest" });
  });

  it("a failed deletion keeps the person signed in", async () => {
    signedIn();
    actions.deleteMyAccount.mockResolvedValueOnce({ ok: false, error: "network" });
    expect(await store.deleteAccount()).toEqual({ ok: false, error: "network" });
    expect(fake.signOut).not.toHaveBeenCalled();
    expect(store.readAccount().status).toBe("signed_in");
  });

  it("clears guest data after confirmed deletion even if B signs in before the response", async () => {
    signedIn();
    saveOwnUnit(form, []);
    await store.signInWithGoogle("/demo");
    let finishDelete!: (value: { ok: true; data: undefined }) => void;
    actions.deleteMyAccount.mockImplementationOnce(() => new Promise((resolve) => { finishDelete = resolve; }));
    const deleting = store.deleteAccount();
    await vi.waitFor(() => expect(actions.deleteMyAccount).toHaveBeenCalled());
    fake.tables.units = { data: [row("b", "B only")], error: null, status: 200 };
    switchToB();
    await vi.waitFor(() => expect(store.readAccount().status).toBe("signed_in"));
    finishDelete({ ok: true, data: undefined });
    expect(await deleting).toEqual({ ok: false, error: "superseded" });
    expect(readGuest().units).toEqual([]);
    expect(fake.signOut).not.toHaveBeenCalled();
    const next = store.readAccount();
    expect(next.status === "signed_in" && next.userId).toBe("b");
  });

  it("clears guest data after deletion even when local sign-out is not confirmed", async () => {
    signedIn();
    saveOwnUnit(form, []);
    actions.deleteMyAccount.mockResolvedValueOnce({ ok: true, data: undefined });
    fake.signOut.mockImplementationOnce(async () => ({ error: new Error("network") }));
    expect(await store.deleteAccount()).toEqual({ ok: false, error: "network" });
    expect(readGuest().units).toEqual([]);
    expect(store.readAccount()).toEqual({ status: "sign_out_error", userId: "a" });
  });
});
