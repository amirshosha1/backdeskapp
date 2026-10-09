import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { GUEST_KEY, readGuest, saveOwnUnit } from "@/lib/guest/store";

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

const fake = {
  signInWithOAuth: vi.fn(async (_args: unknown) => ({ data: {}, error: null as null | Error })),
  signOut: vi.fn(async (_args: unknown) => ({ error: null })),
  getSession: vi.fn(async () => ({ data: { session: { user: { email: "host@example.com" } } as unknown } })),
  tables: {} as Record<string, { data: unknown; error: unknown; status: number }>,
};
const loadBrowserSupabase = vi.fn(() =>
  Promise.resolve({
    auth: { signInWithOAuth: fake.signInWithOAuth, signOut: fake.signOut, getSession: fake.getSession, onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    from: (table: string) => {
      const result = fake.tables[table] ?? { data: null, error: null, status: 200 };
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
    expect(state.email).toBe("host@example.com");
    expect(state.units.map((u) => u.name)).toEqual(["شقة التجمع", "شاليه الساحل"]);
    expect(state.units[0]!.inputs?.form).toEqual(form);
    expect(state.maxUnits).toBe(5);
    expect(state.apartmentCount).toBe("2-3");
    expect(state.loadError).toBeNull();
  });

  it("a cookie without a live session is a guest", async () => {
    document.cookie = "sb-abcd-auth-token=base64-x; Path=/";
    fake.getSession.mockResolvedValueOnce({ data: { session: null } });
    store.readAccount();
    await vi.waitFor(() => expect(store.readAccount()).toEqual({ status: "guest" }));
  });
});

describe("account store: sign-in and sign-out", () => {
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
    store.resetAccountForTests({ status: "signed_in", email: null, units: [], maxUnits: 5, apartmentCount: null, loadError: null });
    await store.signOut();
    expect(fake.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(store.readAccount()).toEqual({ status: "guest" });
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
    expect(actions.createUnit).toHaveBeenCalledWith({ name: "شقة 2", inputs: { form, assumed: [] } });
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

  it("a write that finds no session shows the person as signed out", async () => {
    signedIn();
    actions.deleteUnit.mockResolvedValueOnce({ ok: false, error: "not_signed_in" });
    await store.removeUnit("u1");
    expect(store.readAccount()).toEqual({ status: "guest" });
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
});
