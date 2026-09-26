# PROGRESS — Safi (صافي)

> Read together with `CLAUDE.md` (rules) and `docs/BUILD_PLAN.md` (spec and phases). Updated at the end of every phase.
> Last updated: 2026-09-26 (Phase P built).

## Current status

- **Phase P (clickable prototype) is built** on branch `claude/phase-p-clickable-prototype-wxl8za`: scaffold, design tokens, i18n, all 9 screens, fixtures, and the lint/typecheck/unit/e2e test suites all pass. See "Phase P build notes" below for what a fresh session needs to know before touching this code.
- **Next step:** Phase **1** (finance engine). Send the standard phase prompt from `docs/BUILD_PLAN.md` §5.0 with `{N} = 1`.
- **Before Amir can review on a phone:** Amir connects the GitHub repo to Vercel (still not done) and, once the preview is live, sets `NEXT_PUBLIC_PREORDER_URL` and optionally `NEXT_PUBLIC_FEEDBACK_WHATSAPP` as Vercel env vars. Per the Phase P decision below, the prototype is for Amir's review only until Phase 1 lands — no pre-order push yet.

## Phase checklist (in execution order)

| Phase | Status |
|---|---|
| Kickoff: review, decisions, docs | ✅ Done (2026-09-26) |
| P — Clickable prototype | ✅ Built (2026-09-26); awaiting Amir's review on a Vercel preview |
| 1 — Finance engine (+ wire the `/demo` calculator to it) | ⏭ Next |
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
- Not set up yet: Vercel ↔ repo connection, Resend sending domain, PostHog, Google OAuth client, Paymob, Anthropic key, prod Supabase project.
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
- Order: **P → 1 → 0a → 0b → 2 → 3 → Gate → 5 → 6 → 7 → 8 → 4 → 10 → LAUNCH → 9**. Phase numbers stay stable.
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

**shadcn/ui:** this sandbox's network policy blocks `ui.shadcn.com`, so the `shadcn` CLI can't fetch components. `src/components/ui/` (button, card, badge, progress, tabs) is hand-written in shadcn's own style (cva + Radix primitives) instead. If a future session has `ui.shadcn.com` allowed, the CLI can still be used for *new* components — `components.json` is already configured for it.

**Progress bar RTL fix:** shadcn's stock `<Progress>` fills via `transform: translateX(...)`, which is a *physical*-axis transform and doesn't flip with `dir`. `src/components/ui/progress.tsx` fills via the indicator's own `width` instead (no transform) — a block box's width naturally grows from its own inline-start edge, which is direction-aware without any manual flipping.

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
- **Phase P prototype audience:** the Phase P build is for Amir's review only. It is not shown to hosts, and no pre-order push happens, until Phase 1 lands: that's when the calculator is wired to the real engine and units show varied (non-identical) sample data. Until then the prototype stays a private Vercel preview.

## How to resume in a fresh session (including Claude Code on the web)

1. Read `CLAUDE.md`, `docs/BUILD_PLAN.md` and this file in full.
2. Send the standard phase prompt (`docs/BUILD_PLAN.md` §5.0) for the phase marked ⏭ above.
3. At the end of the phase, update this file: status, decisions, open issues, next step.
