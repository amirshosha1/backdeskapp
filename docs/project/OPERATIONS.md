# OPERATIONS — commands, environments, CI/CD, migrations

> Canonical home of the operational rules formerly in `CLAUDE.md` §4 and §5 (moved verbatim) plus the deployment and rollback notes below. Never store credentials here: names only (`.env.example`). Legacy citations "CLAUDE.md §4/§5" mean this file.

## Commands (created in Phases P, 0a and 0b)

- `pnpm dev` — local Next.js server (uses the hosted dev Supabase project; there is no local database)
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


## Environments — cloud-first (non-negotiable)

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

## Deployment workflow (as built)
- Pull request → Vercel Preview (shares the production Supabase project, see KI-12); `main` → `https://backdeskapp.com`. Functions in `dub1` (`vercel.json`). Production deploys and merges need explicit approval.
- Migrations: add a new file under `supabase/migrations/`, prove it with `pnpm test:db`, merge; the Supabase GitHub integration applies it to production; then the owner runs the read-only `docs/verify_after_migration.sql` and pastes the result. A PR that adds a migration says so in its description and merges alone.
- CI: `.github/workflows/ci.yml` (lint, typecheck, unit tests, build with placeholder public values, `check:bundle`) and `db-tests.yml`. Playwright and `test:coverage` are not in CI (KI-06).

## Rollback considerations
- Application: redeploy the previous Vercel deployment (needs the owner or Vercel access; none from the cloud sandbox).
- Database: migrations are forward-only; undo with a new compensating migration, never by editing a pushed file. The Free Supabase plan has no paid backups (KI-12): take no destructive migration before that changes.
- Account deletion is irreversible by design (`public.delete_my_account()`).

## Known operational limitations
- `backdeskapp.com` is unreachable from the cloud sandbox proxy (HTTP 403 at the tunnel), so production behaviour cannot be observed there.
- Required status checks cannot be enforced on the private repository (KI-07).
- Windows checkouts: Vitest start-up failure and CRLF breaking the share-image test were reported on PRs #19–#21/#24 (KI-09).
