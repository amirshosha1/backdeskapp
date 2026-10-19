import { setQueryParam } from "@/lib/url-state";
import { campaignTags } from "./campaign-tags";
import type { Entry, Model, Outcome } from "./events";
import { track } from "./track";

/**
 * The first-run flow's three events, each at most once per page view (the
 * flow's steps change with replaceState, so one page view is one run; a
 * language switch or a remount does not count again, a reload does).
 *
 * `entry` is "landing" only when the landing page's button opened the flow
 * (`/demo/start?from=landing`); the marker is read once and removed from
 * the address bar. Everything else is "other".
 *
 * `calc_start` and `verdict_shown` also carry the visit's campaign labels
 * (campaign-tags.ts) and the picked model. `first_run_started` does not: it
 * fires before any answer, so it carries no model and no labels and is never
 * counted as a landing (GTM:D-063).
 */

const FROM_PARAM = "from";
let entry: Entry | null = null;
let startedSent = false;
let calcStartSent = false;
let verdictSent = false;

/** Reads (once) and removes the `from` marker and the utm_* labels (campaign-tags.ts). */
export function firstRunEntry(): Entry {
  if (entry !== null) return entry;
  // The campaign labels leave the address bar with the marker, in the same read.
  campaignTags();
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

/** A model was actually picked (never a default): once per page view. */
export function trackCalcStart(model: Model): void {
  if (calcStartSent) return;
  calcStartSent = true;
  track("calc_start", { ...campaignTags(), model });
}

/** The verdict is on screen: only whether it is a profit or a loss, never the amount. */
export function trackVerdictShown(outcome: Outcome, model: Model): void {
  if (verdictSent) return;
  verdictSent = true;
  track("verdict_shown", { ...campaignTags(), entry: firstRunEntry(), outcome, model });
}

export function resetFlowEventsForTests(): void {
  entry = null;
  startedSent = false;
  calcStartSent = false;
  verdictSent = false;
}
