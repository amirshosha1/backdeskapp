# PROJECT_STATUS — verified snapshot

> **Code baseline: `main` @ `4e14ee2`** (PR #17, merged 2026-10-11). Last verified 2026-10-16 unless a row says otherwise. Levels V0–V6 are defined in `VERIFICATION.md`; **no row has V6 (production) evidence** and tests were not re-run in the audit (CI results only).
> **Stale check:** `git fetch -q origin && git log --oneline 4e14ee2..origin/main -- . ':!docs' ':!.claude' ':!*.md' ':!.github/copilot-instructions.md'` (code commits only). Output means the areas those commits touched must be re-verified. The baseline is the last *code* commit; `main` HEAD is later. Documentation-only commits since the baseline: `dfba35e` (#25), `acc5596` (#26), plus the documentation-sync PR once merged. HEAD at this update: `acc5596`. The PR table is also stale when `git ls-remote origin 'refs/heads/*'` shows other heads.
> Status values: COMPLETE · PARTIAL · IN PROGRESS · NOT STARTED · BLOCKED · UNKNOWN. No completion percentages are kept.

## Overall
A calculator-first prototype with a real account layer: a visitor gets a profit/loss verdict and, after Google sign-in, can keep up to 5 apartments. **There is no stored income/expense ledger, no plan gating, no payments, no reports.** Honest label: **calculator early access, not an operating ledger or paid product** (consistent with the beta-gate conclusion on PR #22). Validation Gate status (20 paid pre-orders): unknown.

## Status by area
| Area | Status | Evidence and code refs | Level | PR / commit | Remaining | Pri |
|---|---|---|---|---|---|---|
| Landing `/`, `/en`, share images, sitemap | COMPLETE (code) | `src/app/[locale]/page.tsx`, `src/lib/landing/` | V2 (e2e reported in PR) | #17 `4e14ee2` | Merge-gate checks never recorded (PostHog, Facebook in-app, Search Console) | P1 |
| Free calculator + first-run flow | PARTIAL | `src/lib/calculator/`, `src/lib/first-run/`, `src/lib/guest/` | V2 | #9, #17 | Preset errors KI-03; no tax input; fixed 30-day month | P0 |
| Finance engine | COMPLETE for Phase 1 scope | 22 modules + 7 test files in `src/lib/finance/` | V2 (coverage claim V0) | #6, #7 | Not connected to any stored ledger | P1 |
| Google sign-in, account store | PARTIAL | `src/app/auth/callback/route.ts`, `src/lib/account/`, `src/lib/supabase/` | V2 (accounts-off CI build) | #13 | Live two-account isolation KI-01; consent screen in Testing (docs) | P0 |
| Database + RLS (5 tables) | COMPLETE for slice 1 | `supabase/migrations/20261008180000_accounts_and_units.sql`, `tests/db/` | V3 | #12 | ERP tables not started | P1 |
| Plan gating, trial, entitlements | NOT STARTED | Only the unused `org_entitlements` table | V1 | — | Phase 7 by decision | P3 |
| Payments, billing | NOT STARTED | No Paymob code; static pricing page | V1 | — | Phase 4 | P3 |
| ERP: income/expense entry, periods, audit log | NOT STARTED (sample UI) | Entry points removed 2026-10-09; no tables | V1 | — | Blocked by Validation Gate | P1 |
| Reports, owner statements, payout import, smart entry | NOT STARTED (sample statement screen) | `src/components/statement/` | V1 | — | Phases 6–8 | P3 |
| Setup guide / Setup Kit | PARTIAL (prototype) | `src/components/guide/` with fixtures | V1 | — | Phase 3 | P3 |
| Pricing page | PARTIAL | `src/demo/fixtures/pricing.ts`, `src/components/pricing/` | V2 | #10; fix in #19 | Truthful availability labels; prices are SAMPLE | P0 |
| Analytics (anonymous counting) | PARTIAL | `src/app/api/e/route.ts`, `src/lib/analytics/` | V2 | #15, #17 | PostHog setup unverified; no rate limit KI-05; consent in #24 | P1 |
| Privacy page | PARTIAL | `src/components/privacy/` (AR+EN) | V2 | #13, #15 | Legal review; consent wording with #24 | P1 |
| Admin | NOT STARTED | No admin routes | V1 | — | — | P3 |
| Error handling, monitoring | NOT STARTED | No `error.tsx`/`global-error.tsx`; no SDK | V1 | — | PR C | P2 |
| PWA | NOT STARTED | Serwist not in `package.json` | V1 | — | PR C | P2 |
| Security hardening | PARTIAL | RLS, column grants, publishable key only, `src/lib/auth/next-path.ts`; no CSP/security headers | V1–V3 | — | KI-04, KI-05 | P1 |
| Automated tests | PARTIAL | 56 unit files in `src`, 4 DB files, 18 e2e specs, 4 Playwright configs | V2–V3 in CI | — | e2e and coverage not in CI KI-06 | P2 |
| CI/CD, deployment | PARTIAL | `.github/workflows/`, `vercel.json` (`dub1`) | V2–V3 | — | Required checks unenforceable KI-07; production unobserved | P1 |
| Documentation, developer experience | PARTIAL | `docs/`, this folder | V1 | #25 merged `dfba35e`; #26 merged `acc5596` | Compaction of `docs/PROGRESS.md`; Windows setup KI-09 | P2 |

## In progress — open draft PRs (based on `4e14ee2`; "checks" and "rls" green at these heads, checked 2026-10-12 to 2026-10-16; none merged; open state and heads re-confirmed against the live PR list 2026-10-17)
| PR | Head | Purpose | Gate stated in PR |
|---|---|---|---|
| [#19](https://github.com/amirshosha1/backdeskapp/pull/19) pricing truth | `deb0c80` | Label each plan feature "available / in development"; remove Setup Kit order action | Owner approval, Preview review |
| [#20](https://github.com/amirshosha1/backdeskapp/pull/20) account persistence | `3a7ab87` | Stop stale account data reappearing after sign-out; two-account matrix | Owner's two-account test |
| [#21](https://github.com/amirshosha1/backdeskapp/pull/21) delete-account tests | `3526b95` | RLS tests plus a **production migration** `20261012100000_preserve_fk_set_null.sql` that its description does not mention (KI-19) | Preview check, disposable account |
| [#22](https://github.com/amirshosha1/backdeskapp/pull/22) UX + beta gate | `64a009d` | Numeric entry in first-run; beta-gate doc | CI, AR/EN review at 360/768/1440 px |
| [#23](https://github.com/amirshosha1/backdeskapp/pull/23) 3BR presets | `ffa2f1f` | Baseline-aligned examples, laundry input, new share images | Owner approval |
| [#24](https://github.com/amirshosha1/backdeskapp/pull/24) analytics consent | `0ef9da6` | Signed 6 h consent cookie, route `/api/analytics-consent`, needs `ANALYTICS_CONSENT_SECRET`; edits two rule lines in `CLAUDE.md` (KI-21) | Phone + two-tab validation |

Merged since: #25 (`dfba35e`) and #26 (`acc5596`), documentation only. Simulated merge conflicts (`git merge-tree`, pairwise, 2026-10-16, before #26 merged): `docs/PROGRESS.md` (#19–#22, #24), `src/test/screens/landing.test.tsx` (#22 vs #23), `CLAUDE.md` (slimmed on `main` by #25 and #26; #24 edits lines that no longer exist there). Other pairs merge cleanly.

## Blockers
Validation Gate blocks Phase 5 · Phase 2 benchmarks wait on AirROI coverage spike + licence (`BUILD_PLAN.md` §6 Q4, Q10–Q15) · email sign-in needs a sending domain (Q1) · pre-orders need `NEXT_PUBLIC_PREORDER_URL` and a confirmed price (Q2, Q3).

## Remaining validation
See the "Not yet verified" table in `VERIFICATION.md`.
