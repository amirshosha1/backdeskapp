# ROADMAP — by priority and dependency

> **Committed** = already decided by Amir in `docs/BUILD_PLAN.md`, `docs/PROGRESS.md` or an open PR. **REC** = recommendation from the 2026-10-16 audit, not yet approved. Status: TODO / IN PR / BLOCKED / DONE. Phase detail and acceptance of later phases live in `docs/BUILD_PLAN.md` §5; only the first actionable steps are expanded here.

## P0 — stop-ship for putting real users on it
| ID | Task | Scope | Status | Depends on | Acceptance | Where |
|---|---|---|---|---|---|---|
| P0-1 | Verify account isolation on hosted Preview (two Google accounts: guest unit survives reload, adopts once, appears on 2nd device, never visible to B; delete-account cancel/confirm/reload) | Committed (PR #20, #21) | TODO (Amir) | Preview with accounts on | Results recorded in PR #20/#21; no cross-account read | `src/lib/account/store.ts`, `tests/db/rls.test.ts` |
| P0-2 | Fix landing example / presets before promoting the Facebook link (furniture double count, 18 nights) | Committed (PR #23) | IN PR | Amir approves baseline changes | Preset equals `FINANCIAL_BASELINE` figures; engine worked examples A–K unchanged; `pnpm og:render` re-run and share-image test green | `src/lib/landing/example.ts`, `docs/FINANCIAL_BASELINE.md` |
| P0-3 | Make pricing/claims truthful (available vs in development) | Committed (PR #19) | IN PR | — | Every plan feature labelled; no order action for unbuilt kit; prices still SAMPLE | `src/demo/fixtures/pricing.ts`, `messages/*.json` |
| P0-4 | Protect production data before real users: paid Supabase plan (backups), tighten redirect URLs, publish Google consent screen | Committed for launch (CLAUDE.md §5); **REC: pull forward to before any beta with real data** | TODO (Amir) | Amir approval (cost) | Backups visible in dashboard; redirect list = `/auth/callback` only; `docs/verify_after_migration.sql` PASS | `docs/SETUP_AUTH.md` |
| P0-5 | Agree merge order for PRs #19–#24 and resolve `docs/PROGRESS.md` conflicts | REC | TODO | P0-1..3 | Each PR rebased by merge commit (no force-push), CI green, squash-merged with Amir's approval | KI-10 |

## P1 — essential product functionality
| ID | Task | Scope | Status | Depends on | Acceptance | Where |
|---|---|---|---|---|---|---|
| P1-1 | Analytics consent + accepted-session identity (reconcile with PR C design) | Committed (PR #24, PR C Q2–Q5 open) | IN PR | `ANALYTICS_CONSENT_SECRET` set; Amir answers PR C Q2–Q5 | Phone + two-tab validation; PostHog EU shows IDs for accepted vs count-only; privacy page matches | `src/app/api/e/route.ts`, `docs/ANALYTICS.md` |
| P1-2 | Batch 4 PR 3: in-app browser hardening, fix `/demo`→`/demo/start` bounce for signed-in users | Committed | TODO | — | Sheet warns apartment stays in app browser; Telegram/WebView detected; iOS and Units-gate tests exist | `src/lib/browser/in-app.ts` |
| P1-3 | Complete P.2 + Phase 2 Free calculator (tax input, real month length, break-even ADR/sensitivity on screen); host review with 3–5 hosts first | Committed | BLOCKED on host review | Amir recruits hosts | Per BUILD_PLAN Phase 2 acceptance | `src/lib/calculator`, `docs/BUILD_PLAN.md` §5 |
| P1-4 | Run the pre-order campaign: set `NEXT_PUBLIC_PREORDER_URL`, confirm price | Committed | BLOCKED (Amir) | Q2, Q3 | Pre-order button live; payments tracked outside app | BUILD_PLAN §6 |
| P1-5 | ⛔ Validation Gate → Phase 5 ERP core (transactions, expenses/income, audit_log, period locks, invitations) | Committed | BLOCKED | 20 paid pre-orders and the exact gate line | New migration(s) with RLS + `pnpm test:db`; add-expense ≤4 taps; closed-period immutability | `docs/BUILD_PLAN.md` §3, Phase 5 |
| P1-6 | Security headers (CSP, frame-ancestors, Referrer-Policy, Permissions-Policy) | REC | TODO | — | `curl -I` on Preview shows them; app and Google sign-in still work; e2e passes | `next.config.ts` (KI-04) |

## P2 — reliability, performance, quality
| ID | Task | Scope | Status | Acceptance | Where |
|---|---|---|---|---|---|
| P2-1 | e2e job + `test:coverage` in CI | REC | TODO | Main-config Playwright and ≥95% finance coverage run on PRs; time budget noted | `.github/workflows/ci.yml` (KI-06) |
| P2-2 | `.gitattributes` for LF; document Windows setup; fix Vitest start on Windows | REC | TODO | Fresh Windows clone passes `pnpm test` | KI-09 |
| P2-3 | Rate limiting for `/api/e` | REC | TODO | Burst test returns 429/204 without forwarding | KI-05 |
| P2-4 | PWA (Serwist) + error boundary + error tracking (PR C remainder) | Committed (PR C) | TODO | Installable on Android; unhandled errors captured without PII | BUILD_PLAN Phase 0a/PR C |
| P2-5 | Compact `docs/PROGRESS.md` (592 lines, mostly closed decisions) into an archive + short live file | REC (needs permission) | TODO | Live file < 150 lines; archive keeps every dated decision | Phase 6 of this audit |
| P2-6 | Move signed-in app out of `/demo`; revisit robots/noindex | Committed (open decision) | TODO | `/demo` = visitor demo only | KI-14, KI-15 |
| P2-7 | Create `docs/LAUNCH.md` | Committed (Phase 10) | TODO | Landing + launch checklist | KI-13 |

## P3 — later
Phases 6 (payout import), 7 (reports, owner statements, entitlements/trial/gating), 8 (smart entry), 4 (Paymob + legal), 10 (hardening), 🚀 launch, 9 (growth). All Committed, all NOT STARTED, sequence fixed in `CLAUDE.md` §8. Benchmarks (Phase 2) wait on AirROI coverage spike and licensing. Parking lot (do not build): `docs/BUILD_PLAN.md` §7.
