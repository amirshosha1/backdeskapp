import { afterEach, describe, expect, it, vi } from "vitest";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { ENGINE_VERSION } from "@/lib/finance";
import {
  EMPTY_GUEST,
  GUEST_KEY,
  needsFirstRun,
  parseGuest,
  readGuest,
  saveOwnUnit,
  setApartmentCount,
  setFirstRunSeen,
  visibleAssumed,
} from "./store";
import { readFirstRunAnswers, writeFirstRunAnswers } from "./first-run-answers";

const example = CALCULATOR_PRESETS[0]!.form;

afterEach(() => vi.restoreAllMocks());

describe("guest store", () => {
  it("starts empty and remembers the seen flag, the apartment count and one unit", () => {
    expect(readGuest()).toEqual(EMPTY_GUEST);
    setFirstRunSeen();
    setApartmentCount("2-3");
    saveOwnUnit(example, ["deposit"]);
    const state = parseGuest(window.localStorage.getItem(GUEST_KEY));
    expect(state.firstRun).toEqual({ seen: true, count: "2-3" });
    expect(state.units).toHaveLength(1);
    expect(state.units[0]).toMatchObject({ id: "own-1", engineVersion: ENGINE_VERSION, assumed: ["deposit"] });
    expect(state.units[0]!.form.values.rent).toBe("35000");
  });

  it("stores inputs only: no results and no locale", () => {
    saveOwnUnit(example, []);
    const raw = window.localStorage.getItem(GUEST_KEY)!;
    expect(raw).not.toMatch(/netProfit|locale|"ar"|"en"/);
  });

  it("falls back to the empty state for corrupt JSON, another version or the wrong shape", () => {
    expect(parseGuest("{not json")).toEqual(EMPTY_GUEST);
    expect(parseGuest(JSON.stringify({ v: 2, firstRun: { seen: true }, units: [] }))).toEqual(EMPTY_GUEST);
    expect(parseGuest(JSON.stringify(["x"]))).toEqual(EMPTY_GUEST);
  });

  it("drops a unit whose form the engine would not accept, keeping the seen flag", () => {
    const bad = { ...example, values: { ...example.values, adr: "-5" } };
    const raw = JSON.stringify({ v: 1, firstRun: { seen: true, count: "9" }, units: [{ id: "own-1", engineVersion: "1", form: bad, assumed: [] }] });
    expect(parseGuest(raw)).toEqual({ v: 1, firstRun: { seen: true, count: null }, units: [] });
    const missingField = { ...example, values: { adr: "1" } };
    expect(parseGuest(JSON.stringify({ v: 1, firstRun: {}, units: [{ id: "own-1", engineVersion: "1", form: missingField, assumed: [] }] })).units).toEqual([]);
  });

  it("ignores unknown assumed fields", () => {
    const raw = JSON.stringify({ v: 1, firstRun: { seen: false }, units: [{ id: "own-1", engineVersion: "1", form: example, assumed: ["deposit", "bogus", "deposit"] }] });
    expect(parseGuest(raw).units[0]!.assumed).toEqual(["deposit"]);
  });

  it("keeps working for this page view when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    saveOwnUnit(example, []);
    expect(readGuest().units).toHaveLength(1);
    // Nothing can be remembered, so the flow must not trap the visitor on every visit.
    expect(needsFirstRun(EMPTY_GUEST)).toBe(false);
  });

  it("the app entry opens the flow only for a first visit", () => {
    expect(needsFirstRun(EMPTY_GUEST)).toBe(true);
    expect(needsFirstRun({ ...EMPTY_GUEST, firstRun: { seen: true, count: null } })).toBe(false);
    saveOwnUnit(example, []);
    expect(needsFirstRun(readGuest())).toBe(false);
  });

  it("only inputs the visitor can see count toward the تجريبي tag", () => {
    // Owner-operated: rent, deposit and the commission terms are hidden, so they never count.
    const owner = { ...example, operatingModel: "owner_operated" as const };
    expect(visibleAssumed(owner, ["rent", "deposit", "commissionPercent", "commissionBasis"])).toEqual([]);
    expect(visibleAssumed(owner, ["repairs"])).toEqual(["repairs"]);
    const managed = { ...example, operatingModel: "managed_for_owner" as const };
    expect(visibleAssumed(managed, ["commissionBasis", "fixedFee"])).toEqual(["commissionBasis"]);
  });
});

describe("first-run answers (sessionStorage)", () => {
  it("round-trips the answers and forgets them on null", () => {
    expect(readFirstRunAnswers()).toBeNull();
    writeFirstRunAnswers({ model: "rental_arbitrage", adr: 2600, nights: 20, rent: 30000, commission: 20 });
    expect(readFirstRunAnswers()).toEqual({ model: "rental_arbitrage", adr: 2600, nights: 20, rent: 30000, commission: 20 });
    expect(window.localStorage.length).toBe(0);
    writeFirstRunAnswers(null);
    expect(readFirstRunAnswers()).toBeNull();
  });

  it("rejects a malformed payload", () => {
    window.sessionStorage.setItem("backdesk:first-run", JSON.stringify({ model: "hotel", adr: 1, nights: 1, rent: 1, commission: 1 }));
    expect(readFirstRunAnswers()).toBeNull();
    window.sessionStorage.setItem("backdesk:first-run", "{");
    expect(readFirstRunAnswers()).toBeNull();
  });
});
