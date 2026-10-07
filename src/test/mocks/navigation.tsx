import type { ComponentProps } from "react";
import { vi } from "vitest";

/**
 * Test double for `@/i18n/navigation`. Component tests render Screens in
 * isolation (no App Router context), so `next-intl`'s Link — which reads
 * router context to localize `href` — is swapped for a plain anchor. Actual
 * cross-page navigation is proven by the Playwright e2e suite against a
 * running server.
 */
export function Link({
  href,
  children,
  replace,
  ...props
}: ComponentProps<"a"> & { href: string; replace?: boolean }) {
  return (
    <a href={typeof href === "string" ? href : String(href)} data-replace={replace ? "" : undefined} {...props}>
      {children}
    </a>
  );
}

export function usePathname() {
  return "/";
}

/** One router for every component in a test, so a test can assert where a screen sent the visitor. */
export const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() };

export function useRouter() {
  return router;
}

export function getPathname() {
  return "/";
}

export function redirect() {
  return undefined;
}
