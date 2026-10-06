/**
 * The Backdesk key mark: ring on the left, a horizontal shaft, and three bars
 * standing up above it that grow taller left to right (the tallest is mint).
 *
 * The orientation is fixed and identical in Arabic and English: the SVG is never
 * mirrored, so no `rtl:` utility or transform may ever be applied to it. It is
 * decorative (`aria-hidden`); the element that wraps it carries the accessible
 * name (the brand name), see `LogoMark`.
 */
export function BrandMark() {
  return (
    <svg width="32" height="32" viewBox="11.5 11 96 96" aria-hidden="true" focusable="false">
      <rect x="60" y="52" width="10" height="18" rx="3" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="74.5" y="41" width="10" height="29" rx="3" fill="#FFFFFF" fillOpacity="0.8" />
      <rect x="89" y="29" width="10" height="41" rx="3" fill="#7FE3B3" />
      <rect x="46" y="65.5" width="58" height="9" rx="4.5" fill="#FFFFFF" />
      <circle cx="34" cy="70" r="14.5" fill="none" stroke="#FFFFFF" strokeWidth="9" />
    </svg>
  );
}
