# CODEBASE_MAP — where to look

> Navigation aid for `main` @ `4e14ee2`. Paths only, no code. If a path is missing, trust the tree and fix this file. Design explanation: `ARCHITECTURE.md`.

## Directories and responsibilities
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


## Feature → code
| Feature | Start here | Tests |
|---|---|---|
| Landing page, share images | `src/app/[locale]/page.tsx`, `src/components/landing/`, `src/lib/landing/`, `src/lib/seo/` | `src/lib/landing/*.test.ts`, `e2e/landing.spec.ts`, `e2e/share-meta.spec.ts` |
| First-run flow and verdict | `src/lib/first-run/`, `src/components/first-run/`, `src/app/[locale]/demo/(task)/start/` | `src/lib/first-run/flow.test.ts`, `e2e/first-run.spec.ts` |
| Calculator and presets | `src/lib/calculator/form.ts`, `src/components/calculator/`, `src/demo/sample-data/calculator-presets.ts` | `src/lib/calculator/form.test.ts`, `e2e/calculator.spec.ts` |
| Finance formulas | `src/lib/finance/` (`scenario.ts`, `pnl.ts`, `breakeven.ts`, `commission.ts`, `statement.ts`, `org-profit.ts`) | `src/lib/finance/*.test.ts` (worked examples A–K in `examples.test.ts`) |
| Accounts, apartments, sign-in | `src/lib/account/`, `src/lib/supabase/`, `src/app/auth/callback/route.ts`, `src/lib/auth/next-path.ts` | `src/lib/account/*.test.ts`, `e2e/accounts-env.spec.ts` (`playwright.accounts.config.ts`) |
| Database schema and RLS | `supabase/migrations/`, generated `src/types/database.ts`, `docs/verify_after_migration.sql` | `tests/db/*.test.ts` via `pnpm test:db` |
| Analytics | `src/app/api/e/route.ts`, `src/lib/analytics/`, `docs/ANALYTICS.md` | `src/lib/analytics/*.test.ts`, `e2e/analytics-env.spec.ts` |
| Pricing page | `src/components/pricing/`, `src/demo/fixtures/pricing.ts`, `src/lib/pricing/` | `src/test/screens/pricing.test.tsx`, `e2e/preorder-env.spec.ts` |
| Privacy page | `src/components/privacy/`, `src/app/[locale]/privacy/` | `e2e/privacy.spec.ts` |
| Sample screens (home, units, expenses, guide, statement) | `src/components/{home,units,expenses,expense,guide,statement}/`, `src/demo/fixtures/` | `src/test/screens/`, `e2e/taps.spec.ts`, `e2e/example-label.spec.ts` |
| In-app browser detection | `src/lib/browser/in-app.ts` | `src/lib/browser/*.test.ts` |
| Copy (AR/EN) | `messages/ar.json`, `messages/en.json` | `e2e/locale.spec.ts` |

## Entry points and configuration
- Run: `pnpm dev` (`package.json` scripts). Build config: `next.config.ts` (only a `noindex` header on `/demo`), `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`.
- Tests: `vitest.config.mts` (unit), `vitest.db.config.mts` (database), `vitest.og.config.mts` (share images), `playwright*.config.ts` (four builds).
- CI/deploy: `.github/workflows/ci.yml`, `.github/workflows/db-tests.yml`, `vercel.json`. Env names: `.env.example`.
- Docs outside `docs/project/`: `docs/BUILD_PLAN.md` (spec), `docs/PROGRESS.md` (dated history), `docs/ANALYTICS.md`, `docs/SETUP_AUTH.md`, `docs/FINANCIAL_BASELINE.md`, `docs/backdesk-ux-audit-2026-10-09.md`.

## Not present yet (do not search for it)
Ledger tables and screens that save, `src/lib/entitlements/`, payments, report/PDF generation, payout import, AI calls, admin area, PWA service worker, error tracking, `docs/LAUNCH.md`.
