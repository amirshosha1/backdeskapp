import { useSyncExternalStore } from "react";

/**
 * Screen state in the query string (`?tab=all`, `?step=price`), the way
 * Home keeps `?view=`: the language switch carries the query across its
 * navigation, so a switch keeps the screen as it was, and a bare reload of
 * the plain URL always starts from the default (what the tap crawler
 * relies on). Writes use `history.replaceState`: no router navigation, no
 * back/forward entry per tap. Only UI state goes here — never the
 * visitor's numbers, which would then reach the server with the URL.
 */

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

function read(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

/** Sets (or, with null, removes) one query parameter in place. */
export function setQueryParam(name: string, value: string | null): void {
  try {
    const url = new URL(window.location.href);
    if (value === null) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    window.history.replaceState(window.history.state, "", url);
  } catch {
    // A restricted context: the state just won't survive a reload.
  }
  listeners.forEach((listener) => listener());
}

/** One query parameter; null on the server and before hydration. */
export function useQueryParam(name: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(name),
    () => null,
  );
}
