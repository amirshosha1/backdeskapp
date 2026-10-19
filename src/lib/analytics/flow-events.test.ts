import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetCampaignTagsForTests } from "./campaign-tags";
import { firstRunEntry, resetFlowEventsForTests, trackCalcStart, trackFirstRunStarted, trackVerdictShown } from "./flow-events";

const track = vi.hoisted(() => vi.fn());
vi.mock("./track", () => ({ track }));

beforeEach(() => {
  resetFlowEventsForTests();
  resetCampaignTagsForTests();
});
afterEach(() => vi.clearAllMocks());

describe("first-run flow events", () => {
  it("entry is 'landing' only with ?from=landing, and the marker leaves the address bar", () => {
    window.history.replaceState(null, "", "/demo/start?from=landing&q=1");
    expect(firstRunEntry()).toBe("landing");
    expect(window.location.search).toBe("?q=1");
    // Read once per page view.
    expect(firstRunEntry()).toBe("landing");
  });

  it("anything else is 'other'", () => {
    window.history.replaceState(null, "", "/demo/start?from=home");
    expect(firstRunEntry()).toBe("other");
    expect(window.location.search).toBe("");
  });

  it("each event at most once per page view; first_run_started carries the entry only", () => {
    window.history.replaceState(null, "", "/demo/start?from=landing");
    trackFirstRunStarted();
    trackFirstRunStarted();
    trackCalcStart("rental_arbitrage");
    trackCalcStart("owner_operated");
    trackVerdictShown("loss", "rental_arbitrage");
    trackVerdictShown("profit", "owner_operated");
    expect(track.mock.calls).toEqual([
      ["first_run_started", { entry: "landing" }],
      ["calc_start", { model: "rental_arbitrage" }],
      ["verdict_shown", { entry: "landing", outcome: "loss", model: "rental_arbitrage" }],
    ]);
  });
});

describe("campaign labels (GTM:D-063)", () => {
  it("calc_start and verdict_shown carry the visit's utm_* labels and the model; first_run_started never does", () => {
    window.history.replaceState(null, "", "/demo/start?from=landing&utm_source=Facebook&utm_medium=social&utm_campaign=oct-1&utm_content=Hook-A");
    trackFirstRunStarted();
    trackCalcStart("managed_for_owner");
    trackVerdictShown("profit", "managed_for_owner");
    const tags = { utm_source: "facebook", utm_medium: "social", utm_campaign: "oct-1", utm_content: "hook-a" };
    expect(track.mock.calls).toEqual([
      ["first_run_started", { entry: "landing" }],
      ["calc_start", { ...tags, model: "managed_for_owner" }],
      ["verdict_shown", { ...tags, entry: "landing", outcome: "profit", model: "managed_for_owner" }],
    ]);
    // The labels leave the address bar at once and live in memory only.
    expect(window.location.search).toBe("");
  });

  it("a direct untagged visit carries no label", () => {
    window.history.replaceState(null, "", "/demo/start");
    trackCalcStart("owner_operated");
    expect(track).toHaveBeenCalledWith("calc_start", { model: "owner_operated" });
  });

  it("a repeat tagged visit is tagged again, from its own URL (nothing is remembered between page views)", () => {
    window.history.replaceState(null, "", "/demo/start?utm_source=fb&utm_content=a");
    trackCalcStart("owner_operated");
    resetFlowEventsForTests();
    resetCampaignTagsForTests();
    window.history.replaceState(null, "", "/demo/start?utm_source=ig&utm_content=b");
    trackCalcStart("owner_operated");
    expect(track.mock.calls.map(([, p]) => p)).toEqual([
      { utm_source: "fb", utm_content: "a", model: "owner_operated" },
      { utm_source: "ig", utm_content: "b", model: "owner_operated" },
    ]);
    // A reload without the labels starts untagged.
    resetFlowEventsForTests();
    resetCampaignTagsForTests();
    window.history.replaceState(null, "", "/demo/start");
    trackCalcStart("owner_operated");
    expect(track.mock.calls[2]![1]).toEqual({ model: "owner_operated" });
  });

  it("the labels survive a client-side move to another screen (same page view)", () => {
    window.history.replaceState(null, "", "/demo/start?utm_source=fb&utm_content=a");
    trackCalcStart("owner_operated");
    window.history.pushState(null, "", "/demo/calculator");
    trackVerdictShown("profit", "owner_operated");
    expect(track.mock.calls[1]![1]).toMatchObject({ utm_source: "fb", utm_content: "a" });
  });

  it("free text becomes 'other', never itself", () => {
    window.history.replaceState(null, "", "/demo/start?utm_campaign=" + encodeURIComponent("اسم 01001234567"));
    trackCalcStart("owner_operated");
    expect(track).toHaveBeenCalledWith("calc_start", { utm_campaign: "other", model: "owner_operated" });
  });
});
