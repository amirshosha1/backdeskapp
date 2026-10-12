# PROGRESS — Backdesk · باك ديسك (formerly Safi / صافي)

## Stabilization: pricing truth (draft, 2026-10-12)

- Done on `stabilization/pricing-truth`: each Free and Pro feature now states whether it is available or in development; the free result is described as an estimate from user inputs. Setup Kit is labelled in development and has no order action. First-month access and monthly payment terms are labelled planned.
- Decision: keep the existing sample prices visible with their SAMPLE badges; do not treat the page as proof that paid access or payment works.
- Verification: TypeScript and `git diff --check` passed locally. Vitest could not start on this Windows runtime (`ERR_PACKAGE_IMPORT_NOT_DEFINED`); require green CI on the PR before any merge.
- Open: confirm each planned feature with a live end-to-end check before changing its badge to available.

> Read together with `CLAUDE.md` (rules) and `docs/BUILD_PLAN.md` (spec and phases). Updated at the end of every phase.
> Last updated: 2026-10-10 (Batch 4 PR 2, the landing page, in draft: amirshosha1/str-money-finder#17. Batch 4 PR 1 #15, the 404 fix #16 and the audit and financial baseline docs #18 are merged).

## Current status

- **Phase P (clickable prototype)** was merged into `main` (amirshosha1/str-money-finder#1). Amir reviewed it on his phone: it felt broken (silent taps) and the design was weak, which led to Phase P.1.
- **Phase P.1 (prototype fixes and redesign) is built**: tap audit (no silent taps, enforced by an e2e crawler), design direction A2 on every screen, an expense-details screen, the Arabic/English switch, the Arabic copy pass, and bidi/404/safe-area fixes. See "Phase P.1 decisions" and "Phase P.1 build notes" below.
- **Phase P.1.1 (fix pass on an independent end-to-end test) is built**, on top of P.1: the break-even rule changed (fixed costs now include the monthly maintenance/irregular allowance by default — see "Phase P.1.1 decisions" below, and `docs/BUILD_PLAN.md` §4.3 and Example B/B2), a shared `parseAmount` utility (`src/lib/format/amount.ts`) handles Arabic-Indic/Persian digits and Arabic separators on every numeric input, three expense categories were added, the language switch now keeps the current owner/co-host mode (via a `?view=` query param, not just the screen), commission basis is shown on managed units and the statement, the desktop shell is constrained to ~480px, the "نص مبدئي" UI label is gone, an axe-core accessibility sweep runs on every screen, paid pricing tiers say "كل ما في الباقة السابقة، بالإضافة إلى:", and the pre-order button's real `href`/`target`/`rel` now has its own e2e coverage. See "Phase P.1.1 decisions" and "Phase P.1.1 build notes" below.
- **Phase 1 (finance engine) is merged** (amirshosha1/str-money-finder#6, review fixes #7): every module of BUILD_PLAN §4 in `src/lib/finance/` (pure, `Decimal`, typed `Result` errors, Zod schemas for every input and output, `ENGINE_VERSION`), all worked examples A–K as tests (B: 19.38 nights with maintenance, B2: 18.99 without), the §4.7 invariants as fast-check properties, and 99.8% line / 98.6% branch coverage. Every `/demo` figure is now computed by the engine from raw sample inputs (`src/demo/sample-data/`), the four sample units differ, the month-over-month chips are computed from a sample August, and `/demo/calculator` is live. See "Phase 1 decisions" and "Phase 1 build notes" below.
- **The rename to Backdesk · باك ديسك is merged** (amirshosha1/str-money-finder#8).
- **P.2 slice 1 ("UI batch 2") is merged** (amirshosha1/str-money-finder#9): the first-run guided flow (`/demo/start`), the visitor's own first unit kept in this browser only, Units with the own unit first and the samples under "أمثلة تجريبية", and the calculator as "الملخص" / "كل الأرقام" with the headline **after depreciation**. It is the first part of P.2, not a separate phase. See "P.2 slice 1 decisions" and "P.2 slice 1 build notes" below.
- **Cleanup after slice 1, the pricing page and the plan model** are merged (amirshosha1/str-money-finder#10): `agentRules: false`, `next-env.d.ts` no longer tracked, no example loaders above the visitor's own numbers, 44 px statement buttons on the sample cards, `/demo/pricing` with two plans (Free and Pro, extra apartments at half price), and the confirmed plan model written into `CLAUDE.md` and `docs/BUILD_PLAN.md`. Final edits (2026-10-08): sign-in is Google only, the trial clock and all gating come in Phase 7 with the month report, Free also shows occupancy and the average nightly rate, and the two "paid plans" strings are singular. See "Post-slice-1 cleanup and pricing (2026-10-07)", "Plan model (2026-10-07)" and "Final review of #10 (2026-10-08)" below.
- **Batch 3 — Phase 0a/0b slice 1 (accounts with Google sign-in, apartments saved to the account) is merged:** PR A, the schema (amirshosha1/str-money-finder#12, applied; `docs/verify_after_migration.sql` PASS on all 14 checks), and PR B, the app (amirshosha1/str-money-finder#13): Google sign-in (PKCE, back to exactly `/auth/callback`), the account's apartments on Units and the calculator, moving the browser apartment in, sign-out and account deletion, the in-app browser sheet, `/privacy`, CI, functions in `dub1`. See "Batch 3 PR B decisions and build notes (2026-10-08)" below.
- **Hotfix before real visitors is merged** (amirshosha1/str-money-finder#14, 2026-10-09): Home shows only the user's own apartments (browser or account): the total monthly net in whole pounds and each apartment's net and status (مكسب/خسارة), from the same engine figures as its Units card; with none, one call to action to `/demo/start`. The sample month, the owner/co-host switch and the add-expense, add-income and month-report entry points are gone from every screen (their code stays). Units hides the samples once the user has an apartment, drops the تجريبي/SAMPLE badge from the user's own cards, and its header says "شققك" and the count. One top line everywhere: visitor = "محفوظ على هذا الجهاز · سجّل الدخول لتحفظه في حسابك" (tappable to sign in), signed in = none; "بيانات تجريبية" is gone. Every screen with sample data shows a "مثال · أرقام توضيحية" chip; the sample statement is titled "مثال: كشف حساب مالك" without PDF or owner-link buttons; the Units samples sit under "أمثلة توضيحية (ليست بياناتك)". Screenshots: `docs/screenshots/hotfix-home/`.
- **Batch 4 — the public landing page and anonymous counting (approved 2026-10-09), in order:**
  1. **PR 1, "C1: anonymous counting"** (amirshosha1/str-money-finder#15, merged 2026-10-10): a ~1 KB first-party sender and the route `/api/e` forwarding to PostHog EU, counts only, no identifier; `first_run_started` (`entry`) and `verdict_shown` (`outcome` only) in the first-run flow; the landing events accepted by the route; the privacy page, `CLAUDE.md` §7, BUILD_PLAN Phase 0b and `docs/ANALYTICS.md`. See "Batch 4 decisions (2026-10-09)" below.
  2. **The 404 fix** (amirshosha1/str-money-finder#16, merged 2026-10-10): `src/app/[locale]/not-found.tsx` stops shipping the app's client code (account and guest stores, engine, dialog: ~45–55 KB gzip) to every public page.
  3. **Amir** creates the PostHog EU project, sets `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in Vercel (Production and Preview), redeploys, and confirms the events in Live events from his phone (`docs/ANALYTICS.md` "Setup").
  4. **PR 2, the landing page at `/` and `/en`** (draft; see "Batch 4: PR 2, the landing page" below). Merge gate in its checklist: PR 1 merged, the PostHog values set in Production, and all four events seen in Live events from PR 2's preview.
  5. **PR 3:** in-app browser hardening (the sheet warns that the apartment stays in the app's browser; Telegram and generic WebView detection; the missing iOS and Units-gate tests) and the fix for a signed-in person bounced from `/demo` to `/demo/start`.
  The Facebook link is promoted after PR 1 and PR 2 merge. Sign-in stays unpromoted until PR C.
- **PR C ("live test readiness") is queued after Batch 4:** the consent bar, the accepted tier (posthog-js, identification by Supabase user id, masked replay), the rest of the event catalogue, error tracking and the PWA. Its open questions are under "PR C open questions" below.
- **Still ahead, unchanged:** the **host review with 3–5 hosts** (BUILD_PLAN §0 and P.2), then the rest of P.2 — send the standard phase prompt with `{N} = P.2` and say "remaining items". Phase P.1.1 was merged into `main` on 2026-10-02 (amirshosha1/str-money-finder#3).
- **Still unset on Vercel:** `NEXT_PUBLIC_PREORDER_URL` (pre-order buttons show "الحجز المسبق يُفتح قريبًا" until then). *(Since 2026-10-09 feedback and contact go by email to `support@backdeskapp.com`; `NEXT_PUBLIC_FEEDBACK_WHATSAPP` no longer exists.)* Per §0, the prototype now goes to 3–5 hosts (P.2 slice 1 is merged).
- **Deferred to Phase P.2:** live Home updates after saving an expense or income (data stays browser-only). The editable calculator and the varied sample data, deferred from P.1.1, are done in Phase 1.
- **Docs-only, 2026-09-29 and 2026-09-30:** Phase 2's benchmark design is decided. Benchmarks are area medians from the AirROI API, refreshed quarterly and rolled up through a `regions` hierarchy, with `curated` own-portfolio rows taking precedence. It is recorded in `docs/BUILD_PLAN.md` §3, §5 and §6, and in "Phase 2 decision revision (2026-09-30)" below, which supersedes the AirROI parts of the 2026-09-29 pre-decisions. Nothing is implemented yet: Phase 1 is still in progress, and two pre-build gates (coverage spike, licensing) come first.

## Phase checklist (in execution order)

| Phase | Status |
|---|---|
| Kickoff: review, decisions, docs | ✅ Done (2026-09-26) |
| P — Clickable prototype | ✅ Merged (2026-09-26) |
| P.1 — Prototype fixes and redesign | ✅ Merged (2026-10-02, #3): built 2026-09-27, fix pass "P.1.1" built 2026-09-28 |
| 1 — Finance engine (+ wire the `/demo` calculator to it) | ✅ Merged (#6, review fixes #7) |
| P.2 — Interactive demo, data in the browser only | 🔨 Slice 1 merged (2026-10-07, amirshosha1/str-money-finder#9); then the host review (3–5 hosts); then ⏭ the remaining P.2 items |
| 0a — App shell, i18n, PWA, CI | 🔨 Slice 1 (Batch 3): the database CI job (PR A) and CI for lint, typecheck, unit tests and build (PR B). PWA and the error boundary come in PR C; Prettier and themes are not started |
| 0b — Supabase project, auth, migration 001, DB tests in CI | 🔨 Slice 1 (Batch 3): PR A (schema, RLS, proof) merged (#12) and applied; PR B (Google sign-in and apartments in the app) merged (#13); anonymous counting (Batch 4 PR 1, #15) and the 404 fix (#16) merged, the landing (PR 2, #17) in draft; PR C (consent bar, accepted tier, error tracking, PWA) queued. The Supabase project exists (Amir, Ireland, Free plan, production) |
| 2 — Free calculator | Not started. Benchmark design decided (AirROI area medians with regional roll-up, revised 2026-09-30); pre-build gates pending |
| 3 — Setup guide, checklists, Setup Kit, minimal `units` table | Not started |
| ⛔ Validation Gate | Waiting for 20 pre-orders paid by InstaPay (tracked by Amir outside the app) and the exact line `Gate passed: {number} paid pre-orders.` |
| 5 — ERP core (+ basic team invitations) | Blocked by the gate |
| 6 — Payout import | Not started |
| 7 — Reports and owner statements | Not started. Also builds the entitlements service, the trial clock and all gating (decided 2026-10-08) |
| 8 — Smart entry and alerts | Not started |
| 4 — Payments and legal | Not started |
| 10 — Hardening | Not started |
| 🚀 LAUNCH | — |
| 9 — Growth and moat (post-launch) | Not started |

## Environment facts

- Local machine: Windows 11, Node 24.15, pnpm 9.15, Git 2.54. **No Docker, WSL, Supabase CLI or `gh`, by design.** Do not ask Amir to install anything.
- The local path `I:\AI\STR App` contains a space. If a tool misbehaves, check that first.
- Repo: `github.com/amirshosha1/str-money-finder`, branch `main`.
- Supabase: the **Backdesk project exists** (created by Amir).
  - Ref `kmmfhaypqgzhoptmljki`, West EU / Ireland (`eu-west-1`), Free plan.
  - **It is production; there is no separate dev or prod project** (2026-10-08).
  - The **Supabase GitHub integration is connected**: "Deploy to production" on `main`, working directory `.`. It applies new files in `supabase/migrations/` when they merge.
  - Claude's Supabase connector is linked to a different Supabase account and cannot see this project. Database checks go through `docs/verify_after_migration.sql`, which Amir runs, and through `pnpm test:db` on a local Postgres.
  - **Amir's other Supabase projects are off-limits.**
- Vercel is connected to the repo (Amir reviewed the Phase P preview on his phone). Not set up yet: Resend sending domain, PostHog, Google OAuth client (steps in `docs/SETUP_AUTH.md`), the two Supabase variables on Vercel, Paymob, Anthropic key.
- Phase P was built from a Claude Code on the web session (cloud container, Node 22.22, pnpm 10.33 available there — `package.json` still pins `packageManager: pnpm@9.15.0` to match Amir's machine; both installed the same lockfile cleanly). `pnpm dev`, `build`, `lint`, `typecheck`, `test` and `test:e2e` all exist now.

## Decisions (2026-09-26)

### Product and plans
- Working name: **Backdesk · باك ديسك** (formerly **Safi / صافي**; renamed 2026-10-06, see "Rename to Backdesk" below).
- The home screen depends on the operating model. The owner view shows net profit. The co-host view shows commission minus manager-borne costs, summed across managed units, with portfolio-level overhead subtracted as its own line.
- *Superseded on 2026-10-07 by "Plan model (2026-10-07)" below (data entry is free, outputs are paid; Free sees the current month only):* ~~"Never hide the answer" stays. **Free** gets a manual ledger for 1 unit with full history, including agreements and commission calculation, recurring rules and receipt photos. On Free, receipt photos are compressed in the browser and capped by `receipt_photos_max` in the plan entitlements. **Paid** unlocks 2+ units, payout import, owner statements, AI entry, alerts and exports.~~
- *Superseded on 2026-10-07 (one paid plan, Pro, priced per apartment; no Solo, Business or annual prices):* ~~Fixed paid tiers: **Solo** up to 3 units, **Pro** up to 10, **Business** up to 30. They have identical features and differ only by unit limit.~~ Prices live in the `plan_prices` table.
- Utilities default to a fixed monthly cost and can be switched per category. Every worked example states its cost types.
- The Free calculator runs in the browser. The 12-month projection and benchmarks are server-only.
- An anonymous draft scenario stays in the browser until sign-up, then is saved to the org.
- Brand: a calm, neutral default palette, with all tokens in one file. Analytics: ~~PostHog captures nothing until the user opts in~~ anonymous counting only before any choice, nothing without a key (Amir, 2026-10-08; `docs/ANALYTICS.md`).

### Sequencing, payments and validation
- Order: **P → 1 → 0a → 0b → 2 → 3 → Gate → 5 → 6 → 7 → 8 → 4 → 10 → LAUNCH → 9**. Phase numbers stay stable. *(Superseded on 2026-09-27: P.1 and P.2 were added, see "Phase P.1 decisions".)*
- **Phase P** is a clickable prototype: all key screens with sample data, Arabic RTL, mobile-first, no database, no login, deployed on a Vercel preview, built from real reusable components.
  - Pages live under `/demo`, with fixtures taken from the worked examples.
  - Every demo screen shows a "بيانات تجريبية" banner, and `/demo` is `noindex` until launch.
  - The `/demo` calculator is read-only (one sample scenario, no inputs) until the engine is wired.
- Phase P also sets up ESLint, Vitest and the `lint`, `typecheck` and `test` scripts, so the end-of-phase checks work before Phase 0a adds CI.
- **Phase 1** runs right after P because the engine needs no database or auth. At the end of Phase 1, the `/demo` calculator is wired to the real engine.
- Phase 0 is split into 0a and 0b. The entitlements service moves from old Phase 4 to 0b. *(Superseded on 2026-10-08: it is built in Phase 7 with the rest of the gating.)*
- No payment integration until just before launch: Phase 4 runs after Phase 8. Launch comes after Phase 10, and **Phase 9 is post-launch growth**.
- **Gate before Phase 5:** 20 pre-orders paid by manual InstaPay transfer after hosts see the prototype. No code is needed for this.
  - Until Phase 5, Amir tracks pre-orders outside the app.
  - From Phase 5, a server-only admin script grants paid access (a `manual` subscription).
  - The Setup Kit and the founding pre-order are sold and granted manually until Phase 4.
- Terms, privacy policy and refund policy are drafted in Phase 4, for legal review.
- Curated benchmarks are imported in Phase 2 so the paid comparison has data at launch. Aggregated benchmarks come in Phase 9.
- **Benchmarks:** paying users never see SAMPLE benchmarks. If `data/seed/benchmarks.csv` has no sourced figures at launch, the benchmark feature (paid comparison and Free teaser) is hidden.
- **Team seats:** basic invitations move into Phase 5. An owner or admin invites by email as admin, member or accountant, so every person has their own login and `audit_log` attribution stays correct; shared logins are not supported. The owner portal stays in Phase 9.

### Workflow: cloud-first
- No Docker, WSL or local Supabase.
- Dev database: one hosted Supabase project in Frankfurt, created by Claude through the Supabase connector in Phase 0b, only after Amir approves.
- Prod database: a separate project on a paid plan, created only before launch.
- Migrations and RLS tests run in GitHub Actions against dev, using a credential scoped to the dev database. Tests create their own users and clean up.
- Claude only ever sees dev keys. Prod keys live only in Vercel and GitHub secrets.
- Amir tests on Vercel preview links on a phone. Supabase dev Auth gets wildcard redirect URLs for Vercel previews.
- ~~Resend is the SMTP provider for dev from Phase 0b~~ *(superseded on 2026-10-08: sign-in is Google only; Resend becomes the Auth SMTP sender once email sign-in is added)*; there is no local test inbox.
- Vercel functions run in `fra1`. *(Changed on 2026-10-08: `dub1`, next to Supabase in Ireland; BUILD_PLAN §6 question 19.)*

### Auth and migration 001
- ~~Sign-in: 6-digit email code plus Google, with Google off by config until it is set up.~~ *Reopened on 2026-10-07; decided on 2026-10-08 (BUILD_PLAN §6 question 16):* sign-in is Google only for now. Email codes come later, once there is a domain and a custom SMTP sender.
- Roles: owner, admin, member, accountant. Owners of managed units get access through a separate grant, never as org members.
- Tables: `plan_prices` replaces the price columns. Entitlements are JSON on each plan, with an optional override per subscription.
- `audit_log` is append-only and written by triggers. The only permitted change is personal-data redaction on deletion.
- Sign-up creates a personal org set to EGP and `Africa/Cairo`.

### Finance engine
- **FX:** each transaction stores the original amount, currency, an explicit rate (`numeric(18,8)`) and the unit-currency amount.
- **Agreements:** every unit has one effective agreement. Owner-operated and rental-arbitrage units use commission basis `none`, and the UI calls their record **"unit settings"**, never "agreement". `hybrid_basis` sets the base for the hybrid percentage.
- **Owner statements:**
  - Cash basis by default, set per agreement.
  - The balance due carries forward from the previous statement.
  - An owner's first statement accepts a manual opening balance.
- **Locked months:** anything dated in a locked month posts to the next open period. `date` is the posting date and `occurred_on` keeps the original date.
- **Platform fees** are allocated to revenue components in proportion to their size.
- **Rounding** is half-up. Every split gives the leftover cent to the last line.
- **Break-even:** the NOI-basis fix is applied and hybrid commission is solved piecewise.
- **Blocked nights** are stored in `unit_month_settings.blocked_nights`.
- **Booked nights above available nights:** never clamped silently. The engine returns the raw occupancy with an `availability_conflict` warning; the UI shows a data warning and caps displayed occupancy at 100%.
- **Tax:** the rate and base are set on the agreement (null rate means no tax). The default base is net profit before tax, and there is zero tax on a loss. Both stay configurable (`tax_base`: pre_tax_profit, gross_revenue or net_payout).
- **Gross revenue** excludes `taxes_collected`.
- **Commission transactions** are only a snapshot taken on statement finalization (`statement_id`, source `statement`). `owner_payout` records real money sent to the owner and drives the balance due.
- **Portfolio-level costs** are manager overhead, never charged to owners unless allocated to units.
- **Example A:** the owner bears all costs.
- **Per-month stay allocations** are computed by the engine and stored.
- **Worked examples A–K** are in BUILD_PLAN §4.6 (A2, E2 and G–K were added at kickoff).
- **Units table:** a minimal `units` table is created in Phase 3, with plan unit limits enforced from then on *(superseded on 2026-10-08: from Phase 7)*, and Phase 5 extends the same table. There is never a second units table.

### Phase P.1 decisions (2026-09-27)

- **New order:** **P → P.1 → 1 → P.2 → 0a → 0b → 2 → 3 → Gate → 5 → 6 → 7 → 8 → 4 → 10 → LAUNCH → 9.** Recorded in `CLAUDE.md` §8 and `docs/BUILD_PLAN.md` §0 and §5.0.
- **Phase P.2** makes the demo interactive with data kept in the browser only: add a unit, add expenses, and see Home update live through the engine. No account, nothing sent to a server. Its scope is in `docs/BUILD_PLAN.md`.
- **Design direction A2** was chosen from three Home directions and pushed toward Amir's reference screenshots: royal-blue gradient (no teal), frosted-glass tiles on the hero and nav only (solid fallback), soft grey cards without outlines, radii 24–32 px, 8 pt grid, one icon stroke weight, tabular numbers, banner text just "بيانات تجريبية". The owner statement keeps the ledger style from direction B. Recorded in `CLAUDE.md` §7.
- **Home, approved with three tweaks:** (1) the units are a swipeable glass carousel, one card per unit (name, operating model, profit), and the separate "وحداتك" list is gone; (2) section links are brand blue, and the floating nav never hides the last content; (3) the statement pill depends on the view: owner → "تقرير الشهر" (toast until P.2, then each unit's monthly report); co-host → "كشف حساب", opening the Downtown statement.
- **No silent taps:** every tappable element works or explains itself with a toast; no disabled placeholder buttons; Save on add-expense says what is missing. Enforced by `e2e/taps.spec.ts`. Recorded in `CLAUDE.md` §7.
- **Language switch moved from Phase 0a to P.1.** The locale comes from the URL only (no `Accept-Language` detection, no cookie); switching keeps the current screen.
- **Copy register:** simple MSA with Egyptian terms (confirmed by Amir). "شقة المدينتي" → "شقة مدينتي". In English, the utilities category is "Utilities" (the Arabic stays "الكهرباء والمياه").
- **Month-over-month change chip** on Home: a SAMPLE value (+8.4% owner, +5.2% co-host), requested for the design review and not in §4.6. From Phase 1 it comes from real data or is hidden. *(Done in Phase 1: computed from a sample August, see "Phase 1 decisions".)*

### Batch 4 decisions (2026-10-09)
Approved by Amir after the landing-page plan:
1. Headline **"شقتك مكسب ولا خسارة؟"** / "Is your apartment a profit or a loss?".
2. "How it works": four rows that mirror the flow, with a short note that owner-operated skips the fourth (rent or commission).
3. The landing card shows the arbitrage preset through the engine: −7,014 (خسارة), labelled "مثال · أرقام توضيحية", area "مثال عام".
4. PR C question 1 answered (a): anonymous counting before any consent choice; nothing is sent without `NEXT_PUBLIC_POSTHOG_KEY`. PR 1 merges first.
5. Measurement by counts only: no identifier of any kind (a new random id per event, no person profile, no IP).
6. `verdict_shown` carries the outcome only (no operating model).
7. The 404 leak is fixed in its own small PR before the landing.
8. The Facebook link is promoted after PR 1 and PR 2.
Defaults accepted: `/` and `/en` indexable (canonical, hreflang), no top line on the landing, the Latin name "Backdesk" visible, two share images (AR, EN) rendered by a script with the engine figure and a CI staleness guard (satori cannot shape Arabic), the site-wide meta description changed to the feasibility wording, the privacy page's back arrow to `/`. Added by Amir for PR 2: `sitemap.xml` (`/`, `/en`) and `robots.txt` (both allowed, `/demo/*` disallowed); Latin text next to Arabic wrapped in `lang="en"`; `font-feature-settings: 'tnum'` on every number on the landing; a CI cap of 160 KB gzip of JS on `/` after the 404 fix (the exact number set from the preview measurement).
Build notes for PR 1:
- The sender posts `text/plain` (a simple same-origin request, so `sendBeacon` never needs a preflight); the route parses it as JSON.
- `first_run_started` fires when the first question is on screen and `readFirstRunAnswers()` is null (read straight from storage: the hook reports null until hydration ends). Both flow events are once per page view; the route accepts the two landing events already, so PR 2 only adds the senders.
- The route's robot filter matches `\bbot\b`, not "bot", so phone brands such as CUBOT are not dropped.
- References: the audit cited in the brief is `docs/backdesk-ux-audit-2026-10-09.md` (items P1-12 and P3-8; committed by Amir in #18 on 2026-10-10). The plan was built from Amir's paraphrase before it was in the repo. "Facebook post style 1" is the post style picked on 2026-10-06 (the app's question-screen look: navy-to-blue gradient, glass cards).

### PR C open questions (logged 2026-10-09; question 1 answered)
1. ~~"No network request before consent" vs "anonymous cookieless counting before any choice".~~ **Answered (a)** on 2026-10-09: cookieless anonymous counting before any choice; nothing sent without the key.
2. **Remembering "reject":** (a) recommended: one first-party localStorage entry holding only `rejected` or `accepted`, no identifier; (b) don't store it, so the bar returns on every visit.
3. **Replay masking:** (a) recommended: mask all text and all inputs; layout and taps stay visible and no number or apartment name can leak; (b) mask inputs plus elements marked as numbers or names (more readable, but one missed element leaks).
4. **Autocapture:** (a) recommended: off; only the typed catalogue, pageviews with the query string stripped except `utm_*`, and web vitals; (b) on, with all element text masked.
5. **PostHog data when an account is deleted:** (a) recommended for now: events stay tied to the deleted account's id, which can no longer be linked to a person; the privacy page says so, and deletion on request goes through support@; (b) delete automatically through PostHog's API (needs a PostHog personal API key as a Vercel secret).

### Batch 3 PR B decisions and build notes (2026-10-08)

The app side of slice 1, on `claude/busy-curie-y0si27`. Plan approved by Amir with every recommended default and the amendments below.

**Answers to the plan's questions (Amir)**
- **Adding an apartment when signed in:** a sheet asks for a name (prefilled "شقة 2") and the operating model, creates it with the example's numbers tagged تجريبي, and opens the calculator on it.
- **Saving calculator edits:** autosave about one second after the last valid change, one save at a time, latest wins, with a visible status in the top line ("جارٍ الحفظ…", "محفوظ", and on failure a "لم يُحفظ — أعد المحاولة" button).
- **The apartment limit:** the app never blocks. Every add is tried; the database's P0001 `unit_limit_reached` drives the message and the custom-plan contact. "3 من 5 شقق" is shown read-only from `org_entitlements.max_units`; nothing else in `org_entitlements` is read.
- **This browser on sign-out and deletion:** sign-out keeps the browser's own settings (the first-run "seen" flag); deleting the account also clears this browser's Backdesk data.
- **The Free pricing card** gains "نسبة الإشغال ومتوسط سعر الليلة".
- **PR:** opened by Claude; Amir merges only after testing on his phone.

**Amendments (Amir)**
- **Real data is never labelled as sample.** The top line: visitor → "بيانات تجريبية" on every screen; signed in on Units, on the calculator showing one of their apartments, and on More → "شققك محفوظة في حسابك"; signed in on any sample screen (Home, expenses, the guide, a sample statement, pricing, the calculator's example when the account has no apartments) → "بيانات تجريبية"; while it isn't known yet whether someone is signed in → neither (same height, empty). The per-field تجريبي tags and `/demo` noindex stay. Moving the signed-in app out of `/demo` is an open issue, not this PR.
- **Required checks** cannot be enforced (GitHub Free, private repo: 403); a manual rule in `docs/SETUP_AUTH.md`.
- **The privacy page is complete:** the Google profile-picture link, sign-in times, sessions and logs with IP and user agent (Supabase Auth), Vercel's request logs, the processors (Supabase, Vercel, Google) and their regions, "no analytics yet". New rule in BUILD_PLAN (Phase 0b): the privacy page is updated before PostHog, Resend or any new processor ships.
- **Data API:** "Automatically expose new tables" is off (set by Amir); recorded in `docs/SETUP_AUTH.md` and CLAUDE.md §5.
- **Redirect URLs:** after PR B, Amir replaces `https://backdeskapp.com/**` with exactly `https://backdeskapp.com/auth/callback` and deletes the `www` entry (`docs/SETUP_AUTH.md`).
- **In-app browsers** (added during the build): inside Facebook's, Messenger's, Instagram's and similar browsers, every sign-in button opens an "open in your browser" sheet instead of calling Google (which answers 403 disallowed_useragent there): the reason, copy link, Android "افتح في Chrome" (an `intent://` link with the same page as fallback), iOS steps ("⋯ → فتح في المتصفح"). Detection is a pure user-agent function with table tests (`src/lib/browser/in-app.ts`; tokens after inapp-spy 5.0.10 plus the generic Android `; wv)` and iOS no-`Safari/` web-view markers; a home-screen app is never flagged).
- **PR C, "live test readiness"**, is planned now and built after PR B merges (see Current status).

**Built**
- `src/lib/supabase/`: browser and server clients with the publishable key only; the browser client is loaded on demand, so a visitor without a session cookie downloads none of it and nothing is requested. Missing values → accounts off, every entry point hidden (local dev, e2e, CI).
- `/auth/callback` (outside the locales; the proxy skips it): PKCE code exchange; the page to return to comes from the `bd_next` cookie through an allow-list (`safeNextPath`); failures go to a one-shot `bd_flash` cookie, never into a URL; relative `Location`, `no-store`.
- Server actions (`src/lib/account/actions.ts`): create, update, delete an apartment; move the browser apartment in (decided on the server from a fresh read); the apartment-count answer (the sign-in copy only fills an empty answer); `delete_my_account` then local sign-out. Zod first (`src/lib/account/schemas.ts`: names 1–60 characters after NFC and trim, no control, separator or direction-override characters; `calculator_inputs` exactly `{form, assumed}`, accepted by the engine, ≤ 8 KB as Postgres counts it); only granted columns are written; errors mapped to named app errors with Arabic and English copy.
- The browser account store (`src/lib/account/store.ts`): in memory only, never in browser storage; refreshes the session in the browser before every server action.
- Screens: Units (the account's apartments, add, rename, delete, the limit notice), the calculator (`?unit=<id>`, autosave), More (account, sign-out, privacy, delete), first-run (the count answer goes to the profile when signed in), `AccountSync` on every `/demo` screen (sign-in failure notice, the move, the count copy), `/privacy` and `/en/privacy`.
- `src/types/database.ts`, generated by `pnpm db:types` from the migrated test database; Insert and Update allow only the columns granted to `authenticated` (others are `never`), and `pnpm test:db` fails when the file is stale.
- `.github/workflows/ci.yml` ("CI / checks"); `vercel.json` → `dub1`; CLAUDE.md, BUILD_PLAN and SETUP_AUTH updated; `support@backdeskapp.com` replaces the earlier contact address everywhere.

**Build notes**
- **The callback redirects with a relative `Location`.** The accounts e2e build showed that under `next start`, `request.url` reports the configured host (`localhost`) even when the browser used `127.0.0.1`; an absolute redirect built from it would jump hosts and lose the session cookies just set. The browser resolves a relative `Location` against the callback's own origin, so the host header is never trusted.
- **The 8 KB check counts what Postgres counts.** jsonb's text form adds a space after every `:` and `,`, so `JSON.stringify` under-counts. `jsonbTextBytes` mirrors Postgres's output and a `pnpm test:db` property test compares it with `octet_length(x::jsonb::text)` on 300 generated values (Arabic, emoji, escapes, nesting).
- **Moving the browser apartment is serialised across tabs** with the Web Locks API; the tab that waits re-reads the browser copy and finds it gone.
- **e2e with accounts on** (`playwright.accounts.config.ts`, port 3020): a production build with placeholder values on a `.invalid` host; every browser request to it is intercepted. It proves redirect_to is exactly `<origin>/auth/callback`, PKCE (`code_challenge_method=s256`), `prompt=select_account`, the `bd_next` cookie, the callback outside the locales with no error in the URL and the failure toast, a hostile return page ignored, and the in-app sheet with no request to Supabase.
- **Not testable here:** the real Google round trip and Supabase's Data API (no local PostgREST). They are on Amir's phone checklist.

### Batch 4: the 404 fix (2026-10-09)
- `src/app/[locale]/not-found.tsx` is the [locale] segment's not-found boundary, and Next.js ships its client code with every page under [locale]. It rendered PageHeader → the top line, so every public page downloaded the guest and account stores, the finance engine with decimal.js and a Radix dialog. It is now server-only: a plain header, no top line, no language switch, and a plain link home (`/demo`, `/en/demo`).
- Measured on the CI-style build (gzip level 9 of the files each page loads): `/` 197.5 → 144.0 KB, `/privacy` 197.8 → 153.9 KB.
- `pnpm check:bundle` (`scripts/check-public-bundle.mjs`) runs in CI after the build. It fails if "backdesk:guest", "signInWithGoogle" or "DecimalError" appears in any JS that `/` or `/privacy` loads, and prints each page's JS size. The landing PR adds a JS cap for `/` under Amir's 160 KB gzip ceiling (2026-10-09): 150 KB, see below.
- CLAUDE.md §7: one top line on every `/demo` screen; the 404 has none.

### Batch 4: PR 2, the landing page (2026-10-09)
- **Route.** `src/app/[locale]/page.tsx` is the landing (it used to redirect to `/demo`; the comment citing a Phase P rule BUILD_PLAN never had is gone). Static (SSG), indexable, no top line, no client components: the button, the language switch and the footer links are plain `<a>`, so they work in any in-app browser even if JavaScript fails.
- **How it works.** Four fixed, numbered glass cards on the navy-to-blue identity, with a short outcome-led title and subline, one semantic icon each, and the owner-operated note below step four. No accordion and no repeated CTA; the guide's accordion remains future work.
- **Who sees it.** An inline script first in `<body>` (`src/lib/landing/redirect-script.ts`) sends someone with an apartment saved in this browser (`backdesk:guest` v1 with a unit) or with a Supabase session cookie (`sb-<ref>-auth-token`, whole or chunked; the PKCE code-verifier cookie alone does not count) to `/demo` (`/en/demo`), keeping the query string, before anything paints. The cookie check is left out of builds without accounts. Someone who finished the flow without saving an apartment still sees the landing. Crawlers, link previews and first visits get the full page; without JavaScript nothing redirects.
- **The example** (`src/lib/landing/example.ts`): the `arbitrage` preset through `parseCalculatorForm` → `computeScenario` → `scenarioView` at build time (−7,013.67 → "−7,014", خسارة, break-even 21.41 nights, 4 short), shown with the same verdict word, hero label and sentence as the first-run verdict (the sentence now comes from `src/lib/first-run/sentence.ts`, shared by both). A preset that stops parsing fails the build. `pnpm check:bundle` proves the engine does not reach the browser.
- **Events.** `landing_view` and `landing_cta_click` are one inline script (`src/lib/analytics/landing-events-script.ts`), rendered only when `NEXT_PUBLIC_POSTHOG_KEY` is set at build. Same body as `track()` (a unit test compares them byte for byte), utm buckets identical to `utmValue()`. Nothing is sent while the page is leaving for the app, and arriving from the other language's landing is not a second view.
- **Meta.** `metadataBase` is `https://backdeskapp.com` (`src/lib/site.ts`); on a Vercel preview it is the preview's own branch address (`VERCEL_BRANCH_URL`), so a preview's link card loads an image that exists there. The landing has its own title ("باك ديسك · Backdesk — شقتك مكسب ولا خسارة؟" / "Backdesk — Is your apartment a profit or a loss?"), a description of at most 155 characters, canonical, hreflang `ar`, `en`, `x-default`, Open Graph (`ar_AR` / `en_US`, site name "باك ديسك · Backdesk") and `summary_large_image`. Every other page shares the same image. The site-wide description is now the feasibility wording. A `<title>` or `content` attribute cannot carry markup, so `lang="en"` wraps the Latin name only in the visible page (wordmark, footer address).
- **Share images.** `public/og/landing-{ar,en}.png`, 1200×630, about 215 KB each, drawn in Chromium by `pnpm og:render` (`scripts/og/render.og.ts`, `src/lib/landing/share-card.ts`) with IBM Plex Sans Arabic from `@fontsource/ibm-plex-sans-arabic` (dev dependency, OFL-1.1), the repo's own colour tokens and `.royal-hero` / `.glass` CSS, the key and the engine figure. `src/lib/landing/share-images.json` records the hash of the HTML they were drawn from and each file's sha256; `src/lib/landing/share-images.test.ts` fails with "run pnpm og:render" when the messages, the figure, the CSS or the key change. Image URLs carry `?v=<sha8>`, so Facebook and WhatsApp fetch a new file when it changes.
- **robots.txt and sitemap.xml** (`src/app/robots.ts`, `src/app/sitemap.ts`): allow `/`, disallow `/demo` and `/en/demo`; the sitemap lists `/` and `/en` with language alternates.
- **JS budget.** `/` loads 138.8 KB gzip of JS (framework, layout, the next-intl provider; the landing itself adds none). `check:bundle` caps it at 150 KB, under Amir's 160 KB ceiling, leaving room for routine framework updates; raising it is a decision.
- **Numbers.** `.tnum` (`font-feature-settings: "tnum"` and `tabular-nums`) on the landing's root; an e2e test checks every text node with a digit.
- **Privacy page:** its back arrow goes to `/` ("رجوع إلى الصفحة الرئيسية"); a returning visitor is sent on to `/demo` from there.
- **Footer contact:** a plain `mailto:` link whose text is the address itself, so a tap that opens no mail app still shows it. The tap crawler now treats such a link as external (on `/demo/more` the contact stays a `MailLink` with its copy sheet).
- **Tests:** unit (redirect script, events script, landing screen, example, share-image guard), e2e `e2e/landing.spec.ts` (no redirect for first visits and without JavaScript, the button on the first screen at 360×640, 360×800 and 390×844, no sideways scroll, tabular numbers, Facebook's in-app browser, returning visitors with the query string kept, robots and sitemap), `e2e/share-meta.spec.ts`, `/` and `/en` in the a11y sweep and the tap crawler, the signed-in redirect in `e2e/accounts-env.spec.ts`, and the whole four-event funnel in `e2e/analytics-env.spec.ts`.

### Batch 3 decisions — Phase 0a/0b slice 1 (2026-10-08)

Accounts with Google sign-in, apartments saved to the account. Plan approved by Amir with every default. Recorded in `docs/BUILD_PLAN.md` (§0, §3, Phase 0b "0a/0b slice 1", Phase 3, Phase 10, §6 question 19) and `CLAUDE.md` §4 and §5.

**Decided before the plan (Amir)**
- Sign-in is Google only, through Supabase Auth.
- Everything stays open: no trial clock, no gating, no payments.
- Guest mode keeps working exactly as today, without an account.
- At most 5 apartments per account. A 6th shows the "باقات خاصة" contact, not an error. The database enforces the limit too.
- The Supabase GitHub integration applies `supabase/migrations/` when they merge to `main`.
- Two PRs: A (schema only), then B (the app, built on the applied schema).

**Decided in the plan (Amir took every default)**
- **Signed-in mode lives on the existing `/demo` screens** (option 1A). PR B amends `CLAUDE.md` §7: a guest's data stays in the browser and nothing about a guest is sent anywhere; a signed-in user's apartments live in their account. The banner stays, because Home, expenses, the guide and the statement are still sample data.
- **`org_id` plus membership resolved from `auth.uid()`** (option 2). There is one personal org per user, created at sign-up, so Phase 5 teams need no retrofit.
- **The smaller migration** (option 3).
  - It creates `profiles`, `orgs`, `org_members`, `org_entitlements` and `units`.
  - `plans`, `plan_prices` and `subscriptions` come with manual grants (Phase 5) and payments (Phase 4). They will update `org_entitlements`, the resolved state the app reads.
  - `audit_log` comes with `transactions` in Phase 5: slice 1 has no financial records.
- **Moving a guest's apartment at sign-in** (option 4).
  - An account with no apartments takes the browser's apartment automatically, and the browser copy is cleared.
  - A browser apartment identical to one already in the account is cleared without asking.
  - Otherwise one sheet asks "أضفها إلى حسابي" or "احذفها من هذا الجهاز". At the limit, the "باقات خاصة" contact replaces the add button. The browser copy stays untouched and hidden until the person taps.
  - Server data is never overwritten by browser data.
- **Writes go through Next.js server actions with Zod; reads go from the browser.** Both use the publishable key and the user's session, so RLS applies. Security does not rest on the server actions, because anyone can call the Data API directly with their own session: the database is the enforcement.
- **No service-role key anywhere.** Account deletion is `public.delete_my_account()`:
  - a SECURITY DEFINER function owned by `postgres`, with no arguments, acting on `auth.uid()` only;
  - runnable by `authenticated` only;
  - it deletes the caller's sole-member orgs (apartments and entitlements cascade), then the `auth.users` row (profile, memberships, Google identity and sessions cascade).

**Decided after the plan (Amir, 2026-10-08)**
- **Environment facts:**
  - The production URL is `https://str-money-finder.vercel.app`. *(Changed later on 2026-10-08: production is `https://backdeskapp.com`; `www` redirects to it; the Supabase Site URL is `https://backdeskapp.com`.)*
  - Previews are `str-money-finder-git-<branch>-amirshosha-2230s-projects.vercel.app` and `str-money-finder-<hash>-amirshosha-2230s-projects.vercel.app`.
  - The Supabase project is `kmmfhaypqgzhoptmljki`, in Ireland, on the Free plan.
  - **This project is production;** there is no separate prod project.
- **The preview wildcard redirect is accepted for now.** The launch checklist (BUILD_PLAN Phase 10) removes it or moves previews to a separate Supabase project.
- **Claude's Supabase connector cannot see this project** (it is linked to another account). So:
  - `src/types/database.ts` will be generated from the local test database (PR B);
  - the post-merge checks are one read-only file, `docs/verify_after_migration.sql`, which Amir runs in the SQL editor and pastes back;
  - if "postgres holds DELETE on auth.users" fails there, Claude stops and proposes another deletion method before PR B.
- **Privacy contact: `support@backdeskapp.com`** (the address was changed on 2026-10-08, and Amir confirmed it receives mail; it replaces the earlier address everywhere).
- **Google consent screen:** the support and developer contact emails are Amir's own Google account email, not the public contact address (`docs/SETUP_AUTH.md` step 1).
- Claude works inline, with no parallel agents.

**PR A build notes**
- **The local Postgres mirrors Supabase's role layout** (`scripts/test-db.sh`, `tests/db/shim.sql`):
  - the cluster's superuser is `supabase_admin`, and `postgres`, which runs the migrations and owns everything, is **not** a superuser, as on Supabase;
  - `authenticator` switches to `anon` or `authenticated` per request with `request.jwt.claims`, as PostgREST does;
  - users are signed up as `supabase_auth_admin`, as Supabase Auth does.
  The shim deliberately grants the old permissive Supabase defaults on `public` (everything to anon and authenticated), so the tests prove the migration's revokes. What it does not mirror: PostgREST itself, Postgres 17 (it runs the local major version, 16), and Supabase's other schemas.
- **The tests assert both kinds of "no".** A missing grant fails with 42501. A row hidden by RLS returns 0 rows on update or delete, so the tests also check the other user's row is unchanged.
- **The tests can fail.** I weakened the migration five ways (an update grant and policy on `org_entitlements`; no org-row lock in the limit trigger; RLS off on `units`; `created_by` insertable; the default-privilege revoke removed), and the matching tests failed each time. The first concurrency test passed even without the lock, because pooled inserts happened to run one after another. It now holds request 1's transaction open and shows request 2 waiting on the lock, then rejected.
- **`docs/verify_after_migration.sql` is one statement.** The tests run it through the extended query protocol, which rejects a second statement, inside a `read only` transaction. They also break the schema 15 ways and check that the matching row says FAIL.
- **A new table is not reachable by default.** The migration revokes Supabase's per-schema default grants for tables, sequences and functions in `public`, so any later table is unreachable until a migration grants it; a test proves it. Functions keep Postgres's global `EXECUTE` to PUBLIC, so every function revokes it explicitly; a guard test fails if any function in `public` or `private` is runnable by PUBLIC or `anon`.
- **The limit trigger checks membership before it takes the per-org lock.** So a user cannot lock someone else's org, and a non-member gets the RLS error, never `unit_limit_reached`, which would reveal another org's apartment count.
- `units.created_by` has an index, so the "set null" step on user deletion does not scan the table.

### P.2 slice 1 decisions (2026-10-07)

UI batch 2, the first part of P.2 (not a parallel phase): the first-run guided flow, the Units entry and the calculator redesign, from Amir's four approved boards. No accounts, no Supabase, no payments; the engine got one additive module and no formula changes. Plan approved by Amir with the changes below.

**Done**
- **First-run flow** at `/demo/start` (`src/components/first-run/`, logic in `src/lib/first-run/flow.ts`): model → price (500–10,000, step 50, ± 100) → nights (0–30, ± 1) → cost (rental arbitrage: rent 5,000–150,000, step 500, ± 1,000; managed: commission 5–50%, ± 1; owner-operated skips it) → verdict → apartment count. One progress segment per question (3 or 4); back on every screen after the first; "تخطَّ" and "ادخل التطبيق" mark it seen. The app entry (`/demo`) opens it on a first visit: an inline script redirects before paint on a full load, `FirstRunGate` on client navigation. Never again once seen or once a unit is saved; never when storage is blocked. More → "أعد أسئلة البداية" re-runs it, asking first when a unit is saved.
- **Browser-only state** (`src/lib/guest/`): one versioned localStorage key `backdesk:guest` = `{ v: 1, firstRun: { seen, count }, units: [{ id, engineVersion, form, assumed }] }` — inputs only, never results or the locale; read without Zod (hand checks, then `parseCalculatorForm`), anything unreadable falls back to empty. The flow's answers live in sessionStorage (`backdesk:first-run`); only `?step=` is in the URL, so a reload or language switch never sends the visitor's numbers to the server. Reaching the verdict saves the unit ("تُحفظ هذه الشقة كأول وحدة لك على هذا الجهاز.").
- **Units:** the visitor's own unit first ("شقتك الأولى", occupancy, nightly rate, net after depreciation, the nights-vs-break-even bar; opens the calculator), then the sample units unchanged under "أمثلة تجريبية". No own unit: "أضف شقتك الأولى" starts the flow. Own unit: "أضف شقة" opens "الشقة الثانية ضمن الاشتراك" / "شقتك الأولى تبقى مجانية." with "شاهد الباقات" and "ليس الآن" (no real gating).
- **Calculator:** "الملخص" fits one screen above the bottom nav (e2e-checked at 390×844 and 360×800, both languages): the net after depreciation, a sentence, a nights slider from 0 to the available nights with the break-even marker (gap amber, surplus mint; a text pill when beyond the month or impossible), model chips, two steppers (nightly rate ± 100; rent ± 1,000 / commission ± 1 point / platform fee ± 0.5 point) and three rows that reconcile. "كل الأرقام" holds every input in collapsible sections with their totals (one open at a time), the subtotal "الربح قبل الإهلاك" as a ledger line, and every former result under "مؤشرات أخرى". Both tabs share one state; the tab is `?tab=all`.
- **Engine:** `scenarioView` (`src/lib/finance/scenario-view.ts`, additive, tested): reconciled rows and section totals; the uncapped after-depreciation break-even with a status; the sentence case; the outcome; manager profit. No existing formula, test or `ScenarioResult` field changed.
- `src/test/tmp-print.test.ts` (a leftover debug test that wrote into another session's scratch directory) is deleted.

**Decisions**
- **Headline after depreciation** on every screen (Amir). Home and Units already were; the calculator changes. Before-depreciation figures stay as labelled rows. The owner statement's `owner_net` is unchanged (no depreciation by definition). Recorded in BUILD_PLAN §4.3 and CLAUDE.md §7.
- **Reconciliation** (Amir): total costs with depreciation is defined as revenue − net, so the summary rows add up as displayed; section totals reconcile to the subtotal and the net, with the leftover piastre on a computed line (operating expenses, then platform fees, then commission) — never on a typed amount: rent typed as 35,000 always shows 35,000.00.
- **Break-even beyond the month** (Amir): the engine returns the uncapped nights and a status (within the month, beyond the available nights, no break-even when the per-night contribution after commission is ≤ 0); the UI only picks the sentence.
- **Night counts** (Amir): the exact value on the marker, the Units bar and "التعادل عند" (21.41); whole nights in the "short" and "above" sentences, with ICU plurals (ليلة واحدة / ليلتان / 4 ليالٍ / 11 ليلة). When booked equals the first profitable night, a dedicated sentence: "أنت عند أول ليلة تحقق مكسبًا؛ بليلة أقل تصبح النتيجة خسارة." (flow: "…: أول ليلة تحقق مكسبًا، وبليلة أقل تصبح النتيجة خسارة.").
- **تجريبي tag** (Amir): every input the flow didn't ask about is assumed until the visitor *commits* it — focus, then blur or Enter — even without changing the value. Only inputs the visitor can see for the current model count toward the tag on the own card.
- **Unit details** (Amir): shown, read-only as before, only when the calculator shows the example; never for the visitor's own unit.
- **Managed own unit** (Amir): the Units card follows the managed pattern (management profit = the commission, since a scenario has no manager-borne costs, plus "العمولة: 20% من صافي المحوّل"; no break-even bar); the calculator and the verdict keep the owner's view ("صافي ربح المالك بعد الإهلاك", "مكسب المالك"). "مؤشرات أخرى" shows the same management profit, so the two screens reconcile.
- **Example loaders** at the top of "كل الأرقام"; with an own unit, loading one asks first ("استبدال أرقام شقتك؟"). *Superseded on 2026-10-07: with an own unit the loaders are not shown at all (see "Post-slice-1 cleanup and pricing").*
- **Phase record** (Amir): this batch is P.2's first slice (BUILD_PLAN P.2 lists what it delivers and what remains); the 3–5 host review moves to after it and before the rest of P.2.
- Defaults kept from the plan: the flow keeps the "بيانات تجريبية" banner and the language switch (Board 1 had neither; CLAUDE.md §7 requires both behaviours); no back link on the calculator tab; sample cards unchanged; a displayed net of 0.00 counts as "مكسب".

### P.2 slice 1 build notes (2026-10-07)

- **Hydration:** every `/demo` page is static, so browser state is read with `useSyncExternalStore` (server snapshot `null`). Until it is read, the calculator renders its frame without numbers and Units reserves the own unit's space, so nothing flashes or jumps.
- **Tap crawler:** `e2e/guest.ts` re-seeds the guest state and clears the flow's answers before every load (`addInitScript`), so a tap that saves something never leaks into the next reload (the P.1.1 sessionStorage lesson). The crawl covers `/demo/start`, `?tab=all`, and Units / calculator / More with an own unit; the selected calculator tab (`aria-selected`) is exempt like a checked radio. `playwright.config.ts` seeds the "seen" flag by default; `e2e/first-run.spec.ts` starts from an empty browser.
- **RTL sliders:** native `<input type="range">` (keyboard and screen-reader operable) with the track, fill and markers drawn by logical insets, so the fill grows from the reading start in both languages; no physical left/right or transforms.
- **Fits one screen:** measured at 390×844 and 360×800 in both languages and all three models; the headline is 48px, 40px on viewports under 820px tall.
- **`DataWarning`** used colour classes that didn't exist (unstyled since Phase P); `warning` tokens added.
- **`e2e/calculator.spec.ts`** still asserted the pre-rename verdict wording on `main` (missed in #8); rewritten here.
- **`sameForm`** now compares field by field: a form read back from storage has its values in another key order.

### Post-slice-1 cleanup and pricing (2026-10-07)

Two small tasks from Amir in one branch (`post-slice1-pricing`). No engine change.

**Done**
- **`agentRules: false`** in `next.config.ts`: `next dev` no longer appends its generated "nextjs-agent-rules" block to `CLAUDE.md` (checked by running `pnpm dev` once: `CLAUDE.md` unchanged). `next-env.d.ts` still changes under `next dev`; that is a separate mechanism with no config switch (see open issues).
- **No example loaders above the visitor's own numbers** ("كل الأرقام"): they sat directly above the model chips and looked the same, so a visitor could replace their unit by mistake. They stay, unchanged, when the calculator shows the example. The confirm sheet ("استبدال أرقام شقتك؟") and its three message keys are removed.
- **Sample statement buttons** on the managed sample cards are 44 px tall (were 40 px); nothing else on the sample cards changed. `e2e/navigation.spec.ts` measures both.
- **`/demo/pricing`, two plans:** Free ("مجاني", one apartment: unlimited bookings and expenses, the full calculator, this month's result) and Pro ("برو", 249 EGP a month, تجريبي: everything in Free, the full month and past months, the monthly PDF and the owner statement, Airbnb import, each extra apartment at half price). Pro lists the monthly totals for 2–5 apartments (374 / 499 / 624 / 749), then "أكثر من 5 شقق: باقات خاصة" with "تواصل معنا". Two lines under the cards: the first month is fully open; payment is month to month, with no automatic renewal. Solo, Business and the old free line "حسابات كاملة لوحدة واحدة" are gone; the founding-members block, the setup kit and the تجريبي tags are unchanged.

**Decisions and build notes**
- **One price constant:** `PRO_PLAN_PRICE` in `src/demo/fixtures/pricing.ts` (SAMPLE). `src/lib/pricing/apartment-price.ts` computes the extra apartment (half, rounded up to a whole pound: 125) and the totals with `decimal.js`; property-tested. A test fails if any price or total appears in the `pricing` messages. Plan pricing is what a host pays Backdesk, not a host's financial figure, so it is outside `src/lib/finance/`.
- **"تواصل معنا"** reuses the feedback WhatsApp number through one helper (`src/lib/whatsapp.ts`, now also used by the "رأيك؟" link and More) and prefills "مرحبًا، أسأل عن باقة خاصة في باك ديسك لأكثر من 5 شقق." so the chat says why it was opened. While `NEXT_PUBLIC_FEEDBACK_WHATSAPP` is unset, the action is not rendered. `playwright.preorder.config.ts` now builds with a test number too, so `e2e/preorder-env.spec.ts` checks the real link. *(Superseded on 2026-10-09: all of this is now an email to `support@backdeskapp.com`, `src/lib/whatsapp.ts` is deleted, and the contact is always shown.)*
- Each card says how many apartments it covers ("شقة واحدة" / "شقة أو أكثر"), where the unit limits used to be.
- **No "الأكثر اختيارًا" badge** (Amir, review of #10): there are no customers yet and only one paid plan, so the claim is not true. Its two message keys are removed; Pro keeps its highlighted frame.
- **`next-env.d.ts` is not tracked** (Amir, review of #10): it is in `.gitignore`, and `pnpm typecheck` is `next typegen && tsc --noEmit`, so a fresh clone (no `.next`, no `next-env.d.ts`) still type-checks; checked on a fresh clone, with a deliberate type error as a negative control. After `pnpm dev`, `git status` stays clean.

### Plan model (2026-10-07)

Confirmed by Amir in the review of #10, written into `CLAUDE.md` §1 and §9 and `docs/BUILD_PLAN.md` §0, §1 (personas), §2, §3, Phases 0b, 3, 5, 7 and 4, and §6. **It supersedes "Free gets a manual ledger for 1 unit with full history"** ("Never hide the answer", in "Product and plans" above) and the Solo / Pro / Business tiers. No migration is written yet.

- **Principle:** data entry is free, outputs are paid. The free figure is always the full, correct number, never a degraded one.
- **Free:** one apartment; unlimited entry of bookings and expenses; the full feasibility calculator; the current month's result (profit or loss), plus its occupancy and average nightly rate from actual figures (added by Amir on 2026-10-08). No breakdown, no past months, no reports, no import.
- **Pro:** 249 EGP a month, tentative. The full month breakdown, all past months, the monthly PDF report, owner statements, Airbnb report import. Each additional apartment costs half the plan price (rounded up to a whole pound), up to 5 apartments; more than 5 is a custom plan by contact.
- **Trial:** the first month after creating an account, everything is open for every apartment the user declared.
- **After the trial without a subscription:** the user keeps working month by month on Free. Their data is kept, never deleted. Extra apartments are frozen with their data.
- **Payment:** monthly, no auto-renewal, manual at first. Solo, Business and the annual prices are removed.
- **How I mapped the capabilities the model doesn't name** (`docs/BUILD_PLAN.md` §2 table; confirmed by Amir on 2026-10-08, with the one change noted below):
  - Entry stays free wherever the month's result depends on it: recurring rules, agreements and commission settings, receipt photos (still capped by `receipt_photos_max`), and CAPEX, including the actual cost entered on a Phase 3 checklist item (previously paid).
  - "The full calculator" on Free includes the sensitivity grid at full size, 7 × 7 (previously 3 × 3 on Free, 7 × 7 paid; BUILD_PLAN Phase 2 updated to match). The 12-month projection and the benchmarks stay Pro (server-only, CLAUDE.md §6.5), as do saved-scenario comparison and exports.
  - Break-even, payback and the rest of the month breakdown (including RevPAR) are Pro (previously Free for 1 unit). *Changed by Amir on 2026-10-08:* occupancy and the average nightly rate from actual figures are Free.
  - Smart entry (AI) stays Pro for now: it is entry, but every call costs money (BUILD_PLAN §6 question 18: Amir kept this default on 2026-10-08 and left the question open).
  - Alerts, exports, team seats and the owner portal stay Pro; the setup guide, checklists, inventory and Setup Kit are unchanged.
  - **Manual entry of a booking and of other income** is added to Phase 5, free on every plan. Free promises "unlimited entry of bookings", but no phase built a way to enter one by hand: `stays` came only from the Pro payout import (Phase 6), so a Free month result had no revenue path. The form itself is set in the Phase 5 plan.
  - Data model: `plans` seeds `free` and `pro` (no other tiers); `plan_prices` has monthly and one-time prices only, and the extra-apartment price is derived by `src/lib/pricing/apartment-price.ts`, never stored; `subscriptions` is one row per paid month with the number of apartments and the amount charged. Phase 4's Paymob checkout charges one month at a time (no `cancel`, no recurring billing) next to manual InstaPay payments.
- **Open** (recorded in "Open issues" and BUILD_PLAN §6): the sign-in method (question 16); when the trial clock and the gating get built (question 17); smart entry on Free (question 18). *Questions 16 and 17 were decided on 2026-10-08; see the next section.*

### Final review of #10 (2026-10-08)

Amir's answers before merging #10, written into `CLAUDE.md` §1, §3, §5 and §6.5 and `docs/BUILD_PLAN.md` §0, §1, §2, Phases 0b, 2, 3, 5, 7 and 9, and §6.

- **Sign-in (question 16): Google only for now.** Email codes come later, once there is a domain and a custom SMTP sender (Resend), because Supabase's built-in mailer delivers only to the project's team members. Consequences: a Google Cloud OAuth client becomes a Phase 0b prerequisite; the domain (question 1) now blocks email sign-in and every email Backdesk sends, starting with Phase 5's invitations, which are accepted by signing in with Google as the invited address.
- **Trial and gating (question 17): built together with the month report, in Phase 7.** Until then every account works with everything open. The entitlements service (`getEntitlements`, `useEntitlements`) moves from Phase 0b to Phase 7, and the limits written into Phases 2, 3 and 5 (saved scenarios, apartments, the guide's paid sections, the inventory preview, the receipt-photo cap) are enforced from Phase 7; their acceptance checks moved there. Migration 001 still creates `plans`, `plan_prices` and `subscriptions`, so founding members and Setup Kit buyers are recorded before Phase 7. Phase 7 now names the month report ("تقرير الشهر", each unit's month on screen and as a PDF). Left to the Phase 7 plan: how the declared apartment count is captured, which apartment stays active after the trial, and when the trial clock starts for accounts created before Phase 7.
- **My reading, to confirm in the Phase 2 and 3 plans:** signed-out visitors are not accounts, so "accounts work with everything open" doesn't cover them. Default: they see the Free view (the projection and benchmark teasers), with sign-up as the call to action.
- **Smart entry (question 18):** default Pro kept; the question stays open.
- **Free also shows occupancy and the average nightly rate** from actual figures, for the current month. Break-even, payback and the rest of the month breakdown (including RevPAR) stay Pro.
- **The other capability mappings are confirmed** as written in "Plan model (2026-10-07)": CAPEX entry, recurring rules, agreements and receipt photos on Free; the full 7 × 7 grid on Free; the rest of the Pro list.
- **Copy:** `common.lockedTeaserBody` is now "متاح في الباقة المدفوعة" / "Available on the paid plan", and the guide's `detailedPlaybookLockedBody` says "الباقة المدفوعة" / "the paid plan". A test in `src/test/i18n.test.ts` keeps any message from saying "paid plans" in the plural again.
- The `/demo/pricing` cards are unchanged: Free's three lines still don't mention occupancy and the nightly rate.


### Rename to Backdesk (2026-10-06)

Rename-only batch (brand name, logo, verdict wording), branch `rename-backdesk`; no feature, finance-engine, layout, auth or Supabase change.

**Done**
- Product name is now **Backdesk · باك ديسك** (formerly Safi / صافي): `meta.siteName`, `meta.description`, `common.brandName`, `feedbackPrefill` and the demo's about text in both locales; the page `<title>` follows `meta.siteName`. There is no manifest and no `og:site_name` yet, so none was added (BUILD_PLAN Phase 0a still plans the PWA manifest, now named "باك ديسك").
- The "ص" letter mark is replaced by one `BrandMark` component (`src/components/common/brand-mark.tsx`, the approved key logo, coordinates verbatim); `LogoMark` renders it with the brand name as its accessible name; the `common.brandMark` key is removed. It carries no transform or `rtl:` utility, and `brand-mark.test.tsx` checks the orientation (ring left, bars rising left to right, tallest bar mint) in `ar` and `en`.
- `src/app/icon.svg` is replaced with the approved app icon. No other icon or social-image files exist.
- Verdict wording uses accounting nouns: "مكسب" / "خسارة" and, for the managed-for-owner model, "مكسب المالك" / "خسارة المالك" (English: Profit / Loss, Owner profit / Owner loss). The calculator passes an `owner` select argument (yes for managed-for-owner) to the verdict strings; the wording lives only in `messages/*.json` and the engine's verdict kinds are untouched.
- `package.json` `name` is `backdesk`; `pnpm-lock.yaml` does not contain the package name, so it needed no change (`pnpm install --frozen-lockfile` passes). `.env.example`'s header comment names Backdesk (no variable renamed).

**Decisions and left untouched**
- "صافي" meaning "net" (صافي الربح, صافي المحوّل, صافي الدخل التشغيلي, صافي المالك, ...) is unchanged everywhere.
- The home hero question "كم ربحت فعلاً هذا الشهر؟" (`home.heroQuestion`) is a question, and CLAUDE.md §7 prescribes it word for word, so it was not rewritten as a verdict.
- No localStorage/sessionStorage keys, cookies or analytics event names contain "safi" (the repo has none yet), so nothing needed leaving in place.
- Not touched: GitHub repo name, Vercel project, routes, env var names, URLs, domains, `metadataBase`.

**Next step:** (superseded) Phase 1 and the rename are merged; see "Current status".

### Phase 1 decisions (2026-10-01)

Plan approved by Amir with the four proposed defaults and three changes of his own.

- **Defaults approved:** (1) Downtown Cairo stays §4.6 Example A exactly, so its statement can be checked by hand against the spec; (2) the two owner-run units carry SAMPLE setup costs, so "net profit" is genuinely after depreciation (before Phase 1 it was really NOI); (3) Rehab's co-host bears the guest supplies, so "commission − manager-borne costs" is visible; (4) the calculator's unit details (city, area, bedrooms…) stay read-only until Phase 2's benchmark uses them — tapping one explains that.
- **Cost-basis consistency (Amir, critical).** Any break-even shown next to a profit figure covers the same costs; if it doesn't, its label says which costs it covers. My plan's Sheikh Zayed figures broke this: a −7,507 net profit (after 4,166.67 depreciation) next to a ~19-night break-even that excluded depreciation — the P.1.1 maintenance bug again. Implementation:
  - One function, `modelPnl` (`src/lib/finance/model.ts`), evaluates profit for the calculator's displayed figures, the break-even solver, the sensitivity grid and the projection, always with an explicit `ProfitBasis` (`includeIrregular`, `includeDepreciation`; depreciation has no default). Every `BreakEvenResult` carries its basis.
  - ~~The calculator's headline is **profit before depreciation** (NOI − commission; repairs included); its break-even tiles and verdict use that basis; the "without maintenance" line is labelled; **net profit after depreciation** has its own break-even line beside it ("21.41 nights" for Example B with the SAMPLE setup cost).~~ **Superseded 2026-10-07 (P.2 slice 1):** the headline is net profit **after** depreciation, with the break-even beside it on that basis (21.41 nights for Example B); the before-depreciation figures are labelled rows under "مؤشرات أخرى".
  - Home's break-even tile uses the **net-profit basis** (repairs and depreciation) and says so: Sheikh Zayed needs **23** nights (22.22), not 20.
  - Invariant tests: at `ceil(break_even_nights)` the displayed (piastre-rounded) profit is ≥ 0, at `floor` it is < 0 — property-tested over random scenarios for both the profit before depreciation and the net profit after it, and checked on the Home tile against the unit's actual net profit.
  - Recorded in `docs/BUILD_PLAN.md` §4.3 and `CLAUDE.md` §7.
- **Whole-night target, defined precisely:** the first whole night whose *displayed* profit is ≥ 0. That is `ceil(break_even_nights)` except in a sub-half-piastre tie (e.g. 20.000002 nights, where profit at 20 nights is −0.004 and displays as 0.00), where it is the floor — so "break-even at N nights" never contradicts the profit on screen.
- **Live verdict (Amir).** No static text next to live numbers: a rule-based verdict (`verdict.ts`, brought forward from Phase 2) reads the sign of the displayed profit and the break-even on the same basis: profitable / at break-even / loss / unreachable (never profitable, or more nights than the month has) / no available nights.
- **Sample data (Amir):** Madinaty 20 nights (66.7%) at 2,032.50; Rehab 1,600 a night, where 10% of gross (2,740) stays under the 3,000 minimum. Sheikh Zayed (17 nights at 1,758.82, 24,000 rent) and Downtown (Example A) as proposed. Engine output for September: Madinaty net +23,251.00; Sheikh Zayed net −7,506.67; Downtown manager profit +8,010.60; Rehab manager profit +2,280.00; owner view 15,744.33, co-host view 8,790.60 (after 1,500 overhead).
- **Delta chips** are computed against a sample August through `monthOverMonthChange` (+8.5% owner, +4.4% co-host), hidden when last month was zero or a loss, and never capped at 100% (the `Percent` component caps by default — the chip opts out).
- **`parseAmount`** gained `allowZero` (zero accepted; negatives become a new `negative` code) and `maxDecimals` (0 for nights). Defaults are unchanged; an overload keeps add-expense's error type narrow.
- **Engine conventions** (decided here, for later phases to keep): input-dependent failures are typed `Result`s, never throws; dates are `YYYY-MM-DD` strings with no time-zone arithmetic; `one_off` costs count with `irregular` ones; other fees (like the cleaning fee) are recognized on the check-in date; a platform-fee allocation gives the leftover cent to the last *non-zero* component, so a zero cleaning fee stays exactly zero; a split expense gives the leftover cent to the manager's line; categories without a bearer rule are borne by the owner; payback uses profit before depreciation as monthly cash flow and is null when nothing is invested or cash flow is ≤ 0; the sensitivity grid's occupancy axis is kept within 0–100% (hypothetical axis values, not data).
- **Modules beyond the §5 list:** `model.ts` (the per-night model), `pnl.ts` (one unit-month from actuals), `scenario.ts` (the calculator), `verdict.ts`, `schemas.ts`, `result.ts`, `version.ts`.

### Phase 1 build notes (2026-10-01)

- **Pre-merge review fixes (2026-10-02, Amir):**
  - **Cost-basis bug in the calculator:** "ربح الليلة قبل المصاريف الثابتة" showed 2,058.50 for Example A, the contribution *before* the 20% commission, while the 3.04-night break-even implies 4,900 ÷ 3.04 = 1,613.47. Each reached break-even now carries the linear piece it sits on (`contributionPerNight` after commission, `fixedCosts` including any fixed commission in force). Managed units show both labelled lines (before 2,058.50 / after 1,613.47) plus "التكاليف الشهرية الثابتة في حساب التعادل" (4,900.00). Tests: fixed ÷ contribution = break-even nights as an engine property, and on screen for both presets × every commission basis (incl. a hybrid whose minimum is in force).
  - **Return metrics** renamed to say what they cover: "العائد على تكلفة التجهيز فقط" / "مدة الاسترداد على تكلفة التجهيز فقط" ("…والتأمين فقط" on arbitrage, where the deposit is included), with the note "لا يشمل ثمن الشقة" (AR + EN).
  - **Preset B is generic:** "مثال: إعادة تأجير", unit details "القاهرة الكبرى / مثال عام", so it can't be confused with Home's Sheikh Zayed unit (24,000 rent vs. the example's 35,000).
  - **Number fields** show thousands separators on blur (`formatTypedAmount`, src/lib/format/amount.ts) and the raw digits while focused; the stored value never changes.

- **Tests:** 276 unit tests. Engine: `examples.test.ts` (every §4.6 example), `invariants.test.ts` (fast-check, §4.7 plus the same-basis property), `core.test.ts`, `solvers.test.ts`, `ledger.test.ts`, `schemas.test.ts`; coverage of `src/lib/finance/` is 99.8% lines / 98.6% branches, enforced at 95% by `pnpm test:coverage`. A sampling check showed ~78% of random break-even cases reach a root (the rest split between both unreachable reasons), so the properties are not passing vacuously. E2E: 82 tests, including the new `e2e/calculator.spec.ts` (Phase 1's last acceptance item), the tap crawler and the axe sweep, all on the final build.
- **`projection.ts` is server-only, proven:** a temporary client component importing it made `next build` exit 1 with "You're importing a module that depends on "server-only"" (reverted). The engine's `index.ts` does not re-export it, an ESLint `no-restricted-imports` rule blocks it from `src/components/`, `src/demo/` and `src/lib/format/`, and a unit test checks both. Vitest aliases `server-only` to an empty stub (`src/test/stubs/server-only.ts`).
- **Raw inputs vs. computed figures:** `src/demo/sample-data/` holds only what a host would type (stays, per-stay costs, monthly bills, agreements, SAMPLE setup costs, calculator presets); `src/demo/fixtures/` builds every figure through the engine. `src/test/fixtures.test.ts` fails on any decimal literal in a fixture module (`pricing.ts` and `guide.ts` exempt: SAMPLE plan prices are inputs).
- **The calculator form** (`src/lib/calculator/form.ts`) parses every field with `parseAmount` and then validates the assembled scenario with the engine's own `scenarioInputSchema`, mapping cross-field issues back to fields. While a field is invalid, results keep the last valid entry, dimmed, with a notice. Example chips are radio buttons, checked only while the form exactly matches that example; tapping one after editing resets to it (so the tap crawler never meets a silent chip).
- **No Zod in the browser.** The first calculator build imported the engine's `scenarioInputSchema` into the client form, which pulled ~97 KB gzipped of Zod into `/demo/calculator` (317 KB of JS vs. 199 KB on Units). Zod is for server boundaries (CLAUDE.md §6.6), so the form now applies the same bounds itself, and `src/lib/calculator/form.test.ts` proves property-based that every scenario the form accepts passes `scenarioInputSchema`. The calculator page is now 228 KB gzipped (the engine plus decimal.js add ~29 KB over Units). An ESLint rule keeps `zod` and `@/lib/finance/schemas` out of `src/components/`, `src/demo/` and `src/lib/{format,calculator}/`.
- **Negative zero:** `roundMoney` returns plain zero for a tiny loss that rounds to 0.00 (found by a solver test: `toFixed` gave "-0.00"). The UI formatter already guarded against it.
- **Finance tests run in Vitest's `node` environment** (`// @vitest-environment node`); `vitest.setup.ts` now skips the jsdom URL reset when there is no `window`.
- **Sandbox gotcha:** stop a background `next start` by its pid (`ps`), not `pkill -f "next start"` — the pattern also matches the calling shell and kills it. A stale server left on port 3000 also keeps serving the `.next` it loaded at start; restart it after every rebuild before trusting screenshots.

### Phase 2 decision revision (2026-09-30)

Decided, not implemented: a docs-only change while Phase 1 is still in progress. **This supersedes the AirROI parts of "Phase 2 pre-decisions (2026-09-29)" below**, and where the two conflict, this section wins.

- **Goal:** the calculator needs a reference average for any area in Egypt, not a listing-level dataset. Benchmarks become a small lookup table of medians, refreshed quarterly, over a new geographic hierarchy (`docs/BUILD_PLAN.md` §3 and §5, Phase 2 scope).
- **Data model (`docs/BUILD_PLAN.md` §3):**
  - **New `regions` table:** `name_ar`, `name_en`, `level` (area, city, governorate, national), `parent_id` (null only for `national`), `is_seasonal`, `peak_months`. A `city`-level parent may be a tourism region such as الساحل الشمالي.
  - **`benchmarks` revised, reconciled column by column against the existing shape:**
    - Kept: `bedrooms` (now defined as 0 = studio … 4 = 4+), `sample_size` (already existed; nothing added), `source` (already `curated`/`api`/`aggregated`; nothing added), `as_of` (now defined as the period the figures describe).
    - Added: `region_id` (→ `regions`), `season` (annual, peak, off_peak), `adr_median`, `occupancy_median`, `annual_revenue_median`, `currency`, `fetched_at`, and a unique key `(region_id, bedrooms, season, source)`.
    - Replaced: the free-text `area_code` and `city` by `region_id`; the long format (`metric` + `p50`) by the wide `*_median` columns.
    - Dropped: `p25` and `p75`, because only medians are stored, never means.
    - Types follow CLAUDE.md §6.2 (`numeric(14,2)` for money, `numeric(7,4)` for occupancy). These are global reference tables, so they have no `org_id`; RLS is enabled, only the service role writes, and `benchmarks` is read only by server-side, entitlement-checked code. That last point is my addition, to keep them consistent with CLAUDE.md §6.4–6.5.
- **Lookup rule:** start at the user's region, bedroom count and `annual` season. Pick by source precedence and ignore rows older than 12 months. If there is no row, or `sample_size < MIN_SAMPLE` (config, default 30), move to the parent region. At `national`, use the row regardless of sample size. If nothing is found at any level, hide the benchmark. The result carries `resolved_level`, `resolved_region_name` and `sample_size`.
- **Source precedence, including where `aggregated` goes:** `curated` → `aggregated` → `api`. The spec fixed curated first and api after it, and left `aggregated` for me to place from its existing definition. That definition (Phase 9) is anonymized, real booked performance from opted-in orgs' Backdesk ledgers, with at least 5 units per cell. It is first-party actuals like `curated`, but not verified by hand, so it sits between the two. It doesn't exist until after launch, so this ordering has no effect in Phase 2.
- **UI:** label the resolved level when it differs from the one requested ("بناءً على متوسط <region>"). "عينة محدودة" only at the national fallback. For seasonal regions, the annual headline sits alongside peak and off-peak figures when those rows exist.
- **Pre-build gates — results pending, to be recorded here before any implementation:**
  - **Coverage spike:** one AirROI request each for Madinaty, New Cairo, North Coast and Hurghada. Record the sample sizes and whether market-level summary endpoints exist. *Not run yet.*
  - **Licensing:** confirm AirROI's terms allow storing and displaying derived medians. *Not checked yet.*
- **Changed from 2026-09-29, point by point:**
  1. *"A scheduled job … pulls area-level data"* (frequency unset) → **quarterly job or manual trigger; no daily schedule.** Prefer market-level summary endpoints; if only listing-level data exists, compute medians in memory and persist only aggregated rows.
  2. *No rule on listing data* → **raw listings are never stored.** This rule is new.
  3. *"A row with `sample_size` below 30 shows 'عينة محدودة'"* (on any row) → **roll-up replaces the flag.** A thin row sends the lookup to the parent region, and the flag appears only at the national fallback.
  4. *"Madinaty: confirm coverage; fall back to the wider area or hide"* → **Madinaty is in the coverage spike, and an uncovered or thin area rolls up automatically.** It is hidden only if no level, national included, has a row.
  5. *"`benchmarks.csv` … a fallback for areas AirROI doesn't cover"* → **`curated` rows (verified own-portfolio performance) take precedence everywhere** and act as a sanity check on API figures.
  6. *"Confirmed coverage: New Cairo City, Second New Cairo, Nasr City and Cairo"* → **treated as unverified until the coverage spike records actual sample sizes.** The seed's priority list is new: Madinaty, New Cairo, Sheikh Zayed, 6th of October, North Coast, Ain Sokhna, Hurghada, El Gouna, Sharm El Sheikh, Alexandria.
  7. *`docs/BUILD_PLAN.md` §6 question 4 (confirm coverage for Rehab, Sheikh Zayed, Sahel, Gouna and Madinaty)* → **replaced by the two pre-build gates.** Questions 10–13 are new (calibrating `MIN_SAMPLE`, the returned currency and FX source, peak months, market-level summaries).
- **Unchanged from 2026-09-29:** AirROI is the API source (self-serve, $0.01/call, no monthly minimum). `AIRROI_API_KEY` stays server-only and is never a `NEXT_PUBLIC_` variable. Rows use `source = 'api'`. The hide-if-no-data rule stands.
- **Raised while reconciling; needs Amir's decision (`docs/BUILD_PLAN.md` §6, questions 14–15):**
  - **Question 14 (fall-through):** as written, the lookup checks only the top-precedence row at each level. A small `curated` own-portfolio row, which will almost always have `sample_size < 30`, would then force a roll-up to the parent region even when the same area has a solid `api` row. Recommended change: try the next source at the same level before rolling up. The spec is recorded as written until you decide.
  - **Question 15 (setup cost):** the revised `benchmarks` has no setup-cost column (the old long format could hold one, and §0's `benchmarks.csv` listed setup-cost figures). Recommended default: setup-cost references come from Phase 3's inventory budget planner.
  - **FX display:** "convert at display" has to respect CLAUDE.md §6.3 (no implicit or automatic FX). Question 11's default shows figures in the returned currency, labelled, until an explicit rate source is chosen.

### Phase 2 pre-decisions (2026-09-29)

Recorded ahead of the phase starting — a docs-only change, nothing implemented; Phase 1 is still in progress. **The AirROI parts are superseded by "Phase 2 decision revision (2026-09-30)" above**; kept here as history.

- **Market benchmarks are sourced from the AirROI API** (airroi.com), not manual curation alone. Self-serve, pay-per-call, $0.01/call, no monthly minimum. Confirmed coverage so far: New Cairo City, Second New Cairo, Nasr City and Cairo — the remaining launch areas (Rehab, Sheikh Zayed, Sahel, Gouna) and Madinaty specifically are unconfirmed (`docs/BUILD_PLAN.md` §6, question 4).
- **Architecture:** a scheduled job, not a live per-request call, pulls area-level data into the existing `benchmarks` table (`source = 'api'`, a new enum value alongside `curated` and `aggregated` — §3). Server-side only; the key lives in `AIRROI_API_KEY`, never a `NEXT_PUBLIC_` variable.
- **`sample_size` doesn't need adding — it's already in the `benchmarks` table** (§3, decided at kickoff on 2026-09-26). What's new: a row with `sample_size` below 30 shows a "عينة محدودة" (limited sample) flag instead of being presented as a solid market figure. This extends CLAUDE.md §2's existing rule (no benchmark without a real, cited source) — a thin AirROI sample is still real and cited, just flagged as thin rather than hidden or shown as SAMPLE. An area with no benchmark data at all (neither AirROI nor curated) still hides the feature entirely, per the existing rule.
- **Madinaty may have no direct AirROI coverage as a standalone area.** Confirm against the live API before building Phase 2; fall back to the wider compound/city area AirROI does cover, or hide the benchmark for Madinaty units, per the hide-if-no-data rule.
- `data/seed/benchmarks.csv` (manually curated) is downgraded from "the" benchmark source to a fallback for areas AirROI doesn't cover; Amir's prep checklist in §0 is updated accordingly, and a new checklist item asks for an AirROI account and API key.

### Phase P.1.1 decisions (2026-09-28)

- **Break-even now includes the maintenance/irregular allowance by default.** Amir's review found the Home tile claiming Sheikh Zayed "needs about one more night" to break even, when at 19 booked nights (one more than the fixture's 18) the unit still loses 788.50 — the excluded-by-default figure (18.99 nights) understated what a host actually needs. **New rule:** break-even's `fixed_costs` include the monthly maintenance/irregular allowance (e.g. repairs) by default; a per-scenario toggle excludes it. Verified by script: fixed 39,900 (35,000 rent + 2,500 utilities + 600 internet + 1,000 compound + 800 repairs) ÷ contribution 2,058.50 = 19.38 nights (64.6%; 20 whole nights, rounded up since a fractional night doesn't clear the line = 66.7%); excluded, fixed drops to 39,100 → 18.99 nights (63.3%, kept as "Example B2"). `docs/BUILD_PLAN.md` §4.3 and Example B/B2 updated; Phase 1 must implement these values. The UI (calculator) shows the included-by-default figure as the primary result, with the excluded variant as a secondary line; Home's compact tile shows only the primary figure (18 booked, break-even at 20 nights, needs about 2 more).
- **`parseAmount`** (`src/lib/format/amount.ts`) is the one place that turns a host-typed amount into a `Decimal` or a typed error (`empty`, `invalid`, `non_positive`): it normalizes Arabic-Indic and Persian digits, treats `٫` as the decimal point, strips `٬` and `,` as thousands separators, and rejects multiple decimal points, more than 2 decimals, negative amounts and zero. Every numeric input in `/demo` (currently just add-expense's amount keypad) goes through it; Phase 1's calculator reuses it. Add-expense shows a distinct message per error code (`errorAmountEmpty`/`errorAmountInvalid`/`errorAmountNonPositive`), never the empty-amount message for invalid input.
- **Language switch keeps per-screen UI state** (Home's owner/co-host mode) via a `?view=` URL query param, read with `useSyncExternalStore` for hydration safety (the same pattern add-expense already used for "today") and written with `history.replaceState` (a query tweak, not a router navigation). `LanguageSwitch` and More's language row carry the current `window.location.search` across the locale navigation. A bare reload of `/demo` (no query) still starts from "owner" — required by the tap-audit crawler, which reloads before every tap and assumes a fixed starting state; an earlier sessionStorage-based attempt broke that assumption and hung the crawler (a toggled co-host view leaked into the next reload, changing the DOM the crawler expected) — caught by re-running the crawler after the change, not just the new feature's own test.
- **Desktop shell:** `/demo` is wrapped in a ~480px-wide, centered column with a neutral background outside it (`src/app/[locale]/demo/layout.tsx`), regardless of viewport — below 480px this has no visible effect, so it needs no breakpoint. The wrapper's `transform: translateZ(0)` gives it its own containing block, so the floating bottom nav's `position: fixed` tracks the shell's width instead of the full viewport. Radix's `Sheet` dialog still portals to `document.body` and isn't constrained by this — acceptable for a bottom sheet on a mobile-first product; flagged here rather than fixed, since constraining it needs passing Radix's `Dialog.Portal` a `container` ref, which is more than this fix pass needs.
- **Accessibility sweep:** `@axe-core/playwright` runs against every `/demo` screen at 360px (`e2e/a11y.spec.ts`), failing only on "serious"/"critical" violations. It found two real issues, both fixed: (1) `<Money colorBySign>`'s currency label inherited the sign color at `opacity-70`, dropping a red loss figure's contrast below 4.5:1 on white — the color now applies to the number only, never the currency label; (2) the owner statement's `<dl>` nested `<dt>/<dd>` two `<div>`s deep (only one wrapping `<div>` per group is valid HTML) — `Line` now puts them directly in its one wrapping div, using `flex-wrap` plus `basis-full` on the owner-expenses breakdown list so it still drops to its own line visually.
- **Commission basis is fixture-level `Localized` text** (`UnitFixture.commissionBasis`, `STATEMENT.commissionBasis`), the same pattern as unit names and owner names, not an i18n message — it's per-unit sample data, not app copy. Downtown: "20% من صافي المحوّل" (§4.6 Example A). Rehab: "10% من الإيرادات، بحد أدنى 3,000" (§4.6 Example C's hybrid minimum).
- **Guide draft status moved out of the UI.** The "نص مبدئي" badge read as noisy chrome on every stage page; the draft status now lives in the `GuideStage` fixture (`draft: boolean`, standing in for Phase 3's MDX frontmatter) and here — the content still needs Amir's review before Phase 3 ships it for real.

### Phase P.1.1 build notes (2026-09-28)

- **New e2e specs:** `e2e/a11y.spec.ts` (axe on every screen, 360px), `e2e/desktop.spec.ts` (the ~480px shell and the bottom nav's width at 1280px, keyed off a new `data-testid="app-shell"` on the wrapper in `src/app/[locale]/demo/layout.tsx`), `e2e/preorder-env.spec.ts`.
- **`NEXT_PUBLIC_PREORDER_URL` is inlined at build time**, so exercising the real pre-order `href`/`target`/`rel` needed a separate build with it set: `playwright.preorder.config.ts` builds and serves on port 3010 with the var set, running only `preorder-env.spec.ts` (the main `playwright.config.ts` excludes that file via `testIgnore`, since its default build has no pre-order URL). Run it with `pnpm exec playwright test --config=playwright.preorder.config.ts`. Running two `pnpm build`s at once in this repo fails ("Another next build process is already running") — run the two configs sequentially, never in parallel.
- **jsdom test isolation:** `window.location` and `sessionStorage` are one instance per test *file*, not per test, in jsdom — `vitest.setup.ts` now resets the URL (`history.replaceState(null, "", "/")`) in `afterEach`, alongside the existing DOM cleanup, so a test that changes Home's `?view=` leaves a clean slate for the next test in the same file.
- **The tap-audit crawler caught a real bug before it shipped:** an early version of the language-switch fix persisted Home's owner/co-host mode in `sessionStorage` (written on every toggle, read on every mount). That broke `e2e/taps.spec.ts`'s core assumption — "the screen is reloaded before each tap so every element is tested from the same starting state" — because a co-host-mode toggle earlier in the crawl leaked into later reloads of the same page, changing which elements existed and hanging the crawler on a stale element index. Moved to a `?view=` URL query param instead: a bare `page.goto("/demo")` (no query) still starts from "owner", and only the language switch's own navigation carries the state forward. Re-ran the full crawler (not just the new feature's own test) after the fix to confirm.
- **`Money`'s color/opacity split:** `colorBySign`'s red/green class now applies to the number `<bdi>` only; the currency label keeps its own fixed `opacity-70` dimming without inheriting the sign color, fixing a color-contrast violation axe found (a red loss figure's currency label fell under 4.5:1 on white).
- **Owner statement `<dl>` restructure:** a `<dl>`'s direct children may only be `<dt>`/`<dd>` pairs, `<div>` (each wrapping one pair), `<script>` or `<template>` — axe's `definition-list`/`dlitem` rules enforce this recursively, rejecting a `<div>` that also contains a `<ul>`. The owner-borne-expenses breakdown list moved out from inside its `Line` row to a plain sibling `<ul>` between two separate `<dl>`s, and `Line` lost its `children` prop; each `Line` is now exactly one `<div>` directly containing one `<dt>` and one `<dd>`. Visual output is unchanged.
- **`commissionBasisLabel`** is a new i18n key on `UnitCard` (managed units only); `commissionLabel`'s placeholder changed from `{rate}` to `{basis}` (a full phrase, not just a percentage) on the statement, so `formatPercent` is no longer imported there.

### Phase P.1 review follow-ups (2026-09-28)

- **P.2 income: approved.** The visitor can also record income (the "إضافة دخل" pill) in Phase P.2, not just units and expenses — without it Home could only ever go down, which is a bad demo. `docs/BUILD_PLAN.md`'s Phase P.2 scope is updated.
- **P.2 browser data at sign-up: resolved, not open.** Same policy as the anonymous calculator draft decided at kickoff ("An anonymous draft scenario stays in the browser until sign-up, then is saved to the org", see "Sequencing, payments and validation" above): P.2's browser-only units and expenses are migrated into the new org by default at sign-up, through a server-side import path with the usual Zod validation and `audit_log` entries.
- **Rehab owner's name — investigated; not a spelling typo, but a real clipping bug.** Amir flagged "مى عزيز" as a typo of "مي عزيز". Two separate things were going on:
  1. The fixture's actual text was `"منى عزيز"` (Mona) — confirmed correct by inspecting the rendered DOM text node directly (codepoints م ن ى, U+0645 U+0646 U+0649). Across every font tested (IBM Plex Sans Arabic, the system sans fallback, monospace) and every size/weight/color combination in isolated tests, nun's dot sits right against alif maksura's descender, so "نى" reads as "ى" alone at a glance — a genuine legibility trait of this letter pair, not a typo.
  2. Respelling it "مني" (ya) in isolation fixed that, but the same bug persisted in the actual card: `unit-card.tsx`'s owner-label span combines `truncate` (`overflow: hidden`) with `text-xs`'s default 16px line-height on 12px text — a box exactly as tall as one line, no headroom — so ya's two dots, which sit lower than the line-height budget allows, were being **clipped**, not just hard to see. Confirmed with computed styles (`overflow: hidden; line-height: 16px; height: 16px`) and a before/after render.
  - **Fixed both:** the fixture now spells it "مني عزيز" (`src/demo/fixtures/units.ts`), and the span keeps `truncate` (for genuinely long names) but adds `leading-snug` so the line box has room for the descender (`src/components/units/unit-card.tsx`) — confirmed legible in a fresh render (`overflow: hidden; line-height: 16.5px`, dots fully visible).
  - Checked the same `truncate` + tight-line-height pattern elsewhere in the app (the carousel's operating-model label, an expense-bubble category label, a list-row title) with real Arabic sample data; none of them clip in practice — the words there don't have a descender as low as ya's. This is sample data with no real person behind it, so no real name was affected by the respelling.
  - **Worth flagging for later:** the underlying trap — `truncate` + a tight default line-height clipping Arabic descenders — is generic and will resurface with different words once real host/owner names are typed in from Phase 5 onward, where respelling isn't an option. Worth a deliberate line-height floor for Arabic body text in Phase 0a's theming pass, rather than spot-fixing each occurrence as it's found.

### Phase P.1 build notes (2026-09-27)

- **Route groups:** `/demo` pages live in `src/app/[locale]/demo/(tabs)/` (screens under the floating nav; the layout pads the bottom by `BOTTOM_NAV_CLEARANCE`) and `(task)/` (full-screen tasks without the nav: add expense). URLs are unchanged. Unknown paths hit `src/app/[locale]/[...rest]/page.tsx`, which calls `notFound()` so the localized `src/app/[locale]/not-found.tsx` renders with a 404 status.
- **Constants shared by server layouts must not live in `"use client"` modules** (they arrive on the server as client references, not values). `BOTTOM_NAV_CLEARANCE` is in `src/components/layout/constants.ts` for this reason.
- **Statically rendered pages must read "today" on the client.** Add expense reads the Cairo date through `useSyncExternalStore` (server snapshot `null`); a server-side date would freeze at build time.
- **Bidi:** `<Money>` and `<Percent>` put the signed number in `<bdi dir="ltr">`, with the currency label in its own span (after the number in Arabic, before it in English). Strings interpolated into sentences use `formatMoney(..., { isolate: true })` / `formatPercent(..., { isolate: true })`, which wrap the number in LRI…PDI (U+2066…U+2069). `formatMoneyParts` feeds the hero figure's dimmed decimals. English money now reads "EGP -2,847.00" (sign attached to the number).
- **Toasts and sheets:** `src/components/common/toast.tsx` (`ToastProvider` in the demo layout, `useToast`, `ToastButton`; an `aria-live` status region) and `sheet.tsx` (a Radix Dialog bottom sheet). `@radix-ui/react-dialog` was added; `@radix-ui/react-tabs` and `@radix-ui/react-progress` were removed with the old `card`, `progress` and `tabs` components.
- **Glass:** `.glass` and `.nav-pill` in `src/styles/globals.css` use `backdrop-filter`, with a solid-colour fallback under `@supports not (backdrop-filter: blur(1px))`. The meter on Home fills by `width`, not a transform, so it follows the reading direction.
- **No formulas in components:** expense shares, the "everything else" bubble, and the break-even display values (target nights, nights short, progress) are pre-computed in the fixtures and checked by `src/test/fixtures.test.ts`. Bubble diameters are layout only (√share, with a minimum size so small labels fit).
- **Tests added:** e2e `taps.spec.ts` (crawler), `locale.spec.ts` (switch keeps the screen, English browser lands on Arabic, localized 404s), and in `navigation.spec.ts`: nav clearance on every tab screen, the minus sign measured left of the digits in RTL, carousel/details/statement-pill flows. Add expense's e2e now checks validation messages and the unit sheet. The shared screen list is in `e2e/screens.ts` (spec files must not import each other).
- **Screenshots** of every screen (Arabic and English, 360 px) were produced with a throwaway Playwright script against `pnpm build && pnpm start` and sent to Amir; they are not committed.

### Phase P build notes (2026-09-26)

**Stack versions pinned** (newer than what CLAUDE.md's "latest stable" implied, checked against npm at build time — re-check before Phase 0a in case newer majors have since become compatible):
- Next.js 16.3.6, React 19.3, Tailwind CSS 4.3, next-intl 4.14.
- **TypeScript stays on `~5.9.3`, not 6.x**: `typescript-eslint` (an `eslint-config-next` dependency) only supports TypeScript `<6.1`.
- **ESLint stays on `^9.39`, not 10.x**: `eslint-config-next` needs `eslint-plugin-react-hooks@^7`, which isn't out for ESLint 10 yet.
- `eslint-config-next`'s flat-config entrypoint is imported as `"eslint-config-next/core-web-vitals"` (no `.js` — the package's `exports` map is extensionless).

**Next.js 16.3 renamed `middleware.ts` to `proxy.ts`** (same API, same `config.matcher` export); `middleware.ts` still works but logs a deprecation warning at build time. The app's locale proxy lives at `src/proxy.ts`.

**Routing:** `src/i18n/routing.ts` uses `localePrefix: "as-needed"` — Arabic (default) has no URL prefix (`/demo`), English does (`/en/demo`). `next.config.ts`'s `X-Robots-Tag` header rule needs two `source` entries for this reason (`/demo/:path*` and `/en/demo/:path*`).

**IBM Plex Sans Arabic tabular numerals — resolved.** Downloaded the actual Google Fonts files and inspected them with fontTools: the Western-digit (`latn`) glyphs (the default per CLAUDE.md §7) all share one advance width at both shipped weights (400, 600) — genuinely tabular, no `font-feature-settings` needed. The Arabic-Indic (`arab`) digits are *not* tabular and the font exposes no OpenType feature to make them so. `src/lib/format/money.ts` already supports a `digitStyle: "arab"` option (tested, unused by any UI yet since no settings screen exists before Phase 5/9) — when Arabic-Indic digits ship as a user setting, this needs either a different font for that mode or accepting non-tabular alignment; flag it then.

**Digit formatting:** `ar-EG-u-nu-latn` was confirmed in Node to group thousands correctly with Western digits; `src/lib/format/money.ts` and `percent.ts` build the display string manually (decimal.js for half-up rounding, `Intl.NumberFormat` only for digit grouping/style) rather than using `Intl.NumberFormat`'s `style: "currency"`, which inserts invisible bidi control characters around the currency symbol in Arabic locales.

**RTL chevron direction:** a "back" chevron points toward the reading-direction *start* (left in LTR, right in RTL) — base icon `ChevronLeft` + `rtl:rotate-180`. A "forward/disclosure" chevron (a list row leading somewhere) points the opposite way — base icon `ChevronRight` + `rtl:rotate-180`. Easy to get backwards (an earlier draft of this phase had both swapped); verified against real screenshots before merging.

**shadcn/ui:** this sandbox's network policy blocks `ui.shadcn.com`, so the `shadcn` CLI can't fetch components. `src/components/ui/` is hand-written in shadcn's own style (cva + Radix primitives) instead; since P.1 it holds only `button` and `badge`. If a future session has `ui.shadcn.com` allowed, the CLI can still be used for *new* components — `components.json` is already configured for it.

**Progress bar RTL fix:** shadcn's stock `<Progress>` fills via `transform: translateX(...)`, which is a *physical*-axis transform and doesn't flip with `dir`. Fill by `width` instead (no transform) — a block box's width grows from its inline-start edge, so it follows the reading direction. (`ui/progress.tsx` was removed in P.1; the Home break-even meter uses the same technique.)

**Test architecture:** Vitest component tests render `*Screen` components directly (not the Next.js `page.tsx` route files, which are async Server Components and can't run in jsdom); `src/test/render.tsx` wraps them in `NextIntlClientProvider`, and `src/test/mocks/navigation.tsx` stubs `@/i18n/navigation`'s `Link` as a plain `<a>` (next-intl's real `Link` needs the App Router context jsdom doesn't have). Playwright e2e tests hit a real `next build && next start` server instead, so they exercise real routing, headers and RTL layout. `vitest.setup.ts` calls `@testing-library/react`'s `cleanup()` in an explicit `afterEach` — `vitest.config.mts` doesn't set `test.globals`, so the library's own auto-cleanup can't detect the runner and DOM leaks across tests in the same file without this.

**Playwright browser:** `@playwright/test`'s default headless-shell binary revision doesn't match what's pre-installed in this sandbox; `playwright.config.ts` sets `launchOptions.executablePath` to the pre-installed full Chromium build instead (`/opt/pw-browsers/chromium`). The `pnpm start -- -p 3000` argument-forwarding pattern silently breaks under pnpm 9 (the `--` itself reaches `next start` as a literal argument); `playwright.config.ts`'s `webServer` sets `PORT=3000` as an env var instead.

**Fixture design:** Madinaty and Sheikh Zayed (owner-operated / arbitrage) reuse the revenue and cost figures from BUILD_PLAN.md §4.6 Examples A and B, but applied under a *different* operating model than those examples describe (no commission, since owner-operated/arbitrage units never have one) — this is why every Phase P unit shows the same 60% occupancy and 2,500.00 ADR; Phase 1's calculator will generate genuinely varied numbers. The two hero totals, the top-3-expenses list, the 1,500.00 portfolio overhead and the 20,000.00 owner payout are hand-picked, not in §4.6; `src/test/fixtures.test.ts` checks every fixture total sums exactly from its parts, and Phase 1 re-derives everything from the real engine.

**Feedback button (added when Amir approved the phase plan):** a "رأيك؟" button on every `/demo` screen opens WhatsApp with the screen path prefilled, via `NEXT_PUBLIC_FEEDBACK_WHATSAPP` (`src/components/demo/feedback-button.tsx`); hidden until that env var is set, same pattern as the pre-order button. *(Superseded on 2026-10-09: the button opens an email to `support@backdeskapp.com`, subject «ملاحظة على باك ديسك», body the screen path; if no mail app opens, a sheet shows the address with a copy button. `NEXT_PUBLIC_FEEDBACK_WHATSAPP` is gone.)*

### Security and privacy
- Owner access uses an owner-grant table and signed, expiring links.
- CSV files are parsed in the browser, and the file is never stored.
- Booking confirmation codes are hashed with HMAC using a per-org key.
- The `audit_log` redaction path is designed now.
- Add expense takes at most 4 taps (amount digits not counted), and speed is measured with PostHog timing. This replaces the old 10-second test.

## Open issues

- ~~**Batch 3, before PR B merges:** Amir tests the preview on his phone.~~ **Closed:** PR B merged (#13). Google's consent screen is still in Testing, so only listed test users can sign in until Amir publishes it.
- ~~**The UX audit cited in Batch 4 is not in the repo.**~~ **Closed on 2026-10-10:** `docs/backdesk-ux-audit-2026-10-09.md` (#18), together with `docs/FINANCIAL_BASELINE.md`.
- **The landing's example and `docs/FINANCIAL_BASELINE.md` (open, Amir):** findings 1–2 there say the `arbitrage` preset counts the furniture twice (furnished rent 35,000 plus 250,000 of setup depreciation) and books 18 nights, above the market range. The landing card shows that preset (−7,014), as approved, under the example chip. Changing the preset (§12 there) changes the card by itself; the share images then need `pnpm og:render`, and the share-image test fails until they are redrawn.
- **After the landing merges (Amir):** in Facebook's Sharing Debugger, "Scrape Again" for `https://backdeskapp.com/` and `/en`; verify the domain in Search Console and submit the sitemap; check the share card in a WhatsApp chat.
- **`robots.txt` disallows `/demo`,** so search engines never fetch those pages and never see their `noindex`; a `/demo` URL linked from elsewhere can still be listed by its address alone, without content. Revisit when `/demo` moves (for example to `/app`) or at launch, when `/demo` stops being `noindex`.
- **`docs/LAUNCH.md` does not exist yet,** although BUILD_PLAN Phase 10 and `next.config.ts` refer to it. Create it in Phase 10, with the landing's items (Phase 10 lists them).
- **Move the signed-in app out of `/demo` (for example to `/app`)** (raised by Amir, 2026-10-08). Signed-in apartments live on the `/demo` screens for now; since the 2026-10-09 hotfix no screen says "بيانات تجريبية" and a signed-in user sees no top line, and `/demo` stays `noindex`. Decide when, and what `/demo` becomes (the visitor demo only), before launch. Not done in PR B.
- **Redirect URLs are wider than needed** until Amir tightens them after PR B (`https://backdeskapp.com/**` → exactly `/auth/callback`; delete the `www` entry): `docs/SETUP_AUTH.md`, "After PR B merges".
- **Google's consent screen will say "continue to kmmfhaypqgzhoptmljki.supabase.co"** until the brand is verified. Now that `backdeskapp.com` is live, Amir can verify the domain in Search Console and submit the branding (free; `docs/SETUP_AUTH.md` step 6). The alternative, a Supabase custom domain, is a paid add-on and needs Amir's approval.
- **Required checks cannot be enforced** on this private repository on GitHub Free (the rulesets and branch-protection API answers 403). "CI / checks" and "Database tests / rls" green before a merge is a manual rule (`docs/SETUP_AUTH.md`). Enforcing it needs GitHub Pro or a public repository.
- **After an account is deleted,** its last access token stays valid for up to an hour but matches no row (PR A's design); the app signs out at once. Supabase's sign-in logs and Vercel's request logs are not deleted with the account (the privacy page says so).
- ~~**The pricing page's "تواصل معنا"** WhatsApp-only~~ **Closed on 2026-10-09:** it is an email to `support@backdeskapp.com`, always shown.
- **e2e runs locally, not in CI** (Playwright needs a browser and a build per configuration). CI runs lint, typecheck, unit tests and the build.
- **Questions for Amir:** see `docs/BUILD_PLAN.md` §6. The most urgent are the pre-order button destination (`NEXT_PUBLIC_PREORDER_URL`, still unset) and the Vercel connection, both blocking Amir's phone review; prices/founding terms (before the pre-order campaign), the Google OAuth client (Phase 0b) and the domain (email sign-in and every email, from Phase 5) come next.
- **Technical checks:**
  - Does Serwist work with the current Next.js bundler? (Phase 0a — not yet checked)
  - ~~Does IBM Plex Sans Arabic, as served, expose tabular numerals?~~ **Resolved in Phase P:** yes for Western digits (the default); Arabic-Indic digits are not tabular — see "Phase P build notes" above.
  - ~~Format Western digits in Arabic with `ar-EG-u-nu-latn`.~~ **Resolved in Phase P:** confirmed and implemented in `src/lib/format/`.
- **Phase 2 benchmark pre-build gates (before any implementation):** (1) the AirROI coverage spike, one request each for Madinaty, New Cairo, North Coast and Hurghada, recording sample sizes and whether market-level summary endpoints exist; (2) confirmation that AirROI's terms allow storing and displaying derived medians. Record both results in "Phase 2 decision revision (2026-09-30)" above. Two decisions are also pending from Amir: lookup fall-through (question 14) and where setup-cost references live (question 15) — see `docs/BUILD_PLAN.md` §6.
- **Invited users and personal orgs (decide in Phase 5):** users who join through an invitation should not get an auto-created personal org. The Phase 0b sign-up trigger creates one for every new user, so Phase 5 must change that behaviour in a new migration (migrations are forward-only). Options to weigh then: (a) the trigger skips the personal org when a valid invitation exists for the email; (b) the personal org is created lazily, on the first sign-in of a user who belongs to no org. To keep that change small, Phase 0b should put org creation in its own database function.
- ~~**Identical sample KPIs**~~ **Closed in Phase 1:** the four units now differ (67% / 57% / 60% / 53% occupancy; ADR 2,032.50 / 1,758.82 / 2,500.00 / 1,600.00), all computed by the engine.
- ~~**`DataWarning` unused**~~ **Closed in Phase 1:** wired to the engine's `availability_conflict` warning on the calculator, the unit cards and Home.
- **Phase P prototype audience:** per §0 (revised 2026-10-07), the prototype goes to a host review with 3–5 hosts once P.2 slice 1 is merged, before the rest of P.2.
- **Locked-month posting moves nights too (decide in Phase 5/7):** `postAllocations` re-posts the part of a stay that falls in a locked month to the next open month, nights included, so that month's occupancy would count nights that belong to the locked month. Revenue posting is per the spec; whether KPIs should use the posting month or the night's own month needs a decision before Phase 5's period locks.
- **Other fees on check-in (confirm in Phase 6):** the spec fixes the recognition date for cleaning fees but not for "other fees"; the engine recognizes them on check-in, like cleaning. Revisit if a real Airbnb export shows per-night extras (e.g. extra-guest fees).
- **Calculator scope left for Phase 2:** no tax input yet (the engine supports it), a fixed 30-day month, no sensitivity grid or break-even ADR on screen (both exist in the engine), and the unit details are read-only (shown only for the example scenario since P.2 slice 1).
- ~~**`next dev` writes into `CLAUDE.md` (Next.js 16.3)**~~ **Closed on 2026-10-07:** `agentRules: false` is set in `next.config.ts`; `pnpm dev` leaves `CLAUDE.md` unchanged.
- ~~**`next dev` rewrites `next-env.d.ts` (Next.js 16.3)**~~ **Closed on 2026-10-07:** the file is no longer tracked (`.gitignore`), and `pnpm typecheck` runs `next typegen && tsc --noEmit`, so a fresh clone still type-checks.
- ~~**Home and the visitor's own unit**~~ **Closed by the 2026-10-09 hotfix:** Home shows only the user's own apartments (calculator scenarios, monthly averages). Every sample screen carries its own "مثال · أرقام توضيحية" chip (added to the same PR before merge, at Amir's request). Still open for P.2: the add-expense flow has no entry point until it saves for real (the ≤ 4-taps rule is paused).
- ~~**Units sample statement buttons are 40 px tall**~~ **Closed on 2026-10-07:** both are 44 px (`h-11`), measured in `e2e/navigation.spec.ts`.
- ~~**Plan model**~~ **Decided on 2026-10-07:** Free and one paid plan, Pro, priced per apartment; written into `CLAUDE.md` and `docs/BUILD_PLAN.md`. See "Plan model (2026-10-07)" above.
- ~~**Sign-in method (open, decide before Phase 0b)**~~ **Decided on 2026-10-08:** Google only for now; email codes once there is a domain and a custom SMTP sender. See "Final review of #10 (2026-10-08)" above.
- ~~**When the trial clock and the gating get built (open)**~~ **Decided on 2026-10-08:** in Phase 7, together with the month report; until then every account works with everything open. The Phase 7 plan settles the declared apartment count, which apartment stays active after the trial, and when the clock starts for accounts created earlier. See "Final review of #10 (2026-10-08)" above.
- **Smart entry on Free (open, Phase 8):** BUILD_PLAN §6 question 18. Default: Pro, as before (Amir kept it on 2026-10-08).

## How to resume in a fresh session (including Claude Code on the web)

1. Read `CLAUDE.md`, `docs/BUILD_PLAN.md` and this file in full.
2. Send the standard phase prompt (`docs/BUILD_PLAN.md` §5.0) for the phase marked ⏭ above.
3. At the end of the phase, update this file: status, decisions, open issues, next step.
