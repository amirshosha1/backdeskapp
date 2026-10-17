# SESSION_HANDOFF

> Model-independent continuation note. Rewritten at the end of each working session (procedure: `INDEX.md` §3).
> **Updated:** 2026-10-17 · **Code baseline and live `main` when checked:** `8dafab0` (#20 account persistence; recheck before acting). This PR branch also contains the account deletion changes from #21.
> **This note is a snapshot.** Branch heads and PR states below were true on the date above; confirm them live before acting (freshness commands, and the GitHub PR list when available).
> **Freshness (run first):** `git fetch -q origin && git log --oneline 8dafab0..origin/main -- . ':!docs' ':!.claude' ':!*.md' ':!.github/copilot-instructions.md'` (code commits only; documentation commits are expected) and `git ls-remote origin 'refs/heads/*'`. A code commit on `main`, or a PR head different from `PROJECT_STATUS.md`, invalidates only the claims about what it touched (`git diff --stat 8dafab0..origin/main`).

## 1. Objective
Move Backdesk from calculator early access toward a trustworthy product: land the six stabilization PRs safely, then close the hardening gaps, then the pre-order → Validation Gate → ERP path (`ROADMAP.md`).

## 2. Verified state (details and evidence levels: `PROJECT_STATUS.md`, `VERIFICATION.md`)
Shipped on `main`: landing, free calculator + first-run flow, finance engine, Google sign-in, ≤5 saved apartments with RLS, anonymous counting, privacy page. CI green on the baseline. Not built: stored income/expense ledger, plan gating, payments, reports, statements, import, PWA, error monitoring, admin. Nothing is verified in production.

## 3. Recently completed
Audit and project memory: PR #25 squash-merged into `main` as `dfba35e`; the agent-neutral restructure (root `AGENTS.md`, this folder, thin `CLAUDE.md` / `GEMINI.md` / Copilot pointers) is PR #26, squash-merged as `acc5596` (documentation only; no application code, migration or workflow touched). A compatibility test from a fresh session loaded `CLAUDE.md` and `AGENTS.md` automatically. Post-merge sync: this note, `PROJECT_STATUS.md`, `ROADMAP.md`, the stale startup instructions in `BUILD_PLAN.md` / `PROGRESS.md` and the resume procedure were updated in a documentation-only PR.

## 4. Active task
PR #21 only: `main` @ `8dafab0` was merged into its existing Draft branch; the `docs/PROGRESS.md` conflict retained both account-persistence and account-deletion entries. The branch adds the original `20261012100000_preserve_fk_set_null.sql` and a forward-only follow-up `20261017142500_guard_shared_org_deletion.sql` addressing the independent review's nested-writer, concurrent-deletion and last-manager findings. Both are production migrations requiring an approved backup procedure and explicit owner approval before merge. The prior pushed head `804b5ea` passed CI and disposable database tests, but does not contain the follow-up fixes. Recheck the final pushed head and CI. Hosted Google Auth, production migration and Preview acceptance were not tested.

## 5. Remaining work
`ROADMAP.md` (Part A approved, Part B recommended) and `KNOWN_ISSUES.md` KI-01..KI-21. Newest findings: PR #21 needs final-head verification and production migration gates (KI-19); PR #24 edits rule lines that moved (KI-21).

## 6. Blockers
Validation Gate (20 paid pre-orders) for Phase 5 · AirROI coverage spike and licence for benchmarks · sending domain for email sign-in · pre-order URL and price · host review.

## 7. Next three actions
1. Owner: run the two-account Google test and account deletion on a Preview (`VERIFICATION.md` "Not yet verified").
2. Merge one at a time, never without approval: #20 → #21 (review the migration alone; owner runs `docs/verify_after_migration.sql`) → #19 → #23 → #22 → #24. Merge `main` into the next PR each time (`ROADMAP.md` P0-5).
3. Next development task (recommended, not approved): one small hardening PR in files no open PR touches: security headers (`next.config.ts`), an e2e + coverage CI job, `.gitattributes` (P1-6, P2-1, P2-2).

## 8. Files for the next task
| Task | Read |
|---|---|
| Any PR review | `git diff origin/main...origin/<branch> --stat`, then only those files; `KNOWN_ISSUES.md` |
| Hardening PR | `next.config.ts`, `.github/workflows/ci.yml`, `OPERATIONS.md`, `KNOWN_ISSUES.md` KI-04/05/06/09 |
| Presets / calculator | `src/lib/calculator/form.ts`, `src/demo/sample-data/calculator-presets.ts`, `docs/FINANCIAL_BASELINE.md` |
| Accounts / RLS | `src/lib/account/`, `supabase/migrations/`, `tests/db/rls.test.ts`, `ARCHITECTURE.md` |

## 9. Verification required
Before merging any PR: its CI jobs green on the merged head, plus the PR-specific manual check in `VERIFICATION.md`. After any migration: `docs/verify_after_migration.sql`. Documentation changes: paths and cross-references resolve.

## 10. Decisions to preserve
Data entry free / outputs paid · all numbers from `src/lib/finance/`, Decimal money · headline profit after depreciation · real data never labelled sample · anonymous counting only until consent ships · Supabase project is production, migrations forward-only · no merge, deploy or commit without the owner's approval · `AGENTS.md` is the canonical entry (D-23). Full list: `DECISIONS.md`.

## Avoid repeating
Do not trust this note's PR states or heads without the live check; do not re-audit; do not read `docs/PROGRESS.md` or all of `docs/BUILD_PLAN.md`; use git (`ls-remote`, `merge-tree`, `diff --name-only`) before GitHub tools (their PR and workflow outputs are very large); `backdeskapp.com` is unreachable from the cloud sandbox; do not install dependencies to check status, CI is the evidence.
