import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { withOwnUnit } from "./guest";
import { SUPABASE_URL } from "../playwright.accounts.config";

/** Browser auth tests against a fake .invalid Supabase host; no production mutations. */
const USERS = {
  A: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "a@example.invalid", unitId: "11111111-1111-4111-8111-111111111111", name: "A private apartment" },
  B: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "b@example.invalid", unitId: "22222222-2222-4222-8222-222222222222", name: "B private apartment" },
} as const;
type Identity = keyof typeof USERS;
const form = withOwnUnit().units[0] as { form: unknown; assumed: string[] };
const row = (who: Identity, name: string = USERS[who].name) => ({
  id: USERS[who].unitId,
  name,
  operating_model: "rental_arbitrage",
  calculator_inputs: { form: form.form, assumed: form.assumed },
  engine_version: "1.0.0",
  created_at: "2026-10-17T00:00:00Z",
  updated_at: "2026-10-17T00:00:00Z",
});

function authCookie(who: Identity, baseURL: string) {
  const user = USERS[who];
  const exp = 2_147_483_647;
  const jwt = `e30.${Buffer.from(JSON.stringify({ sub: user.id, exp, role: "authenticated" })).toString("base64url")}.signature`;
  const session = { access_token: jwt, refresh_token: `refresh-${who}`, token_type: "bearer", expires_in: 3600, expires_at: exp,
    user: { id: user.id, email: user.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-10-17T00:00:00Z" } };
  return { name: "sb-e2e-ref-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, url: baseURL };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

async function setup(context: BrowserContext, baseURL: string) {
  let identity: Identity = "A";
  let pendingUnits: ReturnType<typeof deferred<void>> | null = null;
  let pendingAction: ReturnType<typeof deferred<void>> | null = null;
  const requests: string[] = [];
  const actionRequests: string[] = [];
  await context.addCookies([authCookie("A", baseURL)]);
  await context.route("**/en/demo/units", async (route) => {
    if (route.request().method() !== "POST" || !route.request().headers()["next-action"]) return route.continue();
    actionRequests.push(route.request().postData() ?? "");
    const hold = pendingAction;
    pendingAction = null;
    if (hold) await hold.promise;
    // Keep Next's build-specific Flight envelope, replacing only the action
    // result. The server uses the .invalid host and cannot reach a database.
    const response = await route.fetch();
    const envelope = (await response.text()).split("\n")[0];
    expect(response.status()).toBe(200);
    expect(envelope).toContain('"a":"$@1"');
    return route.fulfill({ response, body: `${envelope}\n1:${JSON.stringify({ ok: true, data: row("A", "A renamed") })}\n` });
  });
  await context.route(`${SUPABASE_URL}/**`, async (route) => {
    const url = new URL(route.request().url());
    requests.push(`${route.request().method()} ${url.pathname}`);
    if (url.pathname === "/rest/v1/units") {
      const responseIdentity = identity;
      const hold = pendingUnits;
      pendingUnits = null;
      if (hold) await hold.promise;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([row(responseIdentity)]) });
    }
    if (url.pathname === "/rest/v1/profiles" || url.pathname === "/rest/v1/org_entitlements") {
      return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    }
    if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"network failed"}' });
    throw new Error(`Unexpected Supabase request: ${route.request().method()} ${url.pathname}`);
  });
  return {
    requests,
    actionRequests,
    holdUnits: () => { pendingUnits = deferred<void>(); return pendingUnits; },
    holdAction: () => { pendingAction = deferred<void>(); return pendingAction; },
    switchTo: async (who: Identity) => { identity = who; await context.addCookies([authCookie(who, baseURL)]); },
  };
}

async function refocus(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    window.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    window.dispatchEvent(new Event("visibilitychange"));
  });
}

async function readyAsA(page: Page) {
  await page.goto("/en/demo/units");
  await expect(page.getByTestId("account-unit-card")).toContainText(USERS.A.name);
}

test("same-user refocus keeps a partly entered sheet and an in-flight save", async ({ page, context, baseURL }) => {
  const mock = await setup(context, baseURL!);
  await readyAsA(page);
  await page.getByTestId("account-add-unit").click();
  await page.getByTestId("unit-name-input").fill("Partly entered name");
  await refocus(page);
  await expect(page.getByTestId("add-unit-sheet")).toBeVisible();
  await expect(page.getByTestId("unit-name-input")).toHaveValue("Partly entered name");
  await expect(page.getByTestId("account-unit-card")).toContainText(USERS.A.name);
  await expect(page.getByTestId("toast")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByTestId("account-unit-edit").click();
  await page.getByTestId("unit-name-input").fill("A renamed");
  const held = mock.holdAction();
  await page.getByTestId("unit-rename").click();
  await expect.poll(() => mock.actionRequests.length).toBe(1);
  await refocus(page);
  await expect(page.getByTestId("unit-edit-sheet")).toBeVisible();
  held.resolve();
  await expect(page.getByTestId("account-unit-card")).toContainText("A renamed");
});

test("a cookie change without an event is detected on refocus, including in another page", async ({ page, context, baseURL }) => {
  const mock = await setup(context, baseURL!);
  await readyAsA(page);
  const other = await context.newPage();
  await other.goto("/en/demo/units");
  await expect(other.getByTestId("account-unit-card")).toContainText(USERS.A.name);
  await mock.switchTo("B");
  await refocus(page);
  await refocus(other);
  await expect(page.getByTestId("account-unit-card")).toContainText(USERS.B.name);
  await expect(other.getByTestId("account-unit-card")).toContainText(USERS.B.name);
  await expect(page.getByText(USERS.A.name)).toHaveCount(0);
  await expect(other.getByText(USERS.A.name)).toHaveCount(0);
});

test("a write after a silent cookie change cannot dispatch A's unit to B", async ({ page, context, baseURL }) => {
  const mock = await setup(context, baseURL!);
  await readyAsA(page);
  await page.getByTestId("account-unit-edit").click();
  await page.getByTestId("unit-name-input").fill("A renamed");
  await mock.switchTo("B");
  await page.getByTestId("unit-rename").click();
  await expect(page.getByTestId("account-unit-card")).toContainText(USERS.B.name);
  expect(mock.actionRequests).toEqual([]);
});

test("a pending A write cannot publish after an A to B transition", async ({ page, context, baseURL }) => {
  const mock = await setup(context, baseURL!);
  await readyAsA(page);
  await page.getByTestId("account-unit-edit").click();
  await page.getByTestId("unit-name-input").fill("A renamed");
  const held = mock.holdAction();
  await page.getByTestId("unit-rename").click();
  await expect.poll(() => mock.actionRequests.length).toBe(1);
  await mock.switchTo("B");
  await refocus(page);
  await expect(page.getByTestId("account-unit-card")).toContainText(USERS.B.name);
  held.resolve();
  await expect(page.getByText("A renamed")).toHaveCount(0);
  await expect(page.getByText(USERS.A.name)).toHaveCount(0);
});

test("a pending A read cannot publish after the cookie changes to B", async ({ page, context, baseURL }) => {
  const mock = await setup(context, baseURL!);
  const held = mock.holdUnits();
  await page.goto("/en/demo/units");
  await expect.poll(() => mock.requests.filter((r) => r === "GET /rest/v1/units").length).toBe(1);
  await mock.switchTo("B");
  held.resolve();
  await expect(page.getByTestId("account-unit-card")).toContainText(USERS.B.name);
  await expect(page.getByText(USERS.A.name)).toHaveCount(0);
});

test("failed sign-out keeps data hidden and never shows the success toast", async ({ page, context, baseURL }) => {
  const mock = await setup(context, baseURL!);
  // auth-js removes the local cookie after an HTTP 500. Simulate a browser
  // storage failure too, so the session really remains active for this case.
  await page.addInitScript(() => {
    const native = Object.getOwnPropertyDescriptor(Document.prototype, "cookie")!;
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => native.get!.call(document),
      set: (value: string) => {
        if (value.startsWith("sb-e2e-ref-auth-token=") && /Max-Age=0|expires=/i.test(value)) return;
        native.set!.call(document, value);
      },
    });
  });
  await readyAsA(page);
  await page.goto("/en/demo/more");
  await page.getByTestId("sign-out").click();
  await expect(page.getByTestId("sign-out")).toContainText("Retry sign-out");
  await expect(page.getByTestId("toast")).toContainText("Sign-out wasn't confirmed");
  await expect(page.getByTestId("toast")).not.toContainText("You're signed out");
  expect(mock.requests).toContain("POST /auth/v1/logout");
  expect((await context.cookies(baseURL)).some((c) => c.name === "sb-e2e-ref-auth-token")).toBe(true);
  await page.getByRole("link", { name: "Units" }).click();
  await expect(page.getByText(USERS.A.name)).toHaveCount(0);
});
