# PROGRESS — Safi (صافي)

> Read together with `CLAUDE.md` (rules) and `docs/BUILD_PLAN.md` (spec and phases). Updated at the end of every phase.
> Last updated: 2026-09-27 (Phase P.1 built).

## Current status

- **Phase P (clickable prototype)** was merged into `main` (amirshosha1/str-money-finder#1). Amir reviewed it on his phone: it felt broken (silent taps) and the design was weak, which led to Phase P.1.
- **Phase P.1 (prototype fixes and redesign) is built** on branch `claude/phase-p-clickable-prototype-wxl8za` and opened as a pull request: tap audit (no silent taps, enforced by an e2e crawler), design direction A2 on every screen, an expense-details screen, the Arabic/English switch, the Arabic copy pass, and bidi/404/safe-area fixes. Lint, typecheck, 88 unit/component tests and 55 e2e tests pass. See "Phase P.1 decisions" and "Phase P.1 build notes" below.
- **Next step:** Amir reviews the P.1 preview on his phone and merges; then Phase **1** (finance engine + live `/demo` calculator). Send the standard phase prompt from `docs/BUILD_PLAN.md` §5.0 with `{N} = 1`.
- **Still unset on Vercel:** `NEXT_PUBLIC_PREORDER_URL` (pre-order buttons show "الحجز المسبق يُفتح قريبًا" until then) and optionally `NEXT_PUBLIC_FEEDBACK_WHATSAPP` (the "رأيك؟" link stays hidden until then). The prototype is for Amir's review only until Phase 1 lands — no pre-order push yet.

## Phase checklist (in execution order)

| Phase | Status |
|---|---|
| Kickoff: review, decisions, docs | ✅ Done (2026-09-26) |
| P — Clickable prototype | ✅ Merged (2026-09-26) |
| P.1 — Prototype fixes and redesign | ✅ Built (2026-09-27); PR awaiting Amir's review |
| 1 — Finance engine (+ wire the `/demo` calculator to it) | ⏭ Next |
| P.2 — Interactive demo, data in the browser only | Not started |
| 0a — App shell, i18n, PWA, CI | Not started |
| 0b — Supabase dev project, auth, migration 001, DB tests in CI | Not started. Needs Amir's approval before creating the dev project |
| 2 — Free calculator | Not started |
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
- **Invited users and personal orgs (decide in Phase 5):** users who join through an invitation should not get an auto-created personal org. The Phase 0b sign-up trigger creates one for every new user, so Phase 5 must change that behaviour in a new migration (migrations are forward-only). Options to weigh then: (a) the trigger skips the personal org when a valid invitation exists for the email; (b) the personal org is created lazily, on the first sign-in of a user who belongs to no org. To keep that change small, Phase 0b should put org creation in its own database function.
- **Identical sample KPIs:** every unit, and both Home views, show 60% occupancy, 2,500 ADR and 1,500 RevPAR (see "Fixture design" below). Closed in Phase 1 when the engine produces varied sample data.
- **`DataWarning`** (`src/components/common/data-warning.tsx`) is unused: no fixture has booked nights above available nights. Phase 1 wires it to the engine's `availability_conflict` warning.
- **Phase P prototype audience:** the Phase P build is for Amir's review only. It is not shown to hosts, and no pre-order push happens, until Phase 1 lands: that's when the calculator is wired to the real engine and units show varied (non-identical) sample data. Until then the prototype stays a private Vercel preview.

## How to resume in a fresh session (including Claude Code on the web)

1. Read `CLAUDE.md`, `docs/BUILD_PLAN.md` and this file in full.
2. Send the standard phase prompt (`docs/BUILD_PLAN.md` §5.0) for the phase marked ⏭ above.
3. At the end of the phase, update this file: status, decisions, open issues, next step.
