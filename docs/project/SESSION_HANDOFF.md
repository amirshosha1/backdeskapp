# SESSION_HANDOFF

> Model-independent continuation note. Rewritten at the end of each working session (procedure: `INDEX.md` §3).
> **Updated:** 2026-10-18 · **Code baseline:** `main` @ `72903c6` (PR #33, last commit that changed application code or CI) · **Git HEAD when written:** `main` @ `72903c6`.
> **This note is a snapshot.** Branch heads and PR states below were true on the date above; confirm them live before acting (freshness commands, and the GitHub PR list when available).
> **Freshness (run first):** `git fetch -q origin && git log --oneline 72903c6..origin/main -- . ':!docs' ':!.claude' ':!*.md' ':!.github/copilot-instructions.md'` (code commits only) and `git ls-remote origin 'refs/heads/*'`. A code commit on `main`, or a PR head different from `PROJECT_STATUS.md`, invalidates only the claims about what it touched.

## 1. Objective
A reliable, accurately labelled **Calculator Private Beta** (owner, 2026-10-18). No paid ERP functionality until the Validation Gate (D-02, D-21).

## 2. Verified state (details and evidence levels: `PROJECT_STATUS.md`, `VERIFICATION.md`)
On `main` @ `72903c6`: the landing page, the free calculator and first-run flow, the finance engine, Google sign-in, up to 5 saved apartments with RLS, anonymous counting and the privacy page. Since the previous note, these stabilization PRs merged:
- #20, stale account data after sign-out;
- #19, truthful pricing labels;
- #23, 3BR baseline presets;
- #31, deterministic accounts e2e;
- #22, inline first-run validation and the beta-gate doc;
- #33, the half-piastre tie fix.

Results on `72903c6`:
- **CI:** "CI / checks" and "Database tests / rls" green.
- **Local e2e:** main 308/308, preorder 1/1, analytics 8/8, accounts 14/14.
- **Production:** not verified by an agent (Vercel API 403, site unreachable from the sandbox).

Still not built: the stored income/expense ledger, plan gating, payments, reports, statements, import, PWA, error monitoring and admin.

## 3. Recently completed (2026-10-18)
- **#33** fixed `scenarioView` moving a typed or exact line by one piastre in half-piastre ties of opposite sign. This was the intermittent property failure, and it also failed `main` CI on `0d68a58`.
  - The owner approved the presentation exception (D-24).
  - Engine precision is deferred (D-25, KI-22, issue #34).
  - **#32**, a test-only workaround, was closed as superseded.
- **Main CI on `0d68a58` failed once.** The cause was that property, not #22. It passed on `72903c6`, and the property file then passed 50 local runs in a row.

## 4. Active task
None approved. Open PRs (live list 2026-10-18), all draft:
- **#21** delete-account security, **BLOCKED** until the real backup/restore and disposable-account acceptance are verified (KI-19 migration).
- **#24** analytics consent.
- **#29** competitor roadmap (docs).
- **#30** backup drill, which needs a separate merge approval and a separate production-run approval.

## 5. Remaining work
`ROADMAP.md` and `KNOWN_ISSUES.md` (KI-01..KI-22).

## 6. Blockers
- **Private Beta:** the two-account Google test (KI-01) and the real-phone review in Arabic and English, both NOT TESTED; a production deployment check of `72903c6` (owner, Vercel); #30 then a production drill run before #21.
- **Later phases:** the Validation Gate for Phase 5, the AirROI spike for benchmarks, a sending domain for email sign-in, and the pre-order URL and price.

## 7. Next three actions
1. Owner: confirm Vercel Production serves `72903c6`, then run the two-account Google test and the Arabic/English phone review on Production or a Preview (`VERIFICATION.md` "Not yet verified").
2. #30: merge `main` into it and re-run its CI. If the owner approves, mark it ready and squash-merge it alone. Only with a separate approval, run `docs/BACKUP_DRILL.md` → "Running it" (the file exists on #30's branch until it merges) and record the result.
3. #21: only after the drill and disposable-account acceptance pass, review its migration alone (KI-19). Merge it alone, then the owner runs `docs/verify_after_migration.sql`.

## 8. Files for the next task
| Task | Read |
|---|---|
| Any PR review | `git diff origin/main...origin/<branch> --stat`, then only those files; `KNOWN_ISSUES.md` |
| Backup drill (#30) | `docs/BACKUP_DRILL.md`, `.github/workflows/db-backup-drill.yml`, `scripts/backup-drill/` on its branch |
| Calculator display / rounding | `src/lib/finance/scenario-view.ts` and its test, `DECISIONS.md` D-24/D-25, issue #34 |
| Accounts / RLS | `src/lib/account/`, `supabase/migrations/`, `tests/db/rls.test.ts`, `ARCHITECTURE.md` |

## 9. Verification required
Before merging any PR: "CI / checks" and "Database tests / rls" green on its final head, merged with current `main`, plus the PR-specific manual check in `VERIFICATION.md`. CI does not run the main Playwright config (KI-06), so run `pnpm test:e2e` locally for UI changes. After any migration: `docs/verify_after_migration.sql`.

## 10. Decisions to preserve
- Data entry free / outputs paid.
- All numbers from `src/lib/finance/`; Decimal money; `ROUND_HALF_UP`; the D-24 tie exception is display-only.
- Headline profit is after depreciation.
- Real data is never labelled sample.
- Anonymous counting only until consent ships.
- The Supabase project is production; migrations are forward-only.
- No merge, deploy or commit without the owner's approval.
- `AGENTS.md` is the canonical entry (D-23).

Full list: `DECISIONS.md`.

## Avoid repeating
- Do not trust this note's PR states without the live check.
- Do not change decimal.js precision or the rounding mode without a new owner decision (D-25).
- `backdeskapp.com` and the Vercel team API are unreachable from the cloud sandbox: production status must come from the owner.
- A property-test failure is a finding, not a flake: capture the seed (fast-check prints it) before re-running.

## Strategy documentation task — 2026-10-19

Documentation-only proposal based on `main` @ `1321766`; the older snapshot above has not been reverified by this task. [Strategy index](../strategy/README.md) records the supplied war-room preview's version distinction and the missing full sources. No strategy approval, gate completion or production readiness is inferred. Next: import full v1.1/v1.2 sources and obtain the owner's explicit strategy review using [REVIEW.md](../strategy/REVIEW.md). Keep this documentation PR draft until its source-import checklist is complete. Runtime, migrations and CI configuration are outside this task.
