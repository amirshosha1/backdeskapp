# CLAUDE.md — {{APP_NAME}}

> Persistent context for Claude Code. Read this before every task.
> The full specification and build phases live in `docs/BUILD_PLAN.md`. Progress lives in `docs/PROGRESS.md`.

## 1. Product in one paragraph

{{APP_NAME}} is an Arabic-first financial operating system for short-term-rental (STR) hosts, starting in Egypt and expanding to the GCC. It answers one question with precision: **"How much does this unit really make, and why?"** It covers three jobs: (1) feasibility and profit calculation before launch, (2) a step-by-step setup guide from empty apartment to first guest, and (3) in the paid Pro plan, a lightweight accounting ERP that records income and expenses, computes platform fees, management commissions, owner payouts and profitability, and produces owner statements.

## 2. Hard non-goals — never build these

- No booking engine, calendar, availability, iCal or channel-manager sync, guest messaging, or price pushing to OTAs.
- No storage of guest personal data. Imports strip guest names, phones and emails at parse time.
- No tax, legal or investment advice. Tax rates are user-configured settings, never hardcoded claims.
- No invented market data. Any default, preset or benchmark without a real source is labelled `SAMPLE` in data and UI.

## 3. Stack

- Next.js (latest stable, App Router) + TypeScript `strict`
- Tailwind CSS + shadcn/ui, lucide-react icons, Recharts
- Supabase: Postgres, Auth, Storage, Row Level Security, pg_cron
- next-intl (`ar` default, `en` second); PWA via Serwist
- Zod (validation), react-hook-form, decimal.js (money)
- Vitest + fast-check (unit and property tests), Playwright (e2e)
- Anthropic API, server-side only, for smart entry and receipt reading
- Payments behind a `PaymentProvider` interface; Paymob implemented first
- PostHog (product analytics, EU cloud), Resend (email)
- Package manager: pnpm. Deployment: Vercel.

## 4. Commands (create these scripts in Phase 0 if missing)

- `pnpm dev` — local server
- `pnpm build` — production build
- `pnpm lint` / `pnpm typecheck`
- `pnpm test` — Vitest; `pnpm test:e2e` — Playwright
- `pnpm db:migrate` — apply Supabase migrations locally
- `pnpm db:types` — regenerate `src/types/database.ts`

## 5. Architecture rules (non-negotiable)

1. **One source of truth for numbers.** Every financial figure comes from pure functions in `src/lib/finance/`. No financial formulas in components or SQL; SQL may only aggregate (SUM, COUNT).
2. **Money is never a JS float.** Use `decimal.js`; Postgres `numeric(14,2)` for amounts and `numeric(7,4)` for rates. Round only at presentation and statement totals; statement lines must sum exactly to the total (allocate any rounding remainder to the last line).
3. **Currency is explicit.** Every amount carries an ISO-4217 code. Default `EGP`. No implicit FX; mixed-currency portfolios show separate totals.
4. **Multi-tenant by `org_id`.** RLS is enabled on every table with tested policies. The service-role key is used only in server code that genuinely needs it.
5. **Entitlements are enforced on the server** (`src/lib/entitlements/`). Blurred Pro teasers render placeholder data only; Pro data must never reach a Free client.
6. **Validate every input with Zod** at server boundaries (server actions, route handlers, webhooks).
7. **AI assists, it does not book.** AI calls run server-side, model IDs come from env (`AI_MODEL_FAST`, `AI_MODEL_VISION`), outputs are parsed against Zod schemas, and every AI-created transaction is saved as `unconfirmed` until the user confirms it.
8. **Closed periods are immutable.** Finalized owner statements lock their month; corrections are posted as adjustments in an open period. Every write to financial tables is recorded in `audit_log`.
9. **Timezone** is `Africa/Cairo` by default and stored per org.

## 6. i18n, RTL and UX

- Arabic is the default and the primary design target; English must be complete, not an afterthought.
- No hardcoded UI strings: everything lives in `messages/ar.json` and `messages/en.json`.
- Use CSS logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`); never `left`/`right` for layout. Verify every screen in RTL.
- Digits: Western digits by default for financial clarity; Arabic-Indic digits as a user setting.
- Font: IBM Plex Sans Arabic, with tabular numerals on every money column.
- Mobile-first PWA (360 px baseline), thumb-reachable primary actions, bottom navigation, numeric keypads (`inputMode="decimal"`).
- Performance budget: LCP under 2.5 s on a mid-range Android device over 4G.
- Design tone: calm, trustworthy, fintech-grade. The first element on the home dashboard answers "كم ربحت فعلاً هذا الشهر؟".

## 7. How to work in this repo

- Work **one phase at a time** from `docs/BUILD_PLAN.md`. Start by presenting a plan (files, migrations, RLS policies, tests) and wait for approval.
- If a requirement is ambiguous or conflicts with this file, stop and ask, offering 2–3 concrete options with a recommended default.
- Every change to finance logic, entitlements or RLS ships with tests.
- Small conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- End of every phase: run `pnpm lint && pnpm typecheck && pnpm test`, update `docs/PROGRESS.md` (done / decisions / open issues), then stop.
- Never start Phase 5 without the Validation Gate confirmation described in `docs/BUILD_PLAN.md`.

## 8. Glossary

- **ADR**: accommodation revenue ÷ booked nights.
- **Occupancy**: booked nights ÷ available nights.
- **RevPAR**: accommodation revenue ÷ available nights.
- **Payout**: what the platform actually transfers after its fees.
- **NOI**: payout − operating expenses (before commission, depreciation and tax).
- **Operating model**: `owner_operated` | `rental_arbitrage` | `managed_for_owner`.
- **Owner statement**: monthly report to a unit owner showing revenue, fees, owner-borne expenses, commission and balance due.
- **CAPEX**: setup investment (furniture, appliances, finishing), depreciated monthly.
