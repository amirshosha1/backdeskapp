import { GUEST_KEY, GUEST_VERSION } from "@/lib/guest/keys";

/**
 * The landing page (/, /en) is for new visitors only (Batch 4): someone
 * with an apartment saved in this browser, or signed in, goes straight to
 * the app as before. The page is static, so the check runs as an inline
 * script, first in <body>, before anything paints: it hides the page,
 * marks it as leaving (the analytics script then sends nothing) and
 * replaces the URL with /demo (/en/demo), keeping the query string.
 * Crawlers, link previews and first visits get the full page; without
 * JavaScript nothing happens.
 *
 * Signed-in people need the cookie check: their browser copy of the
 * apartment is cleared once it moves to the account. The Supabase session
 * cookie is readable by design (the app checks it the same way with
 * `hasAuthCookie`); its name is inlined at build, and a build without
 * accounts leaves the check out. Blocked storage throws and does nothing.
 */

/** Set on <html> while the page is leaving for the app. */
export const LEAVING_ATTR = "data-leaving";

/** The same pattern as `hasAuthCookie` (src/lib/supabase/env.ts): the cookie, or its `.0`, `.1`… chunks, with a value. */
function cookiePattern(authCookie: string): string {
  const escaped = authCookie.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `(?:^|;\\s*)${escaped}(?:\\.\\d+)?=[^;]`;
}

export function landingRedirectScript(authCookie: string | null): string {
  const signedIn = authCookie ? `||new RegExp(${JSON.stringify(cookiePattern(authCookie))}).test(document.cookie)` : "";
  return (
    `(function(){function back(){var s=null;try{var r=localStorage.getItem(${JSON.stringify(GUEST_KEY)});s=r?JSON.parse(r):null}catch(e){}` +
    `var saved=!!s&&s.v===${GUEST_VERSION}&&Array.isArray(s.units)&&s.units.length>0;try{return saved${signedIn}}catch(e){return saved}}` +
    `function go(){var h=document.documentElement;h.setAttribute(${JSON.stringify(LEAVING_ATTR)},"");h.style.visibility="hidden";` +
    `location.replace((/^\\/en(\\/|$)/.test(location.pathname)?"/en":"")+"/demo"+location.search+location.hash)}` +
    `try{if(back())go()}catch(e){}` +
    // Back/forward cache: a page restored after leaving must not stay hidden.
    `addEventListener("pageshow",function(e){if(!e.persisted)return;try{if(back())return go()}catch(x){}` +
    `var h=document.documentElement;h.removeAttribute(${JSON.stringify(LEAVING_ATTR)});h.style.visibility=""})})();`
  );
}
