# PROGRESS — Safi (صافي)

> Read together with `CLAUDE.md` (rules) and `docs/BUILD_PLAN.md` (spec and phases). Updated at the end of every phase.
> Last updated: 2026-09-29 (Phase 2 benchmark-source decision recorded, docs only; Phase 1 still in progress).

## Current status

- **Phase P (clickable prototype)** was merged into `main` (amirshosha1/str-money-finder#1). Amir reviewed it on his phone: it felt broken (silent taps) and the design was weak, which led to Phase P.1.
- **Phase P.1 (prototype fixes and redesign) is built**: tap audit (no silent taps, enforced by an e2e crawler), design direction A2 on every screen, an expense-details screen, the Arabic/English switch, the Arabic copy pass, and bidi/404/safe-area fixes. See "Phase P.1 decisions" and "Phase P.1 build notes" below.
- **Phase P.1.1 (fix pass on an independent end-to-end test) is built**, on top of P.1: the break-even rule changed (fixed costs now include the monthly maintenance/irregular allowance by default — see "Phase P.1.1 decisions" below, and `docs/BUILD_PLAN.md` §4.3 and Example B/B2), a shared `parseAmount` utility (`src/lib/format/amount.ts`) handles Arabic-Indic/Persian digits and Arabic separators on every numeric input, three expense categories were added, the language switch now keeps the current owner/co-host mode (via a `?view=` query param, not just the screen), commission basis is shown on managed units and the statement, the desktop shell is constrained to ~480px, the "نص مبدئي" UI label is gone, an axe-core accessibility sweep runs on every screen, paid pricing tiers say "كل ما في الباقة السابقة، بالإضافة إلى:", and the pre-order button's real `href`/`target`/`rel` now has its own e2e coverage. See "Phase P.1.1 decisions" and "Phase P.1.1 build notes" below.
- **Next step:** Amir reviews the P.1.1 preview on his phone and merges; then Phase **1** (finance engine + live `/demo` calculator). Send the standard phase prompt from `docs/BUILD_PLAN.md` §5.0 with `{N} = 1`.
- **Still unset on Vercel:** `NEXT_PUBLIC_PREORDER_URL` (pre-order buttons show "الحجز المسبق يُفتح قريبًا" until then) and optionally `NEXT_PUBLIC_FEEDBACK_WHATSAPP` (the "رأيك؟" link stays hidden until then). The prototype is for Amir's review only until Phase 1 lands — no pre-order push yet.
- **Deferred to Phase 1 / P.2 (explicitly out of scope for P.1.1):** an editable calculator (Phase 1 wires `/demo/calculator` to the real engine), varied per-unit sample data (Phase 1: every unit and both Home views currently show the same 60% occupancy / 2,500 ADR / 1,500 RevPAR), and live Home updates after saving an expense (Phase P.2: data stays browser-only, nothing is wired to Home yet).
- **Docs-only, 2026-09-29:** Phase 2's market-benchmark source is now decided (the AirROI API, with the curated CSV as a fallback) and recorded in `docs/BUILD_PLAN.md` §5 and in "Phase 2 pre-decisions" below. Nothing is implemented yet — Phase 1 is still in progress.

## Phase checklist (in execution order)

| Phase | Status |
|---|---|
| Kickoff: review, decisions, docs | ✅ Done (2026-09-26) |
| P — Clickable prototype | ✅ Merged (2026-09-26) |
| P.1 — Prototype fixes and redesign | ✅ Built (2026-09-27), fix pass built (2026-09-28, "P.1.1"); PR awaiting Amir's review |
| 1 — Finance engine (+ wire the `/demo` calculator to it) | ⏭ Next |
| P.2 — Interactive demo, data in the browser only | Not started |
| 0a — App shell, i18n, PWA, CI | Not started |
| 0b — Supabase dev project, auth, migration 001, DB tests in CI | Not started. Needs Amir's approval before creating the dev project |
| 2 — Free calculator | Not started. Benchmark data source decided (AirROI API, 2026-09-29) |
| 3 — Setup guide, checklists, Setup Kit, minimal `units` table | Not started |
| ⛔ Validation Gate | Waiting for 20 pre-orders paid by InstaPay (tracked by Amir outside the app) and the exact line `Gate passed: {number} paid pre-orders.` |
| 5 — ERP core (+ basic team invitations) | Blocked by the gate |
| 6 — Payout import | Not started |
| 7 — Reports and owner statements | Not started |
| 8 — Smart entry and alerts | Not started |
| 4 — Payments and legal | Not started |
| 10 — Hardening | Not started |
| 🚀 LAUNCH | — |
| 9 — Growth and moat (post-launch) | Not started |

## Environment facts

- Local machine: Windows 11, Node 24.15, pnpm 9.15, Git 2.54. **No Docker, WSL, Supabase CLI or `gh`, by design.** Do not ask Amir to install anything.
- The local path `I:\AI\STR App` contains a space. If a tool misbehaves, check that first.
- Repo: `github.com/amirshosha1/str-money-finder`, branch `main`.
- Supabase: no Safi project exists yet. The dev project (Frankfurt, free plan, Amir's last free slot) is created in Phase 0b only after approval. **Amir's other Supabase projects are off-limits.**
- Vercel is connected to the repo (Amir reviewed the Phase P preview on his phone). Not set up yet: Resend sending domain, PostHog, Google OAuth client, Paymob, Anthropic key, prod Supabase project.
- Phase P was built from a Claude Code on the web session (cloud container, Node 22.22, pnpm 10.33 available there — `package.json` still pins `packageManager: pnpm@9.15.0` to match Amir's machine; both installed the same lockfile cleanly). `pnpm dev`, `build`, `lint`, `typecheck`, `test` and `test:e2e` all exist now.

## Decisions (2026-09-26)

### Product and plans
- Working name: **صافي / Safi**.
- The home screen depends on the operating model. The owner view shows net profit. The co-host view shows commission minus manager-borne costs, summed across managed units, with portfolio-level overhead subtracted as its own line.
- "Never hide the answer" stays. **Free** gets a manual ledger for 1 unit with full history, including agreements and commission calculation, recurring rules and receipt photos. On Free, receipt photos are compressed in the browser and capped by `receipt_photos_max` in the plan entitlements. **Paid** unlocks 2+ units, payout import, owner statements, AI entry, alerts and exports.
- Fixed paid tiers: **Solo** up to 3 units, **Pro** up to 10, **Business** up to 30. They have identical features and differ only by unit limit. Prices live in the `plan_prices` table.
- Utilities default to a fixed monthly cost and can be switched per category. Every worked example states its cost types.
- The Free calculator runs in the browser. The 12-month projection and benchmarks are server-only.
- An anonymous draft scenario stays in the browser until sign-up, then is saved to the org.
- Brand: a calm, neutral default palette, with all tokens in one file. Analytics: PostHog captures nothing until the user opts in and does nothing without a key.

### Sequencing, payments and validation
- Order: **P → 1 → 0a → 0b → 2 → 3 → Gate → 5 → 6 → 7 → 8 → 4 → 10 → LAUNCH → 9**. Phase numbers stay stable. *(Superseded on 2026-09-27: P.1 and P.2 were added, see "Phase P.1 decisions".)*
- **Phase P** is a clickable prototype: all key screens with sample data, Arabic RTL, mobile-first, no database, no login, deployed on a Vercel preview, built from real reusable components.
  - Pages live under `/demo`, with fixtures taken from the worked examples.
  - Every demo screen shows a "بيانات تجريبية" banner, and `/demo` is `noindex` until launch.
  - The `/demo` calculator is read-only (one sample scenario, no inputs) until the engine is wired.
- Phase P also sets up ESLint, Vitest and the `lint`, `typecheck` and `test` scripts, so the end-of-phase checks work before Phase 0a adds CI.
- **Phase 1** runs right after P because the engine needs no database or auth. At the end of Phase 1, the `/demo` calculator is wired to the real engine.
- Phase 0 is split into 0a and 0b. The entitlements service moves from old Phase 4 to 0b.
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
- Resend is the SMTP provider for dev from Phase 0b; there is no local test inbox.
- Vercel functions run in `fra1`.

### Auth and migration 001
- Sign-in: 6-digit email code plus Google, with Google off by config until it is set up.
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
- **Units table:** a minimal `units` table is created in Phase 3, with plan unit limits enforced from then on, and Phase 5 extends the same table. There is never a second units table.

### Phase P.1 decisions (2026-09-27)

- **New order:** **P → P.1 → 1 → P.2 → 0a → 0b → 2 → 3 → Gate → 5 → 6 → 7 → 8 → 4 → 10 → LAUNCH → 9.** Recorded in `CLAUDE.md` §8 and `docs/BUILD_PLAN.md` §0 and §5.0.
- **Phase P.2** makes the demo interactive with data kept in the browser only: add a unit, add expenses, and see Home update live through the engine. No account, nothing sent to a server. Its scope is in `docs/BUILD_PLAN.md`.
- **Design direction A2** was chosen from three Home directions and pushed toward Amir's reference screenshots: royal-blue gradient (no teal), frosted-glass tiles on the hero and nav only (solid fallback), soft grey cards without outlines, radii 24–32 px, 8 pt grid, one icon stroke weight, tabular numbers, banner text just "بيانات تجريبية". The owner statement keeps the ledger style from direction B. Recorded in `CLAUDE.md` §7.
- **Home, approved with three tweaks:** (1) the units are a swipeable glass carousel, one card per unit (name, operating model, profit), and the separate "وحداتك" list is gone; (2) section links are brand blue, and the floating nav never hides the last content; (3) the statement pill depends on the view: owner → "تقرير الشهر" (toast until P.2, then each unit's monthly report); co-host → "كشف حساب", opening the Downtown statement.
- **No silent taps:** every tappable element works or explains itself with a toast; no disabled placeholder buttons; Save on add-expense says what is missing. Enforced by `e2e/taps.spec.ts`. Recorded in `CLAUDE.md` §7.
- **Language switch moved from Phase 0a to P.1.** The locale comes from the URL only (no `Accept-Language` detection, no cookie); switching keeps the current screen.
- **Copy register:** simple MSA with Egyptian terms (confirmed by Amir). "شقة المدينتي" → "شقة مدينتي". In English, the utilities category is "Utilities" (the Arabic stays "الكهرباء والمياه").
- **Month-over-month change chip** on Home: a SAMPLE value (+8.4% owner, +5.2% co-host), requested for the design review and not in §4.6. From Phase 1 it comes from real data or is hidden.

### Phase 2 pre-decisions (2026-09-29)

Recorded ahead of the phase starting — a docs-only change, nothing implemented; Phase 1 is still in progress.

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

**Feedback button (added when Amir approved the phase plan):** a "رأيك؟" button on every `/demo` screen opens WhatsApp with the screen path prefilled, via `NEXT_PUBLIC_FEEDBACK_WHATSAPP` (`src/components/demo/feedback-button.tsx`); hidden until that env var is set, same pattern as the pre-order button.

### Security and privacy
- Owner access uses an owner-grant table and signed, expiring links.
- CSV files are parsed in the browser, and the file is never stored.
- Booking confirmation codes are hashed with HMAC using a per-org key.
- The `audit_log` redaction path is designed now.
- Add expense takes at most 4 taps (amount digits not counted), and speed is measured with PostHog timing. This replaces the old 10-second test.

## Open issues

- **Questions for Amir:** see `docs/BUILD_PLAN.md` §6. The most urgent are the pre-order button destination (`NEXT_PUBLIC_PREORDER_URL`, still unset) and the Vercel connection, both blocking Amir's phone review; the domain (Phase 0b) and prices/founding terms (before the pre-order campaign) come next.
- **Technical checks:**
  - Does Serwist work with the current Next.js bundler? (Phase 0a — not yet checked)
  - ~~Does IBM Plex Sans Arabic, as served, expose tabular numerals?~~ **Resolved in Phase P:** yes for Western digits (the default); Arabic-Indic digits are not tabular — see "Phase P build notes" above.
  - ~~Format Western digits in Arabic with `ar-EG-u-nu-latn`.~~ **Resolved in Phase P:** confirmed and implemented in `src/lib/format/`.
- **AirROI coverage to confirm before Phase 2:** whether Madinaty has standalone coverage (it may not — fall back to a wider area or hide the benchmark), and coverage for the other launch-area presets (Rehab, Sheikh Zayed, Sahel, Gouna). Only New Cairo City, Second New Cairo, Nasr City and Cairo are confirmed so far. See "Phase 2 pre-decisions" above and `docs/BUILD_PLAN.md` §6, question 4.
- **Invited users and personal orgs (decide in Phase 5):** users who join through an invitation should not get an auto-created personal org. The Phase 0b sign-up trigger creates one for every new user, so Phase 5 must change that behaviour in a new migration (migrations are forward-only). Options to weigh then: (a) the trigger skips the personal org when a valid invitation exists for the email; (b) the personal org is created lazily, on the first sign-in of a user who belongs to no org. To keep that change small, Phase 0b should put org creation in its own database function.
- **Identical sample KPIs:** every unit, and both Home views, show 60% occupancy, 2,500 ADR and 1,500 RevPAR (see "Fixture design" below). Closed in Phase 1 when the engine produces varied sample data.
- **`DataWarning`** (`src/components/common/data-warning.tsx`) is unused: no fixture has booked nights above available nights. Phase 1 wires it to the engine's `availability_conflict` warning.
- **Phase P prototype audience:** the Phase P build is for Amir's review only. It is not shown to hosts, and no pre-order push happens, until Phase 1 lands: that's when the calculator is wired to the real engine and units show varied (non-identical) sample data. Until then the prototype stays a private Vercel preview.

## How to resume in a fresh session (including Claude Code on the web)

1. Read `CLAUDE.md`, `docs/BUILD_PLAN.md` and this file in full.
2. Send the standard phase prompt (`docs/BUILD_PLAN.md` §5.0) for the phase marked ⏭ above.
3. At the end of the phase, update this file: status, decisions, open issues, next step.
