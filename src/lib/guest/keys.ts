/**
 * The browser-storage key for the visitor's data, and the first-run check
 * as an inline script. No React here: Home's server component renders the
 * script into its static HTML.
 */

export const GUEST_KEY = "backdesk:guest";
export const GUEST_VERSION = 1;

/**
 * The same check as `needsFirstRun` (store.ts), run while Home's static
 * HTML is parsed, before anything paints: a first visit goes straight to
 * the flow instead of flashing Home. Client-side navigation to Home is
 * covered by `FirstRunGate`. Blocked storage throws and does nothing.
 */
export const FIRST_RUN_REDIRECT_SCRIPT = `(function(){try{var r=localStorage.getItem(${JSON.stringify(GUEST_KEY)});var s=r?JSON.parse(r):null;var ok=s&&s.v===${GUEST_VERSION};if(!(ok&&((s.firstRun&&s.firstRun.seen===true)||(Array.isArray(s.units)&&s.units.length>0)))){location.replace(location.pathname.replace(/\\/$/,"")+"/start")}}catch(e){}})();`;
