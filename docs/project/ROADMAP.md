# ROADMAP — by priority and dependency

> **Part A is approved scope** (decided by the owner in `docs/BUILD_PLAN.md`, `docs/PROGRESS.md` or an open PR). **Part B is recommendations** from the 2026-10-16 audit: not approved, do not start without the owner's go-ahead. Task IDs are stable; never reuse one. Status: TODO · IN PR · BLOCKED · DONE. Phase scope and acceptance for Phases 2–10: `docs/BUILD_PLAN.md` §5 (indexed in `PRODUCT_SCOPE.md`).
> P0 security/data-integrity/release blockers · P1 essential product · P2 reliability and quality · P3 later.

## Part A — approved scope
| ID | Pri | Task | Status | Depends on | Acceptance | Code / doc refs |
|---|---|---|---|---|---|---|
| P0-1 | P0 | Verify account isolation on a hosted Preview with two Google accounts, and account deletion on a disposable account | TODO (owner) | Preview with accounts on | Guest unit survives reload, adopts once, shows on a second device, never visible to the other account; deletion leaves the other account intact; results recorded in PRs #20, #21 | `src/lib/account/store.ts`, `tests/db/rls.test.ts`, `VERIFICATION.md` |
| P0-2 | P0 | Correct the presets behind the landing example (furniture counted twice, 18 booked nights) | IN PR #23 | Owner approves baseline figures | Presets equal `docs/FINANCIAL_BASELINE.md`; worked examples A–K unchanged; `pnpm og:render` re-run, share-image test green | `src/demo/sample-data/calculator-presets.ts`, `src/lib/landing/example.ts`, KI-03 |
| P0-3 | P0 | Make pricing claims truthful (available vs in development) | IN PR #19 | — | Every plan feature labelled; no order action for an unbuilt kit; prices still SAMPLE | `src/demo/fixtures/pricing.ts`, `messages/*.json`, KI-02 |
| P0-4 | P0 | Before launch: paid Supabase plan with backups, redirect URLs reduced to `/auth/callback`, Google consent screen published | TODO (owner; costs money) | Owner approval | Backups visible in the dashboard; `docs/verify_after_migration.sql` all PASS | `docs/SETUP_AUTH.md`, KI-12 |
| P1-1 | P1 | Analytics consent and accepted-session identity (reconcile with the planned PR C design, D-20) | IN PR #24 | `ANALYTICS_CONSENT_SECRET` set; PR C questions 2–5 answered (`docs/PROGRESS.md` "PR C open questions") | Phone and two-tab validation; PostHog EU shows IDs for accepted vs count-only events; privacy page matches; KI-21 edits ported | `src/app/api/e/route.ts`, `docs/ANALYTICS.md` |
| P1-2 | P1 | Batch 4 PR 3: in-app browser hardening; fix the `/demo` → `/demo/start` bounce for signed-in users | TODO | — | Sheet warns the apartment stays in the app browser; Telegram/generic WebView detected; iOS and Units-gate tests | `src/lib/browser/in-app.ts` |
| P1-3 | P1 | P.2 remainder and Phase 2 (tax input, real month length, break-even ADR and sensitivity on screen), after a host review with 3–5 hosts | BLOCKED (owner recruits hosts) | Host review | Phase 2 "Acceptance" in BUILD_PLAN | `src/lib/calculator/`, BUILD_PLAN Phase 2 |
| P1-4 | P1 | Pre-order campaign: set `NEXT_PUBLIC_PREORDER_URL`, confirm Pro price | BLOCKED (owner) | BUILD_PLAN §6 Q2, Q3 | Pre-order button live; payments tracked outside the app | `.env.example` |
| P1-5 | P1 | ⛔ Validation Gate, then Phase 5 ERP core (transactions, entry, `audit_log`, period locks, invitations) | BLOCKED | 20 paid pre-orders and the exact gate line | New migrations with RLS and `pnpm test:db`; add-expense ≤4 taps; closed periods immutable | BUILD_PLAN §3 and Phase 5 |
| P2-4 | P2 | PR C remainder: PWA (Serwist), error boundary, error tracking | TODO | P1-1 | Installable on Android; unhandled errors captured without PII | BUILD_PLAN Phase 0a |
| P2-6 | P2 | Move the signed-in app out of `/demo`; revisit `robots.txt` vs `noindex` | TODO (open decision) | — | `/demo` is the visitor demo only | KI-14, KI-15 |
| P2-7 | P2 | Create `docs/LAUNCH.md` | TODO | — | Includes the landing checklist from BUILD_PLAN Phase 10 | KI-13 |
| P3-1 | P3 | Phases 6 (payout import), 7 (reports, owner statements, entitlements, trial, gating), 8 (smart entry), 4 (payments, legal), 10 (hardening), launch, 9 (growth) | NOT STARTED | Sequence in `AGENTS.md` §8 | Per-phase acceptance in BUILD_PLAN | BUILD_PLAN §5 |

## Part B — recommendations (not approved)
| ID | Pri | Task | Status | Depends on | Acceptance | Refs |
|---|---|---|---|---|---|---|
| REC-0 | P0 | Pull P0-4's backups forward to before any beta with real user data | TODO (owner decision) | Owner approval | As P0-4 | KI-12 |
| P0-5 | P0 | Merge order (#25 is merged): #26 → #20 → #21 → #19 → #23 → #22 → #24, one at a time. Why: #26 first because it is documentation and conflicts only with #24; #20 is a small isolation fix; #21 carries a migration and must go alone; #19 is small; #23 before #22 (both touch `landing.test.tsx`; #22's gate table waits on presets); #24 last (needs the secret, edits rule lines, open design question D-20). After each merge, merge `main` into the next PR (no force-push) and keep both sides of `docs/PROGRESS.md` | TODO | P0-1..3 | Each PR green on its merged head, squash-merged with owner approval | KI-10 |
| P0-6 | P0 | Review PR #21's migration as a production migration: correct its description, confirm the trigger-depth condition cannot be reached by a user UPDATE, merge alone, then the owner runs `docs/verify_after_migration.sql` | TODO | P0-5 order | `pnpm test:db` green; verify SQL all PASS; `src/types/database.ts` current | KI-19 |
| P1-6 | P1 | Security headers (CSP, frame-ancestors, Referrer-Policy, Permissions-Policy) | TODO | — | `curl -I` on a Preview shows them; sign-in and e2e still pass | `next.config.ts`, KI-04 |
| P2-1 | P2 | e2e job (main config) and `test:coverage` in CI | TODO | — | Both run on pull requests within an agreed time budget | `.github/workflows/ci.yml`, KI-06 |
| P2-2 | P2 | `.gitattributes` forcing LF; document Windows setup; fix Vitest start on Windows | TODO | — | Fresh Windows clone passes `pnpm test` | KI-09 |
| P2-3 | P2 | Rate limiting for `/api/e` | TODO | Design with P1-1 | Burst test is throttled without forwarding | `src/app/api/e/route.ts`, KI-05 |
| P2-5 | P2 | Compact `docs/PROGRESS.md` (592 lines) into a short live file plus a dated archive | TODO (needs permission; nothing deleted) | — | Live file under 150 lines; every dated decision kept in the archive | KI-08 |
| P2-8 | P2 | If #24 merges: port its two rule-line edits into `docs/project/ARCHITECTURE.md` (stack line), `docs/project/UX_RULES.md` (analytics bullet) and `AGENTS.md` §7 | TODO | #24 merged | Rule text matches `docs/ANALYTICS.md` | KI-21 |
| P2-9 | P2 | Verify the agent entry points (`AGENTS.md`, `CLAUDE.md` `@` import, `GEMINI.md`, Copilot instructions) in each real tool | TODO | A person with each tool | `VERIFICATION.md` rows added | `docs/project/INDEX.md` |
