import { useSyncExternalStore } from "react";
import type { OperatingModel } from "@/lib/finance";
import type { FirstRunAnswers } from "@/lib/first-run/flow";

/**
 * The first-run flow's answers while the visitor is answering. They live in
 * sessionStorage, never in the URL: a reload or a language switch sends the
 * URL to the server, and the visitor's numbers must stay in the browser.
 * Only the step travels in the query string. Closing the tab forgets them;
 * the unit itself is saved (localStorage) when the verdict is reached.
 */

export const FIRST_RUN_ANSWERS_KEY = "backdesk:first-run";

const MODELS: OperatingModel[] = ["owner_operated", "rental_arbitrage", "managed_for_owner"];
const listeners = new Set<() => void>();
let cache: { raw: string | null; answers: FirstRunAnswers | null } | null = null;

function parse(raw: string | null): FirstRunAnswers | null {
  if (!raw) return null;
  try {
    const x = JSON.parse(raw) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const model = x.model === null || MODELS.includes(x.model as OperatingModel) ? (x.model as OperatingModel | null) : undefined;
    const [adr, nights, rent, commission] = [num(x.adr), num(x.nights), num(x.rent), num(x.commission)];
    if (model === undefined || adr === null || nights === null || rent === null || commission === null) return null;
    return { model, adr, nights, rent, commission };
  } catch {
    return null;
  }
}

/** Where the answers live when sessionStorage is blocked: this page view only. */
let memoryRaw: string | null = null;

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(FIRST_RUN_ANSWERS_KEY);
  } catch {
    return memoryRaw;
  }
}

export function readFirstRunAnswers(): FirstRunAnswers | null {
  const raw = readRaw();
  if (cache && cache.raw === raw) return cache.answers;
  cache = { raw, answers: parse(raw) };
  return cache.answers;
}

export function writeFirstRunAnswers(answers: FirstRunAnswers | null): void {
  const raw = answers === null ? null : JSON.stringify(answers);
  try {
    if (raw === null) window.sessionStorage.removeItem(FIRST_RUN_ANSWERS_KEY);
    else window.sessionStorage.setItem(FIRST_RUN_ANSWERS_KEY, raw);
  } catch {
    // Storage blocked: the answers live for this page view only.
    memoryRaw = raw;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The stored answers, or null (nothing stored yet, or the server render). */
export function useFirstRunAnswers(): FirstRunAnswers | null {
  return useSyncExternalStore(subscribe, readFirstRunAnswers, () => null);
}
