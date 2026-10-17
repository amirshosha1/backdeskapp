# SESSION_HANDOFF

> Model-independent continuation note. Rewritten at the end of each working session (procedure: `INDEX.md` §3).
> **Updated:** 2026-10-17 (second update, branch `docs/roadmap-competitor-features`, PR #29) · **Code baseline:** `main` @ `8dafab0` (#20, the last code commit; verified with `git log origin/main`) · **Git HEAD of `main` when written:** `8dafab0`. The baseline is not the HEAD: HEAD moves with every documentation commit, the baseline only with code.
> **This note is a snapshot.** Branch heads and PR states below were true on the date above; confirm them live before acting (freshness commands, and the GitHub PR list when available).
> **Freshness (run first):** `git fetch -q origin && git log --oneline 8dafab0..origin/main -- . ':!docs' ':!.claude' ':!*.md' ':!.github/copilot-instructions.md'` (code commits only; documentation commits are expected) and `git ls-remote origin 'refs/heads/*'`. A code commit on `main`, or a PR head different from `PROJECT_STATUS.md`, invalidates only the claims about what it touched (`git diff --stat 8dafab0..origin/main`).

## 1. Objective
Move Backdesk from calculator early access toward a trustworthy product: land the six stabilization PRs safely, then close the hardening gaps, then the pre-order → Validation Gate → ERP path (`ROADMAP.md`).

## 2. Verified state (details and evidence levels: `PROJECT_STATUS.md`, `VERIFICATION.md`)
Shipped on `main`: landing, free calculator + first-run flow, finance engine, Google sign-in, ≤5 saved apartments with RLS, anonymous counting, privacy page. CI green on the baseline. Not built: stored income/expense ledger, plan gating, payments, reports, statements, import, PWA, error monitoring, admin. Nothing is verified in production.

## 3. Recently completed
Audit and project memory: PR #25 squash-merged into `main` as `dfba35e`; the agent-neutral restructure (root `AGENTS.md`, this folder, thin `CLAUDE.md` / `GEMINI.md` / Copilot pointers) is PR #26, squash-merged as `acc5596` (documentation only; no application code, migration or workflow touched). A compatibility test from a fresh session loaded `CLAUDE.md` and `AGENTS.md` automatically. Post-merge sync: this note, `PROJECT_STATUS.md`, `ROADMAP.md`, the stale startup instructions in `BUILD_PLAN.md` / `PROGRESS.md` and the resume procedure were updated in a documentation-only PR.

## 4. Active task
**Next task = F2, break-even nights this month** (first of the P.2 roadmap slice, build order F2 → F3 → F1; D-25). Not started: start with the standard phase prompt for P.2 "remaining items" (plan first, wait for approval). Roadmap docs are in PR #29 (docs only, draft, awaiting owner review). PR #20 merged (`8dafab0`, verified by `git log`); the states of #19, #21–#24 were not re-checked this session (live GitHub list needed).

**Approved decisions (2026-10-17, `DECISIONS.md` D-24..D-27):**
- D3 → D-24: F2 is Free for the current month only; RevPAR and profit margin stay Pro (BUILD_PLAN §2, Phase 7 gating; question 21 closed).
- D4 → D-25: build order F2 → F3 → F1; F1 time-boxed to 3 working days, blocked until real anonymised Airbnb (Q7) and Booking.com (Q20) samples exist.
- D5 → D-26: F8 keeps the existing roll-up rule (cells under 30 roll up; "limited sample" only at the national fallback).
- D-27: commissions computed, not stored, before statement finalization; dynamic pricing recorded in BUILD_PLAN §7 only; INDEX lists COMPETITORS and IDEAS.
- **D1 and D2 were named in the request but not defined**; nothing is recorded under those labels. Confirm what they were.
- **I13 (referral) is pending**: unscheduled in `docs/IDEAS.md`; overlaps the Phase 9 referral line in BUILD_PLAN. No decision recorded.

## 5. Remaining work
`ROADMAP.md` (Part A approved, Part B recommended) and `KNOWN_ISSUES.md` KI-01..KI-21. Newest findings: PR #21 ships a production migration its description omits (KI-19); PR #24 edits rule lines that moved (KI-21).

## 6. Blockers
**Q7 (real anonymised Airbnb earnings CSV) and Q20 (real anonymised Booking.com payout export)** block F1 only; F2 and F3 are not blocked. Also: Validation Gate (20 paid pre-orders) for Phase 5 · AirROI coverage spike and licence for benchmarks · sending domain for email sign-in · pre-order URL and price · host review.

## 7. Next three actions
1. Owner: review PR #29 (docs only); then approve the F2 plan (P.2 remaining items, break-even nights this month: BUILD_PLAN §8, `src/lib/finance/scenario-view.ts`, `breakeven.ts`).
2. Owner: provide the Q7 and Q20 sample files (guest names removed) so F1 can start after F2 and F3.
3. Owner: run the two-account Google test on a Preview (`VERIFICATION.md`); merge the remaining stabilization PRs one at a time, never without approval (`ROADMAP.md` P0-5; #20 is done).

## 8. Files for the next task
| Task | Read |
|---|---|
| Any PR review | `git diff origin/main...origin/<branch> --stat`, then only those files; `KNOWN_ISSUES.md` |
| Hardening PR | `next.config.ts`, `.github/workflows/ci.yml`, `OPERATIONS.md`, `KNOWN_ISSUES.md` KI-04/05/06/09 |
| F2 / F3 (P.2 slice) | `BUILD_PLAN.md` §8 and §4.3, `src/lib/finance/{scenario-view,breakeven,kpis}.ts`, `D-24`, `D-25` |
| Presets / calculator | `src/lib/calculator/form.ts`, `src/demo/sample-data/calculator-presets.ts`, `docs/FINANCIAL_BASELINE.md` |
| Accounts / RLS | `src/lib/account/`, `supabase/migrations/`, `tests/db/rls.test.ts`, `ARCHITECTURE.md` |

## 9. Verification required
Before merging any PR: its CI jobs green on the merged head, plus the PR-specific manual check in `VERIFICATION.md`. After any migration: `docs/verify_after_migration.sql`. Documentation changes: paths and cross-references resolve.

## 10. Decisions to preserve
Data entry free / outputs paid · all numbers from `src/lib/finance/`, Decimal money · headline profit after depreciation · real data never labelled sample · anonymous counting only until consent ships · Supabase project is production, migrations forward-only · no merge, deploy or commit without the owner's approval · `AGENTS.md` is the canonical entry (D-23). Full list: `DECISIONS.md`.

## Avoid repeating
Do not trust this note's PR states or heads without the live check; do not re-audit; do not read `docs/PROGRESS.md` or all of `docs/BUILD_PLAN.md`; use git (`ls-remote`, `merge-tree`, `diff --name-only`) before GitHub tools (their PR and workflow outputs are very large); `backdeskapp.com` is unreachable from the cloud sandbox; do not install dependencies to check status, CI is the evidence.
