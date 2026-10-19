# ANALYTICS.md — anonymous counting (Backdesk · باك ديسك)

Batch 4, PR 1 ("C1: anonymous counting", 2026-10-09). Decided by Amir on
2026-10-08 (consent model) and 2026-10-09 (counts only, no identifier,
`verdict_shown` carries the outcome only).

## The rule

- **Before any consent choice (and, once PR C adds the bar, after "reject"):
  anonymous counting only.** No cookie, no localStorage or sessionStorage
  written by analytics, no identifier for a person or a device, no person
  profile, no IP address sent or stored, no session replay.
- **Nothing is sent without `NEXT_PUBLIC_POSTHOG_KEY`** (local dev, CI, the
  main e2e build).
- **Never** an amount, an apartment name, an email, or free text. Every
  property is a value from a fixed list in `src/lib/analytics/events.ts`;
  the route refuses anything else.
- The privacy page (`/privacy`) describes exactly this, and is updated in
  the same pull request as any change to it (BUILD_PLAN.md Phase 0b).
- PR C (still queued) adds the consent bar and, after "accept", the full
  PostHog library for signed-in identification, replay (everything masked)
  and error tracking. Nothing in this file changes for visitors who make no
  choice.

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
     `distinct_id` for every event**, `$process_person_profile: false` and
     `$geoip_disable: true`. PostHog only ever sees Vercel's server, never
     the visitor's IP or user agent.
3. One page view counts each flow event at most once
   (`src/lib/analytics/flow-events.ts`). A language switch or a remount
   does not count again; a reload is a new page view and can.

Because no event links to another, every funnel is read **by counts**,
step over step, not by person.

## Event catalogue

Every event carries `locale` (`ar` | `en`) and `display_mode`
(`browser` | `standalone`) from the page, and `in_app_browser` (boolean),
`env` and `country` from the route.

| Event | When | Own properties | Status |
|---|---|---|---|
| `landing_view` | The landing page is shown to a new visitor (not to one sent on to the app) | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`: lowercased, `[a-z0-9_-]{1,40}`, otherwise `other`; absent when the link has none. Not sent when the visitor arrives from the other language's landing (a language switch) | Sent from PR 2; `utm_content` from the G1 fix |
| `landing_cta_click` | Tap on the landing page's one button | none | Sent from PR 2 |
| `first_run_started` | `/demo/start` shows its first question with nothing answered yet | `entry`: `landing` (opened from the landing button, `?from=landing`) or `other` | Sent from PR 1 |
| `calc_start` | A model is **actually picked** on the flow's first question (`onPick`). Once per page view; never on load, never for a default | the four `utm_*` labels (as above, when the visit has them) and `model`: `owner_operated`, `rental_arbitrage` or `managed_for_owner` | G1 fix (GTM:D-063) |
| `verdict_shown` | The flow's result (مكسب / خسارة) is on screen | `entry` (as above, for this page view); `outcome`: `profit` or `loss` (never the amount); the four `utm_*` labels (when the visit has them); `model` | Sent from PR 1; labels and `model` from the G1 fix |

### Campaign labels (G1, GTM:D-063)

The property keys are the ones PostHog already holds; the GTM contract's names map to them:

| GTM:D-063 name | Property | URL parameter |
|---|---|---|
| `src` | `utm_source` | `utm_source` |
| `campaign` | `utm_campaign` | `utm_campaign` |
| `variant` | `utm_content` | `utm_content` |
| (not in the contract, kept) | `utm_medium` | `utm_medium` |

- Every value goes through `utmValue()`: lowercased, `[a-z0-9_-]{1,40}`, otherwise `other`, absent stays absent. Never free text, a URL, a path or a referrer.
- **No cookie, no browser storage, no identifier, no pixel, no financial input.** The landing's inline script appends the visit's `utm_*` labels to its button's link, so they cross the page load into the app in the URL. The app reads them once (`campaign-tags.ts`), removes them from the address bar and keeps them in memory for that page view. A reload, or a visit without them, starts untagged. A visitor with JavaScript off, or a returning visitor sent straight to the app, is untagged.
- `first_run_started` is unchanged: first visit only, no model, no labels, never counted as a landing. `landing_view` is the only landing count; `first_run_started` is never added to it.
- Each event keeps its own fresh random id (D-15): there is no session id and no event is linked to another, so the labels slice counts, not people.
- `calc_start` needs a model: the route refuses it without one. `verdict_shown` carries `model` too; the route accepts it without, only so a page served before this release (cached script) is still counted.

`entry` is read once per page view from `?from=landing` and removed from
the address bar at once (the `utm_*` labels leave with it). A verdict reached in a later page view (after a
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
   Values are inlined at build time: **redeploy** after adding or changing
   them.
3. Check: open the preview on your phone, start the questions, reach a
   verdict. PostHog → Activity → **Live events** shows `first_run_started`
   then `verdict_shown`, each with `env = preview`. The two landing events
   appear on PR 2's preview (its merge gate).

## Funnels and insights to build in PostHog

Filter every insight to `env = production`.

1. **Landing funnel** (Trends, numbers, one series per event, same date
   range):
   `landing_view` → `landing_cta_click` → `first_run_started` where
   `entry = landing` → `verdict_shown` where `entry = landing`.
   Read it as step-over-step ratios (for example clicks ÷ views). Break
   down by `utm_source`, `utm_campaign`, `utm_content` (the variant) and by `in_app_browser`. After the G1 fix
   add `calc_start` (by `model`) between `first_run_started` and `verdict_shown`.
2. **Flow completion, all entries:** `verdict_shown` ÷ `first_run_started`
   (BUILD_PLAN.md §1 target: calculator completion ≥ 60%). Break down by
   `entry`.
3. **Outcome mix:** `verdict_shown` broken down by `outcome`.
4. **Where visitors come from:** `landing_view` broken down by `country`,
   `utm_source`, `in_app_browser`, `locale`.

Counts are approximate in both directions: a reload can count a step
twice, and an ad blocker or a closed tab can drop one. With no identifier
there is no way to deduplicate, by design.

## Tests

- `src/lib/analytics/*.test.ts`: the catalogue, `utmValue`, the sender (no
  key → nothing; one text/plain beacon; never a cookie or storage write;
  never throws), once-per-page-view flow events, and a guard that no other
  source file sends a beacon, names `/api/e` or talks to PostHog.
- `src/app/api/e/route.test.ts`: forwards one anonymous event with a fresh
  id, no IP and no user agent; refuses other sites, robots, extra fields,
  unknown events, bad utm values and oversized bodies; 204 without the key
  or when PostHog is unreachable.
- `src/test/screens/first-run.test.tsx`: the flow sends its three events
  once, with `entry`, `outcome`, `model` and the labels, no `calc_start`
  before a model is picked, no payload with a URL, path, referrer or key
  outside the allowlist, and nothing without the key.
- `e2e/analytics-env.spec.ts` (`playwright.analytics.config.ts`, a build
  with a placeholder key and a `.invalid` host): the real flow in Chromium
  sends exactly the events in order (tagged and untagged, Arabic and English), with no run of three digits, no
  cookie, no new storage and no other host; the real route answers 204,
  403 and 400. The main e2e build has no key, and `e2e/first-run.spec.ts`
  and `e2e/calculator.spec.ts` fail on any non-GET request there.
