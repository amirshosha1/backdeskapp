# ARCHITECTURE — as built on `main` 4e14ee2

> Describes what exists in code, not the target design (target: `docs/BUILD_PLAN.md` §3–§5). Verified 2026-10-16 by reading the tree, migration, route handlers and workflows.

## Shape
Single Next.js 16 App Router app (TypeScript strict), deployed on Vercel (`vercel.json`: region `dub1`). Supabase (Postgres + Auth) is the only backend. No separate API service, no background jobs, no queues. The browser does most work (calculator, guest storage); the server is used for auth callback, account writes (server actions) and the analytics forwarder.

## Directories
| Path | Responsibility |
|---|---|
| `src/app/[locale]/` | Locale-aware pages: landing `page.tsx`, `privacy/`, `demo/` (the whole app: `(tabs)` = home, units, calculator, expenses, guide, pricing, more; `(task)` = start flow, expenses/new), `not-found.tsx` (server-only on purpose), `[...rest]` catch-all |
| `src/app/api/e/route.ts` | First-party analytics forwarder to PostHog EU (only route handler besides auth) |
| `src/app/auth/callback/route.ts` | Supabase PKCE code exchange; outside locales; `next` page read from `bd_next` cookie via allow-list `src/lib/auth/next-path.ts`; relative `Location` |
| `src/proxy.ts` | next-intl middleware (matcher skips `api`, `auth/callback`, `_next`, files). `ar` has no URL prefix, `en` uses `/en` |
| `src/lib/finance/` | Pure engine (Decimal, typed `Result`, Zod schemas, `ENGINE_VERSION` 1.0.0): scenario, pnl, kpis, breakeven, commission, fees, fx, statement, org-profit, projection, sensitivity, tax, verdict, period |
| `src/lib/calculator`, `first-run`, `landing`, `pricing` | Form parsing → engine; first-run questions and verdict sentence; landing example computed at build time from the `arbitrage` preset; apartment price rule |
| `src/lib/guest/` | Browser-only storage of the visitor's apartment/answers (`backdesk:guest*` keys) |
| `src/lib/account/` | Account store (memory only), autosave, server actions (`actions.ts`), adoption of the browser apartment, Zod schemas, jsonb 8 KB guard |
| `src/lib/supabase/` | Browser (on demand) and server clients, publishable key only; accounts switch off when env vars are unset (`env.ts`) |
| `src/lib/analytics/` | Event catalogue (`events.ts`), sender (`track.ts`), inline landing script; guard test forbids other senders |
| `src/lib/seo`, `src/lib/landing/share-*` | Metadata, hreflang, share images (`public/og/*.png`, hash guard test) |
| `src/components/`, `src/demo/` | UI by feature; `src/demo/{fixtures,sample-data}` feed sample screens only |
| `messages/{ar,en}.json` | All UI copy |
| `supabase/migrations/` | One migration: `20261008180000_accounts_and_units.sql` |
| `tests/db/` | Throwaway-Postgres harness (`scripts/test-db.sh`) with Supabase-like roles; RLS, grants, triggers, verify SQL, generated `src/types/database.ts` freshness |
| `e2e/` + 4 `playwright*.config.ts` | Browser tests; each env-dependent build (accounts, analytics, preorder) has its own config |
| `scripts/` | `check-public-bundle.mjs` (public pages must not ship app code; `/` ≤150 KB gzip), `og/` renderer, `test-db.sh` |

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
Binding rules: `CLAUDE.md` §2 and §6 (not repeated here).
