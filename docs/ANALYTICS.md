# ANALYTICS.md — count-only and consented session analytics (Backdesk · باك ديسك)

Batch 4, PR 1 ("C1: anonymous counting", 2026-10-09). Decided by Amir on
2026-10-08 (consent model) and 2026-10-09 (counts only, no identifier,
`verdict_shown` carries the outcome only).

## The rule

- **Before any consent choice, after rejection, and after withdrawal:
  anonymous counting only.** No analytics identifier or consent cookie is
  created before acceptance. Every count-only event uses a fresh random
  `distinct_id`. A fixed localStorage value `backdesk:analytics-rejected=1`
  remembers a rejection or withdrawal; it contains no identifier. No person
  profile, IP address sent to PostHog, or session replay.
- **After explicit acceptance:** a six-hour signed, HttpOnly, SameSite=Lax
  consent cookie lets the server derive one `distinct_id` for that consent
  session. The browser never sees the ID or signing secret. The ID is shared
  across landing and calculator, navigation, reload, and tabs. Earlier
  count-only events remain separate. Withdrawal clears the cookie; later
  events return to count-only. There is no posthog-js, autocapture, user
  identification, or replay in this change.
- **Nothing is sent without `NEXT_PUBLIC_POSTHOG_KEY`** (local dev, CI, the
  main e2e build).
- **Never** an amount, an apartment name, an email, or free text. Every
  property is a value from a fixed list in `src/lib/analytics/events.ts`;
  the route refuses anything else.
- The privacy page (`/privacy`) describes exactly this, and is updated in
  the same pull request as any change to it (BUILD_PLAN.md Phase 0b).
- The consent bar offers equal accept and reject actions. The Privacy page
  can reopen the choice. Other PR C ideas remain out of scope.

## How an event travels

1. The page calls `track()` (`src/lib/analytics/track.ts`, ~1 KB, no
   library). It sends a small `text/plain` body with `navigator.sendBeacon`
   (a `fetch` with `keepalive` as fallback) to this site's own
   **`POST /api/e`**. A first-party path is not on ad-block lists, and
   `/api` already skips the language routing (`src/proxy.ts`).
2. The route (`src/app/api/e/route.ts`):
   - does nothing without the key; refuses requests from other sites
     (`Sec-Fetch-Site`, or `Origin` = host), bodies over 2 KB, and anything
     outside the catalogue (Zod, strict objects);
   - drops robots that run JavaScript (Googlebot, Lighthouse, headless
     Chrome…);
   - adds `in_app_browser` (from the request's user agent, with
     `detectInAppBrowser`), `env` (`VERCEL_ENV`: production, preview,
     development) and `country` (Vercel's `x-vercel-ip-country`, two
     letters);
   - forwards to `${NEXT_PUBLIC_POSTHOG_HOST}/i/v0/e/` with a **new random
     `distinct_id` for every count-only event**, or a server-derived session
     ID only with valid consent, `$process_person_profile: false` and
     `$geoip_disable: true`. PostHog only ever sees Vercel's server, never
     the visitor's IP or user agent.
3. One page view counts each flow event at most once
   (`src/lib/analytics/flow-events.ts`). A language switch or a remount
   does not count again; a reload is a new page view and can.

Unconsented funnels are read **by counts**, step over step. Accepted events
can be grouped within the six-hour consent session, including across the
landing and calculator flow; never join them to earlier events.

## Consent proof and limitation

`POST /api/analytics-consent` accepts only strict JSON from the exact same
origin (Origin and Fetch Metadata checks). Acceptance requires the server-only
`ANALYTICS_CONSENT_SECRET` to be set to at least 32 UTF-8 bytes; otherwise it
returns 503 and linking fails closed. Its HMAC-signed cookie uses `Secure` and
the `__Host-` prefix on HTTPS. `GET` verifies it without caching. Neither
endpoint sets a session ID in browser storage. Consent does not change the
strict event-property allowlist.

**Stateless revocation limitation:** withdrawal deletes the browser's cookie,
but a copy of a still-valid cookie retained elsewhere can be replayed until
its six-hour expiry. A request already in flight at withdrawal can also be
processed with that cookie. No revocation database or extra infrastructure is
used in this PR. Rotating `ANALYTICS_CONSENT_SECRET` invalidates all existing
consent cookies. Do not log, share, or expose cookie values.

## Event catalogue

Every event carries `locale` (`ar` | `en`) and `display_mode`
(`browser` | `standalone`) from the page, and `in_app_browser` (boolean),
`env` and `country` from the route.

| Event | When | Own properties | Status |
|---|---|---|---|
| `landing_view` | The landing page is shown to a new visitor (not to one sent on to the app) | `utm_source`, `utm_medium`, `utm_campaign`: lowercased, `[a-z0-9_-]{1,40}`, otherwise `other`; absent when the link has none. Not sent when the visitor arrives from the other language's landing (a language switch) | Sent from PR 2 |
| `landing_cta_click` | Tap on the landing page's one button | none | Sent from PR 2 |
| `first_run_started` | `/demo/start` shows its first question with nothing answered yet | `entry`: `landing` (opened from the landing button, `?from=landing`) or `other` | Sent from PR 1 |
| `verdict_shown` | The flow's result (مكسب / خسارة) is on screen | `entry` (as above, for this page view); `outcome`: `profit` or `loss` (never the amount) | Sent from PR 1 |

`entry` is read once per page view from `?from=landing` and removed from
the address bar at once. A verdict reached in a later page view (after a
reload) counts with `entry: other`.

The landing page's two events are not sent by `track()` but by a small
inline script in the page's HTML (`src/lib/analytics/landing-events-script.ts`),
so the landing ships no client JavaScript of its own. It builds the same
body as `track()` (a unit test compares them) and is rendered only when
`NEXT_PUBLIC_POSTHOG_KEY` is set at build time.

## Setup (Amir, by hand)

1. PostHog → create a project in **EU Cloud**. Project settings: turn on
   **"Discard client IP data"**; leave session replay, autocapture,
   heatmaps and surveys off (nothing on the site uses them).
2. Vercel → project → Settings → Environment Variables, for **Production
   and Preview**:
   - `NEXT_PUBLIC_POSTHOG_KEY` = the project API key (`phc_…`; public by
     design, like the Supabase publishable key);
   - `NEXT_PUBLIC_POSTHOG_HOST` = `https://eu.i.posthog.com`.
   - `ANALYTICS_CONSENT_SECRET` = a unique random server-only value of at
     least 32 bytes in each environment. Never prefix it with `NEXT_PUBLIC_`.
   Values are inlined at build time: **redeploy** after adding or changing
   them.
3. Check Preview with a fresh browser: before choice, events have different
   IDs. Accept, reload and navigate landing → calculator; those later events
   share one ID. Reject or withdraw and verify subsequent events have fresh,
   different IDs. Confirm no prior event acquired the accepted ID. Repeat in
   two tabs and on a phone. Check `env = preview`, and verify PostHog project
   settings (EU Cloud, discard IP, replay/autocapture off) manually before
   production promotion.

## Funnels and insights to build in PostHog

Filter every insight to `env = production`.

1. **Landing funnel** (Trends, numbers, one series per event, same date
   range):
   `landing_view` → `landing_cta_click` → `first_run_started` where
   `entry = landing` → `verdict_shown` where `entry = landing`.
   Read it as step-over-step ratios (for example clicks ÷ views). Break
   down by `utm_source` and by `in_app_browser`.
2. **Flow completion, all entries:** `verdict_shown` ÷ `first_run_started`
   (BUILD_PLAN.md §1 target: calculator completion ≥ 60%). Break down by
   `entry`.
3. **Outcome mix:** `verdict_shown` broken down by `outcome`.
4. **Where visitors come from:** `landing_view` broken down by `country`,
   `utm_source`, `in_app_browser`, `locale`.

Counts are approximate in both directions: a reload can count a step
twice, and an ad blocker or a closed tab can drop one. Count-only events
cannot be deduplicated across page views, by design.

## Tests

- `src/lib/analytics/*.test.ts`: the catalogue, `utmValue`, the sender (no
  key → nothing; one text/plain beacon; no storage write from the sender;
  never throws), once-per-page-view flow events, and a guard that no other
  source file sends a beacon, names `/api/e` or talks to PostHog.
- `src/app/api/e/route.test.ts`: forwards count-only events with fresh IDs
  and accepted events with a shared ID, no IP and no user agent; refuses other sites, robots, extra fields,
  unknown events, bad utm values and oversized bodies; 204 without the key
  or when PostHog is unreachable.
- `src/test/screens/first-run.test.tsx`: the flow sends the two events once,
  with `entry` and `outcome`, and nothing without the key.
- `e2e/analytics-env.spec.ts` (`playwright.analytics.config.ts`, a build
  with a placeholder key and a `.invalid` host): the real flow in Chromium
  sends events in order, with no amount or extra host; before consent it
  sets no cookie or new storage. Consent tests cover choices, reload and tabs;
  the real route answers 204,
  403 and 400. The main e2e build has no key, and `e2e/first-run.spec.ts`
  and `e2e/calculator.spec.ts` fail on any non-GET request there.
