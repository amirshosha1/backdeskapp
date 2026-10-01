# CLAUDE.md — Safi (صافي)

> Persistent context for Claude Code. Read this before every task.
> The full specification and build phases live in `docs/BUILD_PLAN.md`. Status, decisions and open issues live in `docs/PROGRESS.md`.

## 1. Product in one paragraph

**Safi (صافي)** (working name) is an Arabic-first financial operating system for short-term-rental (STR) hosts, starting in Egypt and expanding to the GCC. It answers one question with precision: **"How much does this unit really make, and why?"** It covers three jobs: (1) feasibility and profit calculation before launch, (2) a step-by-step setup guide from empty apartment to first guest, and (3) a lightweight accounting ERP that records income and expenses, computes platform fees, management commissions, owner payouts and profitability, and produces owner statements. Free includes a manual ledger for one unit; the paid plans (Solo, Pro, Business) unlock more units, payout import, owner statements, AI entry, alerts and exports.

## 2. Hard non-goals — never build these

- No booking engine, calendar, availability, iCal or channel-manager sync, guest messaging, or price pushing to OTAs. Blocked nights are a manual number per unit per month, not a calendar.
- No storage of guest personal data. Payout files are parsed in the browser; guest names, phones and emails never reach the server, and the file itself is never stored.
- No tax, legal or investment advice. Tax rates are user-configured settings, never hardcoded claims.
- No invented market data. Any default, preset, price or benchmark without a real source is labelled `SAMPLE` in data and UI. Paying users never see SAMPLE benchmarks: if there are no sourced benchmark figures, the benchmark feature is hidden.

## 3. Stack

- Next.js (latest stable, App Router) + TypeScript `strict`
- Tailwind CSS + shadcn/ui, lucide-react icons, Recharts
- Supabase, hosted only (see §5): Postgres, Auth, Storage, Row Level Security, pg_cron
- next-intl (`ar` default, `en` second); PWA via Serwist
- Zod (validation), react-hook-form, decimal.js (money)
- Vitest + fast-check (unit and property tests), Playwright (e2e)
- Anthropic API, server-side only, for smart entry and receipt reading
- Payments behind a `PaymentProvider` interface; Paymob implemented first, **only in the pre-launch payments phase (Phase 4)**. Until then, pre-orders are manual InstaPay transfers and access is granted manually.
- PostHog (product analytics, EU cloud), Resend (email, and SMTP for Supabase Auth from Phase 0b)
- Package manager: pnpm. Deployment: Vercel, functions pinned to `fra1`.

## 4. Commands (created in Phases P, 0a and 0b)

- `pnpm dev` — local Next.js server (uses the hosted dev Supabase project; there is no local database)
- `pnpm build` — production build
- `pnpm lint` / `pnpm typecheck`
- `pnpm test` — Vitest unit and property tests (no network)
- `pnpm test:coverage` — the same, enforcing ≥ 95% line and branch coverage on `src/lib/finance/`
- `pnpm test:db` — RLS and database tests against the dev project (normally run by GitHub Actions)
- `pnpm test:e2e` — Playwright
- `pnpm db:migrate` — apply pending migrations to the dev project (normally run by GitHub Actions)
- `pnpm db:types` — regenerate `src/types/database.ts` from the dev project

## 5. Environments — cloud-first (non-negotiable)

- **No Docker, WSL, local Supabase or other local installs.** Amir will not install anything else. The local machine has Node, pnpm and Git only.
- **Dev database:** one hosted Supabase project in Frankfurt (free plan), created by Claude through the Supabase connector in Phase 0b, **only after Amir approves**. Never read, change or delete any other Supabase project in Amir's account.
- **Prod database:** a separate Supabase project on a paid plan, created only before launch, with Amir's approval.
- **Secrets:** Claude only ever sees dev keys. Prod keys live only in Vercel and GitHub secrets. Never commit secrets; `.env.example` lists variable names only. Prefer credentials scoped to the dev database over account-wide tokens.
- **Migrations and database tests** run in GitHub Actions against dev. Migrations are forward-only; never edit a migration after it has been pushed. Tests create their own users and data with unique ids and delete them afterwards.
- **Manual testing** happens on Vercel preview links on Amir's phone. Supabase dev Auth allows wildcard redirect URLs for Vercel previews.
- **Email:** Resend is the SMTP provider for dev Auth from Phase 0b; there is no local test inbox.
- **Regions:** Supabase in Frankfurt; Vercel functions in `fra1`.
- **Never create cloud resources** (Supabase projects, Vercel projects, paid services) or anything that costs money without Amir's explicit approval.
- A fresh session, including Claude Code on the web, continues from the repo alone: this file, `docs/BUILD_PLAN.md` and `docs/PROGRESS.md` are the memory.

## 6. Architecture rules (non-negotiable)

1. **One source of truth for numbers.** Every financial figure comes from pure functions in `src/lib/finance/`. No financial formulas in components or SQL; SQL may only aggregate (SUM, COUNT). Anything that needs per-night logic (per-month stay allocations) is computed by the engine and stored, so SQL only aggregates it. Phase P displays fixture numbers only and contains no formulas; from the end of Phase 1 the `/demo` calculator runs on the real engine.
2. **Money is never a JS float.** Use `decimal.js`; Postgres `numeric(14,2)` for amounts, `numeric(7,4)` for percentage rates, `numeric(18,8)` for FX rates. Rounding is **half-up**, applied only at presentation, to stored unit-currency amounts and to statement totals. **Every split** (proration across months, platform-fee allocation, expense-bearer splits, statement lines) gives the leftover cent(s) to the last line so the parts sum exactly to the total.
3. **Currency is explicit.** Every transaction stores its original amount, original currency, an explicit FX rate and the amount in the unit's currency. The engine calculates in the unit's currency only and rejects anything else with a typed error. No implicit or automatic FX. Units in different currencies show separate totals. Default currency `EGP`.
4. **Multi-tenant by `org_id`.** RLS is enabled on every table with tested policies. The service-role key is used only in server code that genuinely needs it.
5. **Entitlements are enforced on the server** (`src/lib/entitlements/`). Blurred teasers render placeholder data only; paid-plan data must never reach a Free client. The Free calculator runs in the browser; the 12-month projection and benchmarks run in server-only modules and never ship to a Free client.
6. **Validate every input with Zod** at server boundaries (server actions, route handlers, webhooks).
7. **AI assists, it does not book.** AI calls run server-side, model IDs come from env (`AI_MODEL_FAST`, `AI_MODEL_VISION`), outputs are parsed against Zod schemas, and every AI-created transaction is saved as `unconfirmed` until the user confirms it.
8. **Closed periods are immutable.** Finalizing an owner statement locks that unit's month. Anything dated inside a locked month (a late adjustment, a correction, an imported row) is posted to the next open period and keeps its original date for reference. Commission transactions are created only as a snapshot when a statement is finalized. Every write to financial tables is recorded in `audit_log`, which is append-only; the only permitted change is personal-data redaction on deletion (see `docs/BUILD_PLAN.md` §3).
9. **Guest privacy by construction.** Payout files are parsed in the browser; only sanitized rows are uploaded and the file is never stored. Booking confirmation codes are hashed on the server with HMAC-SHA256 using a per-org key derived from a server secret; raw codes are never persisted.
10. **Owners are not org members.** Unit owners reach their statements only through the `owner_grants` table and signed, expiring statement links, never through `org_members`.
11. **Timezone** is `Africa/Cairo` by default and stored per org.

## 7. i18n, RTL and UX

- Arabic is the default and the primary design target; English must be complete, not an afterthought.
- No hardcoded UI strings: everything lives in `messages/ar.json` and `messages/en.json`.
- Use CSS logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`); never `left`/`right` for layout. Verify every screen in RTL.
- Digits: Western digits by default for financial clarity (format Arabic with `ar-EG-u-nu-latn`); Arabic-Indic digits as a user setting.
- Font: IBM Plex Sans Arabic, with tabular numerals on every money column.
- Mobile-first PWA (360 px baseline), thumb-reachable primary actions, bottom navigation, numeric keypads (`inputMode="decimal"`).
- Occupancy is never clamped silently: if booked nights exceed available nights, show a data warning and cap the displayed occupancy at 100%.
- A break-even shown next to a profit figure covers the same costs as that profit; if it doesn't, its label says which costs it covers (`docs/BUILD_PLAN.md` §4.3). No static text sits next to live numbers.
- For owner-operated and rental-arbitrage units, the UI calls the unit's agreement record **"unit settings"**, never "agreement".
- Every `/demo` screen shows a clear "بيانات تجريبية" banner, and `/demo` is `noindex` until launch. Until Phase P.2, `/demo` sends nothing anywhere; from P.2 its data lives in the browser only (no account, nothing sent to a server).
- **Add expense in at most 4 taps** from the home screen, not counting the digits of the amount. Real-user speed is measured by a PostHog timing event (target: median ≤ 10 s).
- Performance budget: LCP under 2.5 s on a mid-range Android device over 4G.
- Design tone: calm, trustworthy, fintech-grade. Design tokens (colors, radii, spacing, type) live in one file (`src/styles/tokens.css`). The approved direction (Phase P.1, "A2"): a royal-blue hero gradient (deep navy at the top to bright blue lower down, no teal); frosted-glass tiles **only** on the hero and the floating bottom nav, always with a solid fallback where `backdrop-filter` is unsupported; soft solid grey cards without outline borders on light surfaces, with shadows only where elevation matters; radii 24–32 px on an 8 pt grid; one icon stroke weight (1.75); tabular numbers. Owner statements keep a paper-ledger style. Section links ("عرض الكل", "التفاصيل") are brand blue.
- **No silent taps.** Every tappable element either works or explains itself (a toast such as "متاحة في النسخة الكاملة"); no disabled buttons as placeholders, and a form's primary button says what is missing instead of doing nothing. The e2e tap crawler (`e2e/taps.spec.ts`) enforces this on every `/demo` screen.
- The floating bottom nav must never cover the last content of a screen scrolled to the bottom (`BOTTOM_NAV_CLEARANCE`).
- The locale comes from the URL only (`/demo` is Arabic, `/en/demo` English): no `Accept-Language` detection and no locale cookie, so a shared link opens in the language it was shared in. The Arabic/English switch keeps the current screen.
- Arabic copy register: simple Modern Standard Arabic with the terms Egyptian hosts actually use (e.g. "الكمبوند", "إعادة تأجير", "الكهرباء والمياه").
- The first element on the home dashboard answers "كم ربحت فعلاً هذا الشهر؟" according to the operating model: owner view = net profit; co-host view = commission minus manager-borne costs, summed across managed units (see **Org profit**).

## 8. How to work in this repo

- Phase order: **P → P.1 → 1 → P.2 → 0a → 0b → 2 → 3 → ⛔ Validation Gate → 5 → 6 → 7 → 8 → 4 (payments and legal) → 10 → 🚀 LAUNCH → 9 (post-launch growth)**.
- Work **one phase at a time** from `docs/BUILD_PLAN.md`. Start by presenting a plan (files, migrations, RLS policies, tests) and wait for approval.
- If a requirement is ambiguous or conflicts with this file, stop and ask, offering 2–3 concrete options with a recommended default.
- Every change to finance logic, entitlements or RLS ships with tests.
- Small conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- End of every phase: run `pnpm lint && pnpm typecheck && pnpm test` (plus `pnpm test:db` from Phase 0b), update `docs/PROGRESS.md` (done / decisions / open issues / next step), then stop.
- Never start Phase 5 without the Validation Gate confirmation described in `docs/BUILD_PLAN.md`.

## 9. Glossary

- **ADR**: accommodation revenue ÷ booked nights.
- **Available nights**: days in the month − blocked nights (manual, per unit per month), counted from the go-live date.
- **Occupancy**: booked nights ÷ available nights.
- **RevPAR**: accommodation revenue ÷ available nights.
- **Gross revenue**: accommodation revenue + cleaning fees + other income. Excludes taxes collected by the platform (pass-through).
- **Payout / net payout**: what the platform actually transfers after its fees (gross revenue − platform fees).
- **NOI**: payout − operating expenses (before commission, depreciation and tax).
- **Unit currency**: the currency a unit's books are kept in; every transaction stores its amount in this currency.
- **Operating model**: `owner_operated` | `rental_arbitrage` | `managed_for_owner`.
- **Paid plans**: Solo (up to 3 units), Pro (up to 10), Business (up to 30). Same features; they differ only by unit limit. "Pro features" in these docs means features of any paid plan.
- **Manager profit** (per managed unit): commission − manager-borne costs.
- **Org profit** (home hero number): Σ net profit of owner-operated and rental-arbitrage units + Σ manager profit of managed units − portfolio-level overhead (shown as its own line). One total per currency.
- **Portfolio-level cost**: a transaction with no unit. It is manager overhead and is never charged to owners unless explicitly allocated to units.
- **Statement basis**: `cash` (default: by payout and payment date) or `accrual` (by night), set per agreement.
- **Owner payout**: real money sent to a unit owner; reduces the balance due.
- **Owner statement**: monthly report to a unit owner showing revenue, fees, owner-borne expenses, commission, owner payouts and balance due (carried forward from the previous statement; an owner's first statement may take a manual opening balance).
- **CAPEX**: setup investment (furniture, appliances, finishing), depreciated monthly.
