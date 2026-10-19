# AGENTS.md — Backdesk · باك ديسك

> Universal entry point for any coding agent (Codex, Claude Code, Cursor, Gemini CLI, Copilot, others). The repository owns the project's knowledge; nothing here depends on a vendor, model or proprietary memory. Section numbers follow the former `CLAUDE.md` because code and docs cite them (`CLAUDE.md §6.3` = §6 item 3 below).

## 0. Start here
1. Read this file, then [`docs/strategy/90-day-launch.md`](docs/strategy/90-day-launch.md), then `docs/project/SESSION_HANDOFF.md`. The strategy file records approval boundaries and source limitations; it does not replace the implementation truth precedence below. Open `docs/project/INDEX.md` only when you need the documentation map or the resume/sync procedures. Load nothing else until the task needs it.
2. **Truth precedence, highest first:** (1) current code and repository state; (2) tests and CI results; (3) verified production and infrastructure state; (4) approved specs and decisions (`docs/BUILD_PLAN.md`, `docs/project/DECISIONS.md`); (5) `docs/project/PROJECT_STATUS.md` and `ROADMAP.md`; (6) historical planning (`docs/PROGRESS.md`); (7) handoffs and chat summaries. Implemented ≠ verified ≠ production-ready. If a spec and the code disagree, report it; do not silently pick one.
3. Check freshness before trusting stored status (commands in `SESSION_HANDOFF.md`). Do not re-audit the repository; re-inspect only what changed.
4. **Strategy guardrail:** G0 assessment and a local bridge's PLANNING with synthetic data are approved as described in `docs/strategy/90-day-launch.md`; approval is not gate passage or permission to build. G1/G2, console implementation, payment operations/integration and migrations remain pending. D-02 and the five tabs stand. The experimental quotes (250 founding / 300 standard EGP per unit per month) do not change D-07 or product pricing. Report conflicts before dependent work; do not infer an approval from a chat summary, a plan, a draft PR or a missing source.

## 1. Product
Arabic-first financial OS for short-term-rental hosts in Egypt, then GCC: "How much does this unit really make, and why?" Users: owner-operators, rental-arbitrage hosts, co-hosts managing owners' units. **Data entry is free, outputs are paid** (Free = one apartment with the full, correct calculator; Pro = history, reports, owner statements, import). Stage: pre-launch prototype; calculator and accounts ship, the ledger does not (`PROJECT_STATUS.md`). Production `https://backdeskapp.com`; repo `amirshosha1/backdeskapp`; owner Amir. Stack: Next.js App Router + TypeScript strict, Supabase (Ireland), Vercel `dub1`, next-intl (`ar` default), decimal.js, Zod, Vitest/Playwright, pnpm.

## 2. Hard non-goals — never build these

- No booking engine, calendar, availability, iCal or channel-manager sync, guest messaging, or price pushing to OTAs. Blocked nights are a manual number per unit per month, not a calendar.
- No storage of guest personal data. Payout files are parsed in the browser; guest names, phones and emails never reach the server, and the file itself is never stored.
- No tax, legal or investment advice. Tax rates are user-configured settings, never hardcoded claims.
- No invented market data. Any default, preset, price or benchmark without a real source is labelled `SAMPLE` in data and UI. Paying users never see SAMPLE benchmarks: if there are no sourced benchmark figures, the benchmark feature is hidden.

## 3. Stack
Full list and architecture: `docs/project/ARCHITECTURE.md`. Planned, not installed: Serwist, Recharts, react-hook-form, Anthropic SDK, Resend, Paymob.

## 4. Commands (details and CI: `docs/project/OPERATIONS.md`)
`pnpm dev` · `pnpm lint` · `pnpm typecheck` · `pnpm test` (unit, no network) · `pnpm test:coverage` (≥95% on `src/lib/finance/`) · `pnpm build` · `pnpm check:bundle` (after build) · `pnpm test:db` (RLS, throwaway local Postgres, Linux only, never the hosted project) · `pnpm test:e2e` and three other Playwright configs, one build at a time · `pnpm og:render` after any landing change · `pnpm db:types`. Documentation-only changes need none of these: check paths and links.

## 5. Production safety and workflow
- Never read, print or commit secrets (Supabase keys, DB password, Google/PostHog/Resend secrets). Only the project URL and publishable key reach the browser; `.env.example` lists names only.
- Supabase project `kmmfhaypqgzhoptmljki` **is production** (no dev project); never touch other projects. Migrations are forward-only, never edited after push, and apply to production when merged to `main`: a PR with a migration says so, merges alone, and the owner then runs `docs/verify_after_migration.sql`. `pnpm test:db` never targets the hosted project.
- No Docker, WSL or local Supabase. Never create cloud resources or anything that costs money without the owner's approval.
- Branch from `main`, small conventional commits (`feat:` `fix:` `test:` `chore:` `docs:`), PR to `main`, squash merge only after "CI / checks" and "Database tests / rls" are green (a manual rule: GitHub Free cannot enforce it). Do not merge, deploy, force-push or commit unasked.

## 6. Architecture rules (non-negotiable)

1. **One source of truth for numbers.** Every financial figure comes from pure functions in `src/lib/finance/`. No financial formulas in components or SQL; SQL may only aggregate (SUM, COUNT). Anything that needs per-night logic (per-month stay allocations) is computed by the engine and stored, so SQL only aggregates it. Phase P displays fixture numbers only and contains no formulas; from the end of Phase 1 the `/demo` calculator runs on the real engine.
2. **Money is never a JS float.** Use `decimal.js`; Postgres `numeric(14,2)` for amounts, `numeric(7,4)` for percentage rates, `numeric(18,8)` for FX rates. Rounding is **half-up**, applied only at presentation, to stored unit-currency amounts and to statement totals. **Every split** (proration across months, platform-fee allocation, expense-bearer splits, statement lines) gives the leftover cent(s) to the last line so the parts sum exactly to the total. Calculator rows shown together reconcile at displayed precision; in a half-piastre tie whose figures have opposite signs (+0.005 → 0.01, −0.005 → −0.01), a derived subtotal or revenue line takes the other half of its tie. The headline net, typed amounts and the rounding mode never change for this (D-24, `scenario-view.ts`).
3. **Currency is explicit.** Every transaction stores its original amount, original currency, an explicit FX rate and the amount in the unit's currency. The engine calculates in the unit's currency only and rejects anything else with a typed error. No implicit or automatic FX. Units in different currencies show separate totals. Default currency `EGP`.
4. **Multi-tenant by `org_id`.** RLS is enabled on every table with tested policies. The service-role key is used only in server code that genuinely needs it.
5. **Entitlements are enforced on the server** (`src/lib/entitlements/`). Blurred teasers render placeholder data only; paid-plan data must never reach a Free client. The Free calculator runs in the browser; the 12-month projection and benchmarks run in server-only modules and never ship to a Free client. The entitlements service, the trial clock and all gating are built in Phase 7, together with the month report; until then every account works with everything open (decided 2026-10-08, `docs/BUILD_PLAN.md` §2).
6. **Validate every input with Zod** at server boundaries (server actions, route handlers, webhooks).
7. **AI assists, it does not book.** AI calls run server-side, model IDs come from env (`AI_MODEL_FAST`, `AI_MODEL_VISION`), outputs are parsed against Zod schemas, and every AI-created transaction is saved as `unconfirmed` until the user confirms it.
8. **Closed periods are immutable.** Finalizing an owner statement locks that unit's month. Anything dated inside a locked month (a late adjustment, a correction, an imported row) is posted to the next open period and keeps its original date for reference. Commission transactions are created only as a snapshot when a statement is finalized. Every write to financial tables is recorded in `audit_log`, which is append-only; the only permitted change is personal-data redaction on deletion (see `docs/BUILD_PLAN.md` §3).
9. **Guest privacy by construction.** Payout files are parsed in the browser; only sanitized rows are uploaded and the file is never stored. Booking confirmation codes are hashed on the server with HMAC-SHA256 using a per-org key derived from a server secret; raw codes are never persisted.
10. **Owners are not org members.** Unit owners reach their statements only through the `owner_grants` table and signed, expiring statement links, never through `org_members`.
11. **Timezone** is `Africa/Cairo` by default and stored per org.

## 7. i18n, RTL and UX: key rules (all of them: `docs/project/UX_RULES.md`)
Arabic default, English complete, no hardcoded strings (`messages/*.json`), logical CSS properties only, Western digits with tabular numbers on money. Real data is never labelled sample; sample screens carry "مثال · أرقام توضيحية". No silent taps. Headline profit is after depreciation. Visitor analytics are anonymous counting only (`docs/ANALYTICS.md`). The landing sells only what works today; public pages must not ship app code.

## 8. How to work in this repo

- Phase order: **P → P.1 → 1 → P.2 → 0a → 0b → 2 → 3 → ⛔ Validation Gate → 5 → 6 → 7 → 8 → 4 (payments and legal) → 10 → 🚀 LAUNCH → 9 (post-launch growth)**.
- Work **one phase at a time** from `docs/BUILD_PLAN.md`. Start by presenting a plan (files, migrations, RLS policies, tests) and wait for approval.
- If a requirement is ambiguous or conflicts with this file, stop and ask, offering 2–3 concrete options with a recommended default.
- Every change to finance logic, entitlements or RLS ships with tests.
- Small conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- End of every phase: run `pnpm lint && pnpm typecheck && pnpm test` (plus `pnpm test:db` from Phase 0b), update `docs/PROGRESS.md` (done / decisions / open issues / next step), then stop.
- Never start Phase 5 without the Validation Gate confirmation described in `docs/BUILD_PLAN.md`.
- Tests: every change to finance logic, entitlements or RLS ships with tests; reproduce a bug with a failing test first. Property tests (fast-check) print their seed on every failure; replay one with `FC_SEED=<seed> pnpm test <file>`.

## 9. Knowledge, resume and sync
Map of every document, the resume and sync procedures, and the agent compatibility notes: `docs/project/INDEX.md`. Claude Code users also have `/project-resume` and `/project-sync`; they only wrap those procedures. After meaningful work, update `SESSION_HANDOFF.md` and any status, roadmap, issue or decision entry whose facts changed, with evidence (command, CI run, commit). Never record unverified claims or invented percentages.
