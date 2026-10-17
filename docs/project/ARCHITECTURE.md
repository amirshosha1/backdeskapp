# ARCHITECTURE — as built on `main` 4e14ee2

> Describes what exists in code, not the target design (target: `docs/BUILD_PLAN.md` §3–§5). Verified 2026-10-16 by reading the tree, migration, route handlers and workflows.

## Shape
Single Next.js 16 App Router app (TypeScript strict), deployed on Vercel (`vercel.json`: region `dub1`). Supabase (Postgres + Auth) is the only backend. No separate API service, no background jobs, no queues. The browser does most work (calculator, guest storage); the server is used for auth callback, account writes (server actions) and the analytics forwarder.

## Where things live
Directory and entry-point map: `CODEBASE_MAP.md`.

## Data flow
- **Visitor:** landing (static, no client JS of its own) → `/demo/start` → answers + apartment in `localStorage` → engine runs in browser → verdict. Only anonymous counts leave the browser (`POST /api/e` → PostHog).
- **Signed-in:** browser Supabase client holds session (cookies); reads apartments via RLS; writes go through server actions (Zod → granted columns only). Browser apartment is offered for adoption once after sign-in. Account data never goes to browser storage.
- **Numbers:** every figure from `src/lib/finance/`; no formulas in components or SQL.

## Database (migration 1)
Tables: `orgs`, `org_members`, `profiles`, `org_entitlements`, `units` (name, operating_model, `calculator_inputs` jsonb ≤8 KB, `engine_version`). RLS on all five; policies resolve through `private.member_org_ids()` / `editor_org_ids()`. Column-level grants: users cannot touch plan, limits, trial/paid dates, ownership, ids or timestamps. Triggers: personal org + profile on `auth.users` insert (with backfill), 5-apartment limit under per-org lock, `updated_at`. `public.delete_my_account()` is the only RPC. `anon` reaches nothing. Data API exposes `public` and `graphql_public` only.
**Not yet present:** bookings, transactions, expenses/income, fx, owners/`owner_grants`, statements, `audit_log`, benchmarks, invitations.

## AuthN / AuthZ
Google only, PKCE via Supabase; no service-role or secret key anywhere (a unit test fails if one appears). Authorization = RLS + column grants + triggers. Roles in `org_members`; owners are never org members (future `owner_grants`). Entitlement enforcement is not implemented (table only).

## External integrations
Supabase (Auth, Postgres), Vercel (hosting, previews), PostHog EU (via `/api/e`, only if `NEXT_PUBLIC_POSTHOG_KEY` is set), GitHub Actions. Planned: Resend, Paymob, Anthropic, AirROI. Env names: `.env.example`.

## Deployment
Vercel Git integration: PR → Preview, `main` → `backdeskapp.com`. Supabase GitHub integration applies `supabase/migrations/` on merge to `main` against the single production project. CI: `.github/workflows/ci.yml` (lint, typecheck, unit tests, build with placeholder public values, `check:bundle`) and `db-tests.yml` (`pnpm test:db`). e2e is not run in CI.

## Constraints
Binding rules: `AGENTS.md` §2 and §6 (not repeated here).

## Stack (verbatim from the former CLAUDE.md §3)

- Next.js (latest stable, App Router) + TypeScript `strict`
- Tailwind CSS + shadcn/ui, lucide-react icons, Recharts
- Supabase, hosted only (see §5): Postgres, Auth, Storage, Row Level Security, pg_cron
- next-intl (`ar` default, `en` second); PWA via Serwist
- Zod (validation), react-hook-form, decimal.js (money)
- Vitest + fast-check (unit and property tests), Playwright (e2e)
- Anthropic API, server-side only, for smart entry and receipt reading
- Payments behind a `PaymentProvider` interface; Paymob implemented first, **only in the pre-launch payments phase (Phase 4)**. Until then, pre-orders are manual InstaPay transfers and access is granted manually.
- PostHog (product analytics, EU cloud; until PR C, anonymous counting only through `/api/e`, `docs/ANALYTICS.md`), Resend (email; also the SMTP sender for Supabase Auth once email sign-in is added, see §5)
- Package manager: pnpm. Deployment: Vercel, functions pinned to `dub1` (Dublin, next to Supabase in Ireland; decided 2026-10-08). Production URL: `https://backdeskapp.com`.
