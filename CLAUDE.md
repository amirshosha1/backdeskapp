# CLAUDE.md — Backdesk · باك ديسك

> Entry point and operating guide; kept short on purpose. Section numbers match the old file because code comments and docs cite them (`CLAUDE.md §7`, `§6.3`). Sections 1, 3, 5, 7, 9 are condensed here; their full text is the same-numbered section of `.claude/context/RULES_REFERENCE.md`.

## 0. Session start (token-efficient)

1. Read this file, then `.claude/context/SESSION_HANDOFF.md`. Stop there unless the task needs more; `/project-resume` prints a short brief.
2. Load other context on demand only (map in §9).
3. Source code beats documentation. If a doc disagrees with the repo, verify, then fix the doc.
4. Do not re-audit the project. Re-inspect only what changed: `git diff <handoff commit>..HEAD --stat`.

## 1. Product

Arabic-first financial OS for short-term-rental hosts (Egypt, then GCC): "How much does this unit really make, and why?" **Data entry is free, outputs are paid.** Free = one apartment with the full, correct calculator; Pro = reports, statements, import. Production `https://backdeskapp.com`; repo `amirshosha1/backdeskapp`. Spec and phases: `docs/BUILD_PLAN.md`.

## 2. Hard non-goals — never build these

- No booking engine, calendar, availability, iCal or channel-manager sync, guest messaging, or price pushing to OTAs. Blocked nights are a manual number per unit per month, not a calendar.
- No storage of guest personal data. Payout files are parsed in the browser; guest names, phones and emails never reach the server, and the file itself is never stored.
- No tax, legal or investment advice. Tax rates are user-configured settings, never hardcoded claims.
- No invented market data. Any default, preset, price or benchmark without a real source is labelled `SAMPLE` in data and UI. Paying users never see SAMPLE benchmarks: if there are no sourced benchmark figures, the benchmark feature is hidden.

## 3. Stack

Next.js (App Router, latest stable) + TypeScript strict · Tailwind + shadcn/ui · Supabase hosted only (Ireland) · next-intl (`ar` default) · decimal.js · Zod · Vitest + fast-check + Playwright · pnpm · Vercel `dub1`. Planned, not yet installed: Serwist, Recharts, react-hook-form, Anthropic SDK, Resend, Paymob. Full list: `RULES_REFERENCE.md` §3.

## 4. Commands (created in Phases P, 0a and 0b)

- `pnpm dev` — local Next.js server. There is no local database and no dev project: with Supabase values in the environment it talks to the production project, with none accounts are off (visitor-only)
- `pnpm build` — production build
- `pnpm lint` / `pnpm typecheck`
- `pnpm test` — Vitest unit and property tests (no network)
- `pnpm test:coverage` — the same, enforcing ≥ 95% line and branch coverage on `src/lib/finance/`
- `pnpm test:db` — RLS and database tests on a throwaway local Postgres that mirrors Supabase's roles (`scripts/test-db.sh`; needs Linux with the Postgres server binaries: cloud sessions and GitHub Actions). Never against the hosted project; no secrets
- `pnpm test:e2e` — Playwright (a build with no Supabase values: accounts off). Builds with values inlined have their own configs: `pnpm exec playwright test --config=playwright.accounts.config.ts` (accounts on, Supabase intercepted), `--config=playwright.preorder.config.ts` and `--config=playwright.analytics.config.ts` (anonymous counting on, `/api/e` intercepted); run builds one at a time
- `pnpm check:bundle` — after a build: fails if app-only code (the guest and account stores, the finance engine) reaches a public page (`/`, `/privacy`) or `/` exceeds its JS cap (150 KB gzip, under a 160 KB ceiling), and prints their JS in gzip KB (`scripts/check-public-bundle.mjs`)
- `pnpm og:render` — redraws the landing's share images (`public/og/landing-{ar,en}.png`) in Chromium and records them in `src/lib/landing/share-images.json`; a unit test fails until it is re-run after any change to what they show
- CI (`.github/workflows/ci.yml`, check "CI / checks"): lint, typecheck, test, build and `check:bundle` on every pull request, no secrets. "Database tests / rls" runs `pnpm test:db`. Both must be green before a merge (a manual rule: GitHub Free cannot enforce required checks on a private repo)
- Migrations: no script. The Supabase GitHub integration applies new files in `supabase/migrations/` when they merge to `main`
- `pnpm db:types` — regenerate `src/types/database.ts` from the local test database (Claude's Supabase connector cannot see the Backdesk project)

## 5. Environments — guardrails (full text: `RULES_REFERENCE.md` §5)

- Never read, print or commit secrets (Supabase keys, DB password, Google/PostHog/Resend secrets). Only the project URL and publishable key reach the browser; `.env.example` lists names only.
- Supabase project `kmmfhaypqgzhoptmljki` **is production** (no dev project). Never touch other Supabase projects. Migrations are forward-only, never edited after push, applied on merge to `main`; `pnpm test:db` runs only on a throwaway local Postgres.
- No Docker, WSL or local Supabase. Never create cloud resources or anything that costs money without Amir's approval.
- Do not merge or deploy to production without explicit approval. Squash merge, only after "CI / checks" and "Database tests / rls" are green (manual rule: GitHub Free cannot enforce it).

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

## 7. i18n, RTL and UX — key rules (full text, 25 bullets: `RULES_REFERENCE.md` §7)

- Arabic default, English complete; no hardcoded strings (`messages/*.json`); logical CSS properties only (`ms-`/`pe-`/`start`/`end`); Western digits, tabular numbers on money; mobile-first 360 px.
- Real data is never labelled sample; every screen showing sample data carries the "مثال · أرقام توضيحية" chip; one top line on every `/demo` screen.
- No silent taps (`e2e/taps.spec.ts` enforces it). Bottom nav never covers content (`BOTTOM_NAV_CLEARANCE`).
- Headline profit is after depreciation. Occupancy is never silently clamped. Locale comes from the URL only.
- Visitor analytics = anonymous counting only (`docs/ANALYTICS.md`). The landing page sells only what works today; public pages must not ship app code (`pnpm check:bundle`).

## 8. How to work in this repo

- Phase order: **P → P.1 → 1 → P.2 → 0a → 0b → 2 → 3 → ⛔ Validation Gate → 5 → 6 → 7 → 8 → 4 (payments and legal) → 10 → 🚀 LAUNCH → 9 (post-launch growth)**.
- Work **one phase at a time** from `docs/BUILD_PLAN.md`. Start by presenting a plan (files, migrations, RLS policies, tests) and wait for approval.
- If a requirement is ambiguous or conflicts with this file, stop and ask, offering 2–3 concrete options with a recommended default.
- Every change to finance logic, entitlements or RLS ships with tests.
- Small conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- End of every phase: run `pnpm lint && pnpm typecheck && pnpm test` (plus `pnpm test:db` from Phase 0b), update `docs/PROGRESS.md` (done / decisions / open issues / next step), then stop.
- Never start Phase 5 without the Validation Gate confirmation described in `docs/BUILD_PLAN.md`.

## 9. Glossary, context map and memory upkeep

Finance terms (ADR, RevPAR, NOI, operating models, plans, statement basis): `RULES_REFERENCE.md` §9.

| Need | Read |
|---|---|
| Resume / what is next | `.claude/context/SESSION_HANDOFF.md` (always) |
| Verified state per area | `.claude/context/PROJECT_STATUS.md` |
| Modules, data flow, auth, DB | `.claude/context/ARCHITECTURE.md` |
| Prioritized tasks, acceptance criteria | `.claude/context/ROADMAP.md` |
| Why something was decided | `.claude/context/DECISIONS.md` |
| Bugs, risks, debt | `.claude/context/KNOWN_ISSUES.md` |
| Product summary, journeys | `.claude/context/PROJECT_OVERVIEW.md` |
| Full rules (env, UI, glossary) | `.claude/context/RULES_REFERENCE.md` |
| Formulas, phases, worked examples | `docs/BUILD_PLAN.md` (`grep -n '^#'`, read one section) |
| Dated history (large) | `docs/PROGRESS.md` |

Upkeep: `/project-sync` at the end of a session updates only the context files whose facts changed and never commits by itself. `SESSION_HANDOFF.md` is updated every time. Record facts, paths and evidence (CI run, commit); no transcripts, no invented percentages, no unverified "done".
