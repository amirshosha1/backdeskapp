/**
 * Height of the floating navigation pill plus its bottom offset and the
 * iPhone home bar. Tab screens reserve this much space at the bottom so the
 * last content is never hidden behind the pill.
 *
 * Kept outside `bottom-nav.tsx` because values exported from a
 * "use client" module reach Server Components as client references, not
 * plain strings.
 */
export const BOTTOM_NAV_CLEARANCE = "calc(7rem + env(safe-area-inset-bottom))";
