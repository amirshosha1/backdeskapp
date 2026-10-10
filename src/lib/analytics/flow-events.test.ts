import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { firstRunEntry, resetFlowEventsForTests, trackFirstRunStarted, trackVerdictShown } from "./flow-events";

const track = vi.hoisted(() => vi.fn());
vi.mock("./track", () => ({ track }));

beforeEach(() => resetFlowEventsForTests());
afterEach(() => vi.clearAllMocks());

describe("first-run flow events", () => {
  it("entry is 'landing' only with ?from=landing, and the marker leaves the address bar", () => {
    window.history.replaceState(null, "", "/demo/start?from=landing&utm_source=fb");
    expect(firstRunEntry()).toBe("landing");
    expect(window.location.search).toBe("?utm_source=fb");
    // Read once per page view.
    expect(firstRunEntry()).toBe("landing");
  });

  it("anything else is 'other'", () => {
    window.history.replaceState(null, "", "/demo/start?from=home");
    expect(firstRunEntry()).toBe("other");
    expect(window.location.search).toBe("");
  });

  it("each event at most once per page view, carrying the entry", () => {
    window.history.replaceState(null, "", "/demo/start?from=landing");
    trackFirstRunStarted();
    trackFirstRunStarted();
    trackVerdictShown("loss");
    trackVerdictShown("profit");
    expect(track.mock.calls).toEqual([
      ["first_run_started", { entry: "landing" }],
      ["verdict_shown", { entry: "landing", outcome: "loss" }],
    ]);
  });
});
