# SESSION_HANDOFF

> Read this first (after `CLAUDE.md`). Rewritten at the end of every session by `/project-sync`.
> **Updated:** 2026-10-16 · **Work branch:** `claude/exciting-heisenberg-wvg7fl` (docs only; pushed) · **Code baseline:** `main` @ `4e14ee2`
> **Freshness check (run before trusting anything below):** `git fetch -q origin && git log --oneline 4e14ee2..origin/main` and `git ls-remote origin 'refs/heads/*'`. A new commit on `main` or a changed PR head (heads are listed in `PROJECT_STATUS.md`) means the affected facts are stale: re-verify them, then fix the file.

## 1. Project
Backdesk · باك ديسك — Arabic-first STR profit calculator growing into an accounting ERP. Next.js 16 + Supabase + Vercel. Repo `amirshosha1/backdeskapp`, site `backdeskapp.com`.

## 2. Verified state
- On `main`: landing, free calculator + first-run flow, finance engine (Phase 1), Google sign-in, ≤5 saved apartments with RLS, anonymous counting, privacy page. CI (checks + rls) green on `4e14ee2`.
- Not built: income/expense ledger, entitlements/gating, payments, reports, statements, import, PWA, error monitoring, admin.
- No production check has been recorded by anyone. Label to use: **calculator early access, not an operating ledger.**

## 3. Most recently completed
Audit and project memory system (2026-10-16): slim `CLAUDE.md`, `.claude/context/*`, `/project-resume`, `/project-sync`; stale lines in `docs/PROGRESS.md` and a `pnpm dev` contradiction in `CLAUDE.md` fixed. Before that: landing page #17 (2026-10-11). Application code untouched.

## 4. In progress
Docs-only PR [#25](https://github.com/amirshosha1/backdeskapp/pull/25) (this branch to `main`) awaits Amir's approval. Six draft stabilization PRs wait on Amir (#19–#24; table with heads in `PROJECT_STATUS.md`). Nothing is mid-edit.

## 5. Unfinished
`KNOWN_ISSUES.md` (KI-01..KI-20) and `ROADMAP.md`. Newest finding: PR #21 contains an unannounced production migration (KI-19).

## 6. Next three actions
1. **Amir:** approve the docs PR; run the two-account Google test on a Preview and record it in PR #20/#21 (ROADMAP P0-1).
2. **Merge in order, one at a time, never without approval:** #25 → #20 → #21 (migration: review first, then Amir runs `docs/verify_after_migration.sql`) → #19 → #23 → #22 → #24 (needs `ANALYTICS_CONSENT_SECRET`; port its `CLAUDE.md` edits). Merge `main` into the next PR after each.
3. **Claude, next dev task:** one small hardening PR touching files no open PR touches: security headers in `next.config.ts`, an e2e + coverage job in `.github/workflows/ci.yml`, `.gitattributes` (LF) (ROADMAP P1-6, P2-1, P2-2).

## 7. Blocked
Phase 5 (Validation Gate: 20 paid pre-orders) · Phase 2 benchmarks (AirROI spike + licence) · email sign-in (no domain/SMTP) · pre-orders (`NEXT_PUBLIC_PREORDER_URL`, price) · host review (P1-3).

## 8. Decisions to preserve
Data entry free / outputs paid. Engine-only formulas, Decimal money. Headline profit after depreciation. Real data never labelled sample. Anonymous counting only until consent ships. Supabase project is production; migrations forward-only and applied on merge. Never merge or deploy without approval; squash merge. Full list: `DECISIONS.md`.

## 9. Read next, by task
| Task | Files |
|---|---|
| Calculator / presets | `src/lib/calculator/form.ts`, `src/demo/sample-data/calculator-presets.ts`, `docs/FINANCIAL_BASELINE.md`, BUILD_PLAN §4 |
| Auth / accounts | `src/lib/account/`, `src/app/auth/callback/route.ts`, `docs/SETUP_AUTH.md`, `tests/db/rls.test.ts` |
| DB / RLS | `supabase/migrations/*.sql`, `tests/db/`, `docs/verify_after_migration.sql` |
| Analytics / privacy | `src/app/api/e/route.ts`, `src/lib/analytics/`, `docs/ANALYTICS.md` |
| UI / i18n | `CLAUDE.md` §7, then `RULES_REFERENCE.md` §7, `messages/*.json` |
| A stabilization PR | its branch diff: `git diff origin/main...origin/<branch> --stat`, then only those files |

## 10. Avoid repeating
- Do not re-audit; `PROJECT_STATUS.md` is the baseline. Use the freshness check above.
- Do not read `docs/PROGRESS.md` (592 lines) or all of `docs/BUILD_PLAN.md` (735); `grep -n '^#'`, read one section.
- GitHub tool outputs are huge for workflow runs and PR lists with bodies; use git (`ls-remote`, `merge-tree`, `diff --name-only`) first, GitHub tools with `per_page: 1` only when git cannot answer.
- `backdeskapp.com` is unreachable from the cloud sandbox proxy; use Vercel tools or ask Amir.
- Do not install dependencies to check status: CI on GitHub is the evidence of record.
