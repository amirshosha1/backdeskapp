/**
 * Where sign-in sends people back to, without ever putting it in a URL.
 *
 * Supabase must be told exactly `<origin>/auth/callback`, with no query
 * string (its redirect allow-list holds exact paths). The page the person
 * started from travels in a short-lived first-party cookie instead, and the
 * callback only follows it if it is one of the app's own pages: anything
 * else (another site, `//host`, a backslash, `..`, encoded tricks, control
 * characters) falls back to the Units screen. This module has no browser or
 * server dependency so both sides and the tests share it.
 */

export const CALLBACK_PATH = "/auth/callback";
/** The page to return to after sign-in (set by the browser, read and deleted by the callback). */
export const NEXT_COOKIE = "bd_next";
/** A one-shot notice for the page the callback lands on ("signin_failed"). */
export const FLASH_COOKIE = "bd_flash";
export const NEXT_COOKIE_MAX_AGE = 600;
export const FLASH_COOKIE_MAX_AGE = 60;
export const DEFAULT_NEXT = "/demo/units";

const MAX_LENGTH = 200;
// /demo, /demo/units, /en/demo/units/downtown-cairo/statement, /privacy, /en/privacy.
const ALLOWED = /^\/(?:en\/)?(?:demo(?:\/[A-Za-z0-9_-]+)*|privacy)$/;

/** The exact callback address for this origin: never a query string, never a fragment. */
export function callbackUrl(origin: string): string {
  return `${new URL(origin).origin}${CALLBACK_PATH}`;
}

/** The page to send someone to after sign-in, from the (untrusted) cookie value. */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || raw.length > MAX_LENGTH * 3) return DEFAULT_NEXT;
  let path = raw;
  if (path.includes("%")) {
    try {
      path = decodeURIComponent(path);
    } catch {
      return DEFAULT_NEXT;
    }
  }
  if (path.length > MAX_LENGTH || !ALLOWED.test(path)) return DEFAULT_NEXT;
  return path;
}

/** The current page as a `next` value: the path only (the query and fragment are dropped). */
export function nextFromLocation(pathname: string): string {
  return safeNextPath(pathname.replace(/\/+$/, "") || "/");
}
