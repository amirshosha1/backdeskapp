# PROJECT_STATUS — verified snapshot

> **Code baseline: `main` @ `72903c6`** (PR #33, merged 2026-10-18). Rows updated 2026-10-18 are marked; others last verified 2026-10-16. Levels V0–V6 are defined in `VERIFICATION.md`; **no row has V6 (production) evidence**: an agent cannot reach `backdeskapp.com` or the Vercel team API, so production status comes from the owner.
> **Stale check:** `git fetch -q origin && git log --oneline 72903c6..origin/main -- . ':!docs' ':!.claude' ':!*.md' ':!.github/copilot-instructions.md'` (code commits only). Output means the areas those commits touched must be re-verified. The PR table is stale when `git ls-remote origin 'refs/heads/*'` shows other heads.
> Status values: COMPLETE · PARTIAL · IN PROGRESS · NOT STARTED · BLOCKED · UNKNOWN. No completion percentages are kept.

## Overall
A calculator-first prototype with a real account layer: a visitor gets a profit/loss verdict and, after Google sign-in, can keep up to 5 apartments. **There is no stored income/expense ledger, no plan gating, no payments, no reports.** Honest label: **Calculator Private Beta, not an operating ledger or paid product** (beta gate, `docs/STABILIZATION_BETA_GATE.md`, merged with #22; owner objective 2026-10-18). Validation Gate status (20 paid pre-orders): unknown.

## Status by area
| Area | Status | Evidence and code refs | Level | PR / commit | Remaining | Pri |
|---|---|---|---|---|---|---|
| Landing `/`, `/en`, share images, sitemap | COMPLETE (code) | `src/app/[locale]/page.tsx`, `src/lib/landing/` | V2 (e2e reported in PR) | #17 `4e14ee2` | Merge-gate checks never recorded (PostHog, Facebook in-app, Search Console) | P1 |
| Free calculator + first-run flow | PARTIAL (updated 2026-10-18) | `src/lib/calculator/`, `src/lib/first-run/`, `src/lib/guest/` | V2 (CI) + V4 local (main e2e 308/308 on `72903c6`, AR/EN at 360/768/1440) | #9, #17, #23, #22 | Real-phone AR/EN review NOT TESTED (V5); no tax input; fixed 30-day month | P0 |
| Finance engine | COMPLETE for Phase 1 scope (updated 2026-10-18) | 22 modules + 7 test files in `src/lib/finance/` | V2; coverage 99.66% measured 2026-10-18 | #6, #7, #33 | Display tie rule D-24; 20-digit precision limit KI-22 (#34) deferred; not connected to any stored ledger | P1 |
| Google sign-in, account store | PARTIAL (updated 2026-10-18) | `src/app/auth/callback/route.ts`, `src/lib/account/`, `src/lib/supabase/` | V2 + V4 (accounts-browser in CI) | #13, #20, #31 | Live two-account isolation KI-01 NOT TESTED; consent screen in Testing (docs) | P0 |
| Database + RLS (5 tables) | COMPLETE for slice 1 | `supabase/migrations/20261008180000_accounts_and_units.sql`, `tests/db/` | V3 | #12 | ERP tables not started | P1 |
| Plan gating, trial, entitlements | NOT STARTED | Only the unused `org_entitlements` table | V1 | — | Phase 7 by decision | P3 |
| Payments, billing | NOT STARTED | No Paymob code; static pricing page | V1 | — | Phase 4 | P3 |
| ERP: income/expense entry, periods, audit log | NOT STARTED (sample UI) | Entry points removed 2026-10-09; no tables | V1 | — | Blocked by Validation Gate | P1 |
| Reports, owner statements, payout import, smart entry | NOT STARTED (sample statement screen) | `src/components/statement/` | V1 | — | Phases 6–8 | P3 |
| Setup guide / Setup Kit | PARTIAL (prototype) | `src/components/guide/` with fixtures | V1 | — | Phase 3 | P3 |
| Pricing page | PARTIAL (updated 2026-10-18) | `src/demo/fixtures/pricing.ts`, `src/components/pricing/` | V2 | #10, #19 | Availability labels merged (#19); prices are SAMPLE | P1 |
| Analytics (anonymous counting) | PARTIAL | `src/app/api/e/route.ts`, `src/lib/analytics/` | V2 | #15, #17 | PostHog setup unverified; no rate limit KI-05; consent in #24 | P1 |
| Privacy page | PARTIAL | `src/components/privacy/` (AR+EN) | V2 | #13, #15 | Legal review; consent wording with #24 | P1 |
| Admin | NOT STARTED | No admin routes | V1 | — | — | P3 |
| Error handling, monitoring | NOT STARTED | No `error.tsx`/`global-error.tsx`; no SDK | V1 | — | PR C | P2 |
| PWA | NOT STARTED | Serwist not in `package.json` | V1 | — | PR C | P2 |
| Security hardening | PARTIAL | RLS, column grants, publishable key only, `src/lib/auth/next-path.ts`; no CSP/security headers | V1–V3 | — | KI-04, KI-05 | P1 |
| Automated tests | PARTIAL | 56 unit files in `src`, 4 DB files, 18 e2e specs, 4 Playwright configs | V2–V3 in CI | — | e2e and coverage not in CI KI-06 | P2 |
| CI/CD, deployment | PARTIAL | `.github/workflows/`, `vercel.json` (`dub1`) | V2–V3 | — | Required checks unenforceable KI-07; production unobserved | P1 |
| Documentation, developer experience | PARTIAL | `docs/`, this folder | V1 | #25 merged `dfba35e`; #26 merged `acc5596` | Compaction of `docs/PROGRESS.md`; Windows setup KI-09 | P2 |

## In progress — open draft PRs (live list 2026-10-18)
| PR | Head | Purpose | Gate |
|---|---|---|---|
| [#21](https://github.com/amirshosha1/backdeskapp/pull/21) delete-account security | `117212f` | RLS tests plus a **production migration** (KI-19) | **BLOCKED** until the real backup/restore drill (#30) and disposable-account acceptance pass |
| [#24](https://github.com/amirshosha1/backdeskapp/pull/24) analytics consent | `0ef9da6` | Signed consent cookie; needs `ANALYTICS_CONSENT_SECRET` (KI-11, KI-21) | Phone + two-tab validation |
| [#29](https://github.com/amirshosha1/backdeskapp/pull/29) competitor roadmap | `c3b8331` | Documentation only | Owner review |
| [#30](https://github.com/amirshosha1/backdeskapp/pull/30) backup drill | `2344fbc` | Manual encrypted partial backup + isolated restore (GitHub Actions) | Separate merge approval, then separate production-run approval |

Merged 2026-10-18 (squash): #20 `8dafab0`, #19 `b9acd8f`, #23 `0eca79a`, #31 `d7daa9a`, #22 `0d68a58`, #33 `72903c6`. Closed unmerged: #32 (superseded by #33). `main` CI on `0d68a58` failed once on the property #33 fixed; `72903c6` is green.

## Blockers
Validation Gate blocks Phase 5 · Phase 2 benchmarks wait on AirROI coverage spike + licence (`BUILD_PLAN.md` §6 Q4, Q10–Q15) · email sign-in needs a sending domain (Q1) · pre-orders need `NEXT_PUBLIC_PREORDER_URL` and a confirmed price (Q2, Q3).

## Remaining validation
See the "Not yet verified" table in `VERIFICATION.md`.
