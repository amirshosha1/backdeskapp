import { ANALYTICS_PATH, type AnalyticsEvent, type CommonProps, type EventProps } from "./events";

/**
 * Sends one anonymous event to this site's own route (src/app/api/e),
 * which forwards it to PostHog EU. Nothing at all happens without
 * NEXT_PUBLIC_POSTHOG_KEY (local, CI, e2e). No cookie, no storage, no
 * identifier: the body holds the event, its fixed-value properties, the
 * page's language and whether the app runs installed. It never throws.
 *
 * `sendBeacon` survives the navigation that often follows a tap; the body
 * is text/plain so the browser treats it as a simple same-origin request.
 */
export function track<E extends AnalyticsEvent>(event: E, props: EventProps[E]): void {
  // Read by its literal name so Next.js inlines it at build time.
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    const body = JSON.stringify({ event, properties: { ...props, ...commonProps() } });
    const beacon = typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ANALYTICS_PATH, new Blob([body], { type: "text/plain;charset=UTF-8" }));
    if (beacon) return;
    void fetch(ANALYTICS_PATH, {
      method: "POST",
      body,
      headers: { "content-type": "text/plain;charset=UTF-8" },
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    // Analytics must never break the page.
  }
}

function commonProps(): CommonProps {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches === true || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return {
    locale: document.documentElement.lang === "en" ? "en" : "ar",
    display_mode: standalone ? "standalone" : "browser",
  };
}
