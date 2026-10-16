# PROJECT_STATUS — verified snapshot

> **Verified 2026-10-16 at `main` = `4e14ee2`** (PR #17, merged 2026-10-11). Work branch `claude/exciting-heisenberg-wvg7fl` was identical to `main` and clean at audit start.
> Update only with evidence. If this contradicts the code, the code wins: verify and fix this file.

## Evidence legend
`CODE` seen in the repo during this audit · `CI` green GitHub Actions run on `4e14ee2` (CI/checks: lint, typecheck, unit tests, build, bundle check; Database tests/rls) · `PR` stated in a PR body, not re-run · `DOC` stated in repo docs, not re-verified · `MANUAL` human check recorded · `PROD` observed on backdeskapp.com. **No `PROD` evidence exists** (this sandbox's proxy returned 403 for the site; no one has recorded a production check). Tests were **not re-run** in this audit (no `node_modules`; nothing installed).

## Overall
Calculator-first prototype with a real account layer. A visitor can get a profit/loss verdict and, after Google sign-in, keep up to 5 apartments. **There is no persisted income/expense ledger, no entitlement enforcement, no payments, no reports.** Production-readiness: **not ready as an operating ledger or paid product**; the free calculator can be shared as labelled early access (matches the stabilization beta-gate conclusion in PR #22). Validation Gate (20 paid pre-orders) status: unknown.

## Status by area
| Area | Status | Evidence | Remaining |
|---|---|---|---|
| Landing `/`, `/en`, share images, sitemap/robots | COMPLETE (code) | CODE `src/app/[locale]/page.tsx`, `src/lib/landing/`; CI; PR #17 lists e2e | Merge-gate items (PostHog live events, Facebook in-app check, Search Console) have no recorded result → UNKNOWN |
| Free calculator + first-run flow (browser storage) | PARTIAL | CODE `src/lib/calculator`, `src/lib/first-run`, `src/lib/guest`; CI | Preset errors (KI-03); no tax input, fixed 30-day month; PR #22/#23 open |
| Finance engine `src/lib/finance/` | COMPLETE for Phase 1 scope | CODE 22 modules + 7 test files; CI; DOC 99.8% line/98.6% branch at Phase 1 (not re-run) | Not wired to any persisted ledger; locked-month KPI rule undecided |
| Auth (Google, PKCE) + account store | PARTIAL | CODE `src/app/auth/callback/route.ts`, `src/lib/account/`, `src/lib/supabase/`; CI incl. accounts-off build only | Live two-account isolation unproven (KI-01); consent screen in Testing (DOC) |
| Database + RLS | COMPLETE for slice 1 | CODE one migration, 5 tables (`orgs`, `org_members`, `profiles`, `org_entitlements`, `units`), RLS + column grants + `delete_my_account()`; CI "rls" job; PR: 88 DB tests | ERP tables (bookings, transactions, audit_log, owner_grants…) NOT STARTED |
| Entitlements, trial, gating | NOT STARTED | CODE: only the `org_entitlements` table exists; no `src/lib/entitlements/` | Phase 7 by decision |
| Billing / payments | NOT STARTED | CODE: no Paymob code; pricing page is static; pre-order URL env unset (DOC) | Phase 4 |
| ERP: income/expense entry, reports, statements, payout import, smart entry | NOT STARTED (UI shells with sample data) | CODE screens `expenses/new`, `units/[id]/statement`; entry points removed 2026-10-09 (DOC) | Phases 5–8; blocked by Validation Gate |
| Setup guide / Setup Kit | PARTIAL (prototype) | CODE `guide/` screens with fixtures | Phase 3 |
| Admin | NOT STARTED | CODE: no admin routes | — |
| Analytics | PARTIAL | CODE `src/app/api/e/route.ts` (4 events, Zod strict, same-origin check); CI; PR #24 (consent, draft) | PostHog project/vars setup by Amir unverified; no rate limit (KI-05) |
| Observability / error handling | NOT STARTED | CODE: no error tracking SDK, no `error.tsx`/`global-error.tsx`; PR C queued (DOC) | Error boundary, Sentry/PostHog errors |
| PWA | NOT STARTED | CODE: Serwist not in `package.json` | PR C |
| Privacy | PARTIAL | CODE `/privacy` AR+EN (analytics described); DOC deletion limits | Counsel review, consent (PR #24), cookie policy |
| Security hardening | PARTIAL | CODE: RLS, publishable key only (guard test), safe `next` allow-list, relative redirect; no CSP/security headers (KI-04) | Headers, rate limiting, hosted pen-check |
| Automated tests / QA | PARTIAL | CODE 56 unit test files in `src`, 4 DB test files in `tests/db`, 18 e2e specs, 4 Playwright configs; CI runs unit+DB | e2e and coverage gate not in CI (KI-06) |
| CI/CD, deployment | PARTIAL | CODE `.github/workflows/{ci,db-tests}.yml`, `vercel.json` (`dub1`); CI green on `4e14ee2` | Required checks unenforceable (KI-07); production behaviour unverified |
| Documentation / DX | PARTIAL | CODE `docs/*` (2,445 lines); stale in places (KI-08) | Compaction; Windows setup issues (KI-09) |

## In progress — open draft PRs (all based on `4e14ee2`; CI "checks" + "rls" green at their heads; none merged)
| PR | Purpose | Gate stated in PR |
|---|---|---|
| [#19](https://github.com/amirshosha1/backdeskapp/pull/19) pricing truth | Mark each plan feature "available / in development"; remove Setup Kit order action | Amir approval, Preview review |
| [#20](https://github.com/amirshosha1/backdeskapp/pull/20) account persistence | Fix stale account data restored after sign-out; two-account Preview matrix | Amir's two-Google-account test |
| [#21](https://github.com/amirshosha1/backdeskapp/pull/21) delete-account tests | RLS tests: shared-org safety, stale token reads nothing | Preview check with disposable account |
| [#22](https://github.com/amirshosha1/backdeskapp/pull/22) UX + beta gate | Direct numeric entry in first-run; beta-gate doc ("not ready as operating ledger") | CI, 360/768/1440 AR/EN review |
| [#23](https://github.com/amirshosha1/backdeskapp/pull/23) 3BR presets | Baseline-aligned examples, laundry input, new share images | User approval |
| [#24](https://github.com/amirshosha1/backdeskapp/pull/24) analytics consent | HMAC-signed 6 h consent cookie; needs server env `ANALYTICS_CONSENT_SECRET` (≥32 bytes) in Preview and Production | Phone + two-tab validation; no production deploy without approval |

## Blockers
- Validation Gate (20 paid InstaPay pre-orders, exact line `Gate passed: {number} paid pre-orders.`) blocks Phase 5 (`docs/BUILD_PLAN.md` §5).
- Phase 2 benchmarks blocked by AirROI coverage spike + licensing confirmation (BUILD_PLAN §6 Q4, Q10–Q15).
- Email sign-in blocked by no sending domain/SMTP (Q1).
- Pre-orders blocked by `NEXT_PUBLIC_PREORDER_URL` unset (DOC).

## Remaining validation (nothing below has evidence)
Two-account Google isolation on a Preview · delete-account on a disposable account · real PostHog Live-events check of the four events · Facebook in-app browser pass · landing/Search Console/Sharing Debugger steps · production headers and TLS · coverage ≥95% on `src/lib/finance/` (re-run) · e2e on all four configs (not run in CI).
