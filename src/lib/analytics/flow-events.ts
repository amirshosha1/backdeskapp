import { setQueryParam } from "@/lib/url-state";
import type { Entry, Outcome } from "./events";
import { track } from "./track";

/**
 * The first-run flow's two events, each at most once per page view (the
 * flow's steps change with replaceState, so one page view is one run; a
 * language switch or a remount does not count again, a reload does).
 *
 * `entry` is "landing" only when the landing page's button opened the flow
 * (`/demo/start?from=landing`); the marker is read once and removed from
 * the address bar. Everything else is "other".
 */

const FROM_PARAM = "from";
let entry: Entry | null = null;
let startedSent = false;
let verdictSent = false;

/** Reads (once) and removes the `from` marker. */
export function firstRunEntry(): Entry {
  if (entry !== null) return entry;
  let from: string | null = null;
  try {
    from = new URLSearchParams(window.location.search).get(FROM_PARAM);
  } catch {
    from = null;
  }
  entry = from === "landing" ? "landing" : "other";
  if (from !== null) setQueryParam(FROM_PARAM, null);
  return entry;
}

/** The first question is on screen with nothing answered yet. */
export function trackFirstRunStarted(): void {
  const from = firstRunEntry();
  if (startedSent) return;
  startedSent = true;
  track("first_run_started", { entry: from });
}

/** The verdict is on screen: only whether it is a profit or a loss, never the amount. */
export function trackVerdictShown(outcome: Outcome): void {
  if (verdictSent) return;
  verdictSent = true;
  track("verdict_shown", { entry: firstRunEntry(), outcome });
}

export function resetFlowEventsForTests(): void {
  entry = null;
  startedSent = false;
  verdictSent = false;
}
