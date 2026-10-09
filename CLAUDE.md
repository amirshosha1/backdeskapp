# CLAUDE.md — Backdesk · باك ديسك (formerly Safi / صافي)

> Persistent context for Claude Code. Read this before every task.
> The full specification and build phases live in `docs/BUILD_PLAN.md`. Status, decisions and open issues live in `docs/PROGRESS.md`.

## 1. Product in one paragraph

**Backdesk · باك ديسك** (formerly Safi / صافي; working name) is an Arabic-first financial operating system for short-term-rental (STR) hosts, starting in Egypt and expanding to the GCC. It answers one question with precision: **"How much does this unit really make, and why?"** It covers three jobs: (1) feasibility and profit calculation before launch, (2) a step-by-step setup guide from empty apartment to first guest, and (3) a lightweight accounting ERP that records income and expenses, computes platform fees, management commissions, owner payouts and profitability, and produces owner statements. **Pricing principle: data entry is free, outputs are paid.** The free figure is always the full, correct number, never a degraded one. **Free** covers one apartment: unlimited entry of bookings and expenses, the full feasibility calculator, and the current month only: its result (profit or loss), occupancy and average nightly rate, from actual figures. **Pro**, the one paid plan, adds the full month breakdown (including break-even and payback), every past month, the monthly PDF report, owner statements and Airbnb report import; each additional apartment costs half the plan price, up to 5 apartments, and more than 5 is a custom plan by contact. The first month after creating an account is fully open for every apartment the user declared. Payment is monthly, with no auto-renewal (manual at first); without a payment the account continues on Free, its data is never deleted, and extra apartments are frozen with their data. Details: `docs/BUILD_PLAN.md` §2.

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
- PostHog (product analytics, EU cloud), Resend (email; also the SMTP sender for Supabase Auth once email sign-in is added, see §5)
- Package manager: pnpm. Deployment: Vercel, functions pinned to `dub1` (Dublin, next to Supabase in Ireland; decided 2026-10-08). Production URL: `https://backdeskapp.com`.

## 4. Commands (created in Phases P, 0a and 0b)

- `pnpm dev` — local Next.js server (uses the hosted dev Supabase project; there is no local database)
- `pnpm build` — production build
- `pnpm lint` / `pnpm typecheck`
- `pnpm test` — Vitest unit and property tests (no network)
- `pnpm test:coverage` — the same, enforcing ≥ 95% line and branch coverage on `src/lib/finance/`
- `pnpm test:db` — RLS and database tests on a throwaway local Postgres that mirrors Supabase's roles (`scripts/test-db.sh`; needs Linux with the Postgres server binaries: cloud sessions and GitHub Actions). Never against the hosted project; no secrets
- `pnpm test:e2e` — Playwright (a build with no Supabase values: accounts off). Builds with values inlined have their own configs: `pnpm exec playwright test --config=playwright.accounts.config.ts` (accounts on, Supabase intercepted) and `--config=playwright.preorder.config.ts`; run builds one at a time
- CI (`.github/workflows/ci.yml`, check "CI / checks"): lint, typecheck, test and build on every pull request, no secrets. "Database tests / rls" runs `pnpm test:db`. Both must be green before a merge (a manual rule: GitHub Free cannot enforce required checks on a private repo)
- Migrations: no script. The Supabase GitHub integration applies new files in `supabase/migrations/` when they merge to `main`
- `pnpm db:types` — regenerate `src/types/database.ts` from the local test database (Claude's Supabase connector cannot see the Backdesk project)

## 5. Environments — cloud-first (non-negotiable)

- **No Docker, WSL, local Supabase or other local installs.** Amir will not install anything else. The local machine has Node, pnpm and Git only.
- **Database:** one hosted Supabase project, Backdesk (ref `kmmfhaypqgzhoptmljki`, West EU / Ireland, Free plan), created by Amir. **It is production; there is no separate dev or prod project** (decided 2026-10-08). Claude's Supabase connector is linked to a different Supabase account and cannot see it. Never read, change or delete any other Supabase project in Amir's account.
- **Before launch:** the project moves to a paid plan (backups), and the Vercel preview wildcard redirect is removed or previews move to a separate project, both with Amir's approval (`docs/BUILD_PLAN.md` Phase 10).
- **Secrets:** Claude never sees Supabase keys, the database password or the Google client secret: they live only in the Supabase dashboard and Vercel (`docs/SETUP_AUTH.md` lists which values are secret). Only the project URL and the publishable key reach the browser. Never commit secrets; `.env.example` lists variable names only.
- **Migrations** (`supabase/migrations/`) are applied by the Supabase GitHub integration when they merge to `main`. They are forward-only; never edit a migration after it has been pushed. After one lands, Amir runs the read-only `docs/verify_after_migration.sql` in the SQL editor and pastes the result back.
- **Database tests** (`pnpm test:db`) run on a throwaway local Postgres, in GitHub Actions and in cloud sessions, never against the hosted project. They create their own users and data with unique ids.
- **Manual testing** happens on Vercel preview links on Amir's phone. Supabase Auth allows a wildcard redirect URL for Vercel previews until launch.
- **Sign-in and email:** sign-in is **Google only** for now (decided 2026-10-08). Email codes come later, once there is a domain and a custom SMTP sender (Resend), because Supabase's built-in mailer delivers only to the project's team members. There is no local test inbox.
- **Regions:** Supabase in Ireland (`eu-west-1`); Vercel functions in Dublin (`dub1`, decided 2026-10-08, `docs/BUILD_PLAN.md` §6 question 19).
- **Data API:** exposed schemas are `public` and `graphql_public` only (`private` never); "Automatically expose new tables" is off. Every migration grants exactly what it needs, explicitly.
- **Public contact:** `support@backdeskapp.com` (privacy page, custom plans), defined once in `src/lib/contact.ts`.
- **Never create cloud resources** (Supabase projects, Vercel projects, paid services) or anything that costs money without Amir's explicit approval.
- A fresh session, including Claude Code on the web, continues from the repo alone: this file, `docs/BUILD_PLAN.md` and `docs/PROGRESS.md` are the memory.

## 6. Architecture rules (non-negotiable)

1. **One source of truth for numbers.** Every financial figure comes from pure functions in `src/lib/finance/`. No financial formulas in components or SQL; SQL may only aggregate (SUM, COUNT). Anything that needs per-night logic (per-month stay allocations) is computed by the engine and stored, so SQL only aggregates it. Phase P displays fixture numbers only and contains no formulas; from the end of Phase 1 the `/demo` calculator runs on the real engine.
2. **Money is never a JS float.** Use `decimal.js`; Postgres `numeric(14,2)` for amounts, `numeric(7,4)` for percentage rates, `numeric(18,8)` for FX rates. Rounding is **half-up**, applied only at presentation, to stored unit-currency amounts and to statement totals. **Every split** (proration across months, platform-fee allocation, expense-bearer splits, statement lines) gives the leftover cent(s) to the last line so the parts sum exactly to the total.
3. **Currency is explicit.** Every transaction stores its original amount, original currency, an explicit FX rate and the amount in the unit's currency. The engine calculates in the unit's currency only and rejects anything else with a typed error. No implicit or automatic FX. Units in different currencies show separate totals. Default currency `EGP`.
4. **Multi-tenant by `org_id`.** RLS is enabled on every table with tested policies. The service-role key is used only in server code that genuinely needs it.
5. **Entitlements are enforced on the server** (`src/lib/entitlements/`). Blurred teasers render placeholder data only; paid-plan data must never reach a Free client. The Free calculator runs in the browser; the 12-month projection and benchmarks run in server-only modules and never ship to a Free client. The entitlements service, the trial clock and all gating are built in Phase 7, together with the month report; until then every account works with everything open (decided 2026-10-08, `docs/BUILD_PLAN.md` §2).
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
- The headline profit is after depreciation; before-depreciation figures appear only as labelled rows (decided 2026-10-06, `docs/BUILD_PLAN.md` §4.3).
- For owner-operated and rental-arbitrage units, the UI calls the unit's agreement record **"unit settings"**, never "agreement".
- `/demo` is `noindex` until launch. A visitor's data stays in the browser and nothing about a visitor is sent anywhere; a signed-in user's apartments live in their account (amended 2026-10-08, Batch 3). The signed-in app lives under `/demo` for now (moving it out, e.g. to `/app`, is an open issue in `docs/PROGRESS.md`).
- **Real data is never labelled as sample; one top line on every screen** (hotfix, 2026-10-09). A visitor sees "محفوظ على هذا الجهاز · سجّل الدخول لتحفظه في حسابك", tappable to Google sign-in (only "محفوظ على هذا الجهاز" in a build without accounts); a signed-in user sees no line; until it is known whether someone is signed in, nothing. No screen says "بيانات تجريبية". **Every screen that shows sample data carries its own "مثال · أرقام توضيحية" chip at the top** (sample units on Units, the sample statement — titled "مثال: كشف حساب مالك", without PDF or owner-link actions — the guide, the expenses screens, and the calculator's example); no screen showing the user's own data does (`e2e/example-label.spec.ts`). The samples on Units sit under "أمثلة توضيحية (ليست بياناتك)". The user's own apartment cards carry no تجريبي/SAMPLE badge; the per-field تجريبي tags inside the calculator stay, and so do the SAMPLE tags on prices. Home shows only the user's own apartments (total monthly net in whole pounds, then each apartment's net and status) or, with none, one call to action to the first-run flow; Units hides the "أمثلة تجريبية" samples once the user has an apartment.
- **In-app browsers:** Google refuses sign-in inside Facebook's, Messenger's and Instagram's browsers, so there every sign-in button opens an "open in your browser" sheet (`src/lib/browser/in-app.ts`); everything else keeps working there without an account.
- **Add expense in at most 4 taps** from the home screen, not counting the digits of the amount. *Paused since the 2026-10-09 hotfix: nothing links to the add-expense, add-income or month-report screens until they save for real; the code stays.* Real-user speed is measured by a PostHog timing event (target: median ≤ 10 s).
- Performance budget: LCP under 2.5 s on a mid-range Android device over 4G.
- Design tone: calm, trustworthy, fintech-grade. Design tokens (colors, radii, spacing, type) live in one file (`src/styles/tokens.css`). The approved direction (Phase P.1, "A2"): a royal-blue hero gradient (deep navy at the top to bright blue lower down, no teal); frosted-glass tiles **only** on the hero and the floating bottom nav, always with a solid fallback where `backdrop-filter` is unsupported; soft solid grey cards without outline borders on light surfaces, with shadows only where elevation matters; radii 24–32 px on an 8 pt grid; one icon stroke weight (1.75); tabular numbers. Owner statements keep a paper-ledger style. Section links ("عرض الكل", "التفاصيل") are brand blue.
- **No silent taps.** Every tappable element either works or explains itself (a toast such as "متاحة في النسخة الكاملة"); no disabled buttons as placeholders, and a form's primary button says what is missing instead of doing nothing. The e2e tap crawler (`e2e/taps.spec.ts`) enforces this on every `/demo` screen.
- The floating bottom nav must never cover the last content of a screen scrolled to the bottom (`BOTTOM_NAV_CLEARANCE`).
- The locale comes from the URL only (`/demo` is Arabic, `/en/demo` English): no `Accept-Language` detection and no locale cookie, so a shared link opens in the language it was shared in. The Arabic/English switch keeps the current screen.
- Arabic copy register: simple Modern Standard Arabic with the terms Egyptian hosts actually use (e.g. "الكمبوند", "إعادة تأجير", "الكهرباء والمياه").
- The first element on the home dashboard answers "كم ربحت فعلاً هذا الشهر؟" (today: the sum of the user's apartments' calculator nets, labelled "صافي شققك في الشهر") according to the operating model: owner view = net profit; co-host view = commission minus manager-borne costs, summed across managed units (see **Org profit**).

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
- **Plans**: **Free** (one apartment) and **Pro**, the only paid plan: 249 EGP a month for one apartment (tentative, labelled SAMPLE until confirmed); each additional apartment costs half the plan price, rounded up to a whole pound, up to 5 apartments; more than 5 is a **custom plan** agreed by contact. There are no annual prices. "Pro features" means the paid plan's features.
- **Trial**: the first month after an account is created; everything is open for every apartment the user declared.
- **Frozen apartment**: an apartment beyond the plan's limit once the trial or a paid month ends without a new payment. Its data is kept, never deleted; it comes back when the user pays for it.
- **Manager profit** (per managed unit): commission − manager-borne costs.
- **Org profit** (home hero number): Σ net profit of owner-operated and rental-arbitrage units + Σ manager profit of managed units − portfolio-level overhead (shown as its own line). One total per currency.
- **Portfolio-level cost**: a transaction with no unit. It is manager overhead and is never charged to owners unless explicitly allocated to units.
- **Statement basis**: `cash` (default: by payout and payment date) or `accrual` (by night), set per agreement.
- **Owner payout**: real money sent to a unit owner; reduces the balance due.
- **Owner statement**: monthly report to a unit owner showing revenue, fees, owner-borne expenses, commission, owner payouts and balance due (carried forward from the previous statement; an owner's first statement may take a manual opening balance).
- **CAPEX**: setup investment (furniture, appliances, finishing), depreciated monthly.
