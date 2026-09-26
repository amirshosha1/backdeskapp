import type { ComponentProps } from "react";

/**
 * Test double for `@/i18n/navigation`. Component tests render Screens in
 * isolation (no App Router context), so `next-intl`'s Link — which reads
 * router context to localize `href` — is swapped for a plain anchor. Actual
 * cross-page navigation is proven by the Playwright e2e suite against a
 * running server.
 */
export function Link({ href, children, ...props }: ComponentProps<"a"> & { href: string }) {
  return (
    <a href={typeof href === "string" ? href : String(href)} {...props}>
      {children}
    </a>
  );
}

export function usePathname() {
  return "/";
}

export function useRouter() {
  return { push: () => {}, replace: () => {}, prefetch: () => {}, back: () => {} };
}

export function getPathname() {
  return "/";
}

export function redirect() {
  return undefined;
}
