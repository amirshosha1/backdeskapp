import type { Page } from "@playwright/test";

/**
 * The visitor's browser state for e2e (src/lib/guest/): every spec starts
 * with the first-run flow already seen (playwright.config.ts), so the app
 * entry shows Home. Specs that need another state set it here. Not a spec
 * file: spec files must not import each other.
 */

export const BASE_URL = "http://127.0.0.1:3000";
export const GUEST_KEY = "backdesk:guest";
export const FIRST_RUN_ANSWERS_KEY = "backdesk:first-run";

/** The calculator's rental-arbitrage example, as the visitor's form values. */
const EXAMPLE_VALUES = {
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
};

export type GuestState = { v: 1; firstRun: { seen: boolean; count: string | null }; units: unknown[] };

export const SEEN: GuestState = { v: 1, firstRun: { seen: true, count: null }, units: [] };

export function withOwnUnit(model = "rental_arbitrage", assumed: string[] = ["platformFeePercent"]): GuestState {
  return {
    v: 1,
    firstRun: { seen: true, count: "1" },
    units: [
      {
        id: "own-1",
        engineVersion: "1.0.0",
        form: {
          operatingModel: model,
          values: EXAMPLE_VALUES,
          commission: { basis: "net_payout", hybridMode: "max", hybridBasis: "gross_revenue", includeCleaningFees: true },
        },
        assumed,
      },
    ],
  };
}

/** For `test.use({ storageState })`: the guest state already in the browser when a test starts. */
export function storageStateFor(state: GuestState | null, origin = BASE_URL) {
  return {
    cookies: [],
    origins: state === null ? [] : [{ origin, localStorage: [{ name: GUEST_KEY, value: JSON.stringify(state) }] }],
  };
}

/**
 * Re-seeds the guest state (or clears it, for null) and forgets the flow's
 * answers before *every* document load. The tap crawler reloads before each
 * tap and needs the same starting state each time: a tap that saves
 * something must not leak into the next reload (PROGRESS.md, P.1.1 notes).
 */
export async function resetGuestOnEveryLoad(page: Page, state: GuestState | null) {
  await page.addInitScript(
    ([key, value, answersKey]) => {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(answersKey!);
    },
    [GUEST_KEY, state === null ? null : JSON.stringify(state), FIRST_RUN_ANSWERS_KEY] as const,
  );
}

/** Puts the flow's answers in this tab's sessionStorage before every load (to open a later step directly). */
export async function seedFirstRunAnswers(page: Page, answers: Record<string, unknown>) {
  await page.addInitScript(([key, value]) => window.sessionStorage.setItem(key!, value!), [FIRST_RUN_ANSWERS_KEY, JSON.stringify(answers)] as const);
}
