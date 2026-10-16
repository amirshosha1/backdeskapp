# SESSION_HANDOFF

> Read this first (after `CLAUDE.md`). Updated at the end of every session by `/project-sync`.
> **Last updated:** 2026-10-16 · **Branch:** `claude/exciting-heisenberg-wvg7fl` · **Base:** `main` @ `4e14ee2` (identical at audit start; the memory-system files are uncommitted)

## 1. Project
Backdesk · باك ديسك — Arabic-first STR profit calculator growing into an accounting ERP. Next.js 16 + Supabase + Vercel. Repo `amirshosha1/backdeskapp`, site `backdeskapp.com`.

## 2. Verified state
- Shipped on `main`: landing, free calculator + first-run flow, finance engine (Phase 1), Google sign-in, up to 5 saved apartments with RLS, anonymous counting, privacy page. CI (checks + rls) green on `4e14ee2`.
- Not built: income/expense ledger, entitlements/gating, payments, reports, statements, import, PWA, error monitoring, admin.
- No production check has been recorded by anyone (`PROJECT_STATUS.md` evidence legend).
- Honest label: **calculator early access, not an operating ledger.**

## 3. Most recently completed
Audit + project memory system created 2026-10-16: slim `CLAUDE.md`, `.claude/context/*`, `/project-resume`, `/project-sync`. Previously: Batch 4 PR 2 landing (#17, merged 2026-10-11). Application code untouched.

## 4. Currently working on
Nothing mid-flight. Six **draft** stabilization PRs wait on Amir (#19 pricing truth, #20 stale account data, #21 delete-account tests, #22 UX + beta gate, #23 3BR presets, #24 analytics consent). All have green CI at their heads.

## 5. Unfinished
KI-01..KI-18 in `KNOWN_ISSUES.md`; tasks in `ROADMAP.md`. Biggest: unverified two-account isolation, preset double-count behind the landing example, claims vs shipped features, no security headers, e2e not in CI.

## 6. Next three actions
1. **Amir:** run the two-account Google test on a Preview and record it in PR #20/#21 (ROADMAP P0-1).
2. **Decide merge order for #19–#24**, merge `main` into each (no force-push), approve one at a time (P0-5). #23 (presets) and #19 (pricing truth) first; #24 only after `ANALYTICS_CONSENT_SECRET` is set and D-20 is reconciled.
3. **Claude, if asked:** P1-6 security headers + P2-1 e2e job in CI + P2-2 `.gitattributes` as one small, tested PR.

## 7. Blocked
Phase 5 (Validation Gate: 20 paid pre-orders) · Phase 2 benchmarks (AirROI spike + licence) · email sign-in (no domain/SMTP) · pre-orders (`NEXT_PUBLIC_PREORDER_URL`, price) · P1-3 (host review). Details: `PROJECT_STATUS.md`.

## 8. Decisions to preserve
Data entry free / outputs paid. Engine-only formulas, Decimal money. Headline profit after depreciation. Real data never labelled sample; sample screens carry the chip. Anonymous counting only until consent ships. Supabase project is production; migrations forward-only. Never merge/deploy without approval; squash merge. Full list: `DECISIONS.md`.

## 9. Read next, by task
| Task | Files |
|---|---|
| Calculator / presets | `src/lib/calculator/form.ts`, `src/lib/finance/scenario.ts`, `docs/FINANCIAL_BASELINE.md`, BUILD_PLAN §4 |
| Auth / accounts | `src/lib/account/`, `src/app/auth/callback/route.ts`, `docs/SETUP_AUTH.md`, `tests/db/rls.test.ts` |
| DB / RLS | `supabase/migrations/*.sql`, `tests/db/`, `docs/verify_after_migration.sql` |
| Analytics / privacy | `src/app/api/e/route.ts`, `src/lib/analytics/`, `docs/ANALYTICS.md`, `/privacy` messages |
| UI / i18n | `CLAUDE.md` §7 then `RULES_REFERENCE.md` §7, `messages/*.json` |
| Open PRs | `mcp__github__pull_request_read` on #19–#24 (bodies list files and gates) |

## 10. Avoid repeating
- Do not re-audit the repo; `PROJECT_STATUS.md` is current for `4e14ee2`. Use `git diff 4e14ee2..HEAD --stat` to see what moved.
- Do not read `docs/PROGRESS.md` (592 lines) or all of `docs/BUILD_PLAN.md` (735); `grep -n '^#'` and read one section.
- Do not list all workflow runs via the GitHub tool (output is huge); ask for `per_page: 1` and a branch filter.
- Production (`backdeskapp.com`) was unreachable from the cloud sandbox proxy; do not retry curl, use Vercel tools or ask Amir.
- Do not install dependencies just to check status: CI results on GitHub are the evidence of record.
