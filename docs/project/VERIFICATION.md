# VERIFICATION — what has been checked, how, and on which commit

> A green CI run is not production behaviour. Every status claim in `PROJECT_STATUS.md` carries one of the levels below. Add a row here when a check is run; never upgrade a level without evidence. Dates are `YYYY-MM-DD`.

## Levels
| Level | Meaning | Typical evidence |
|---|---|---|
| V0 | Not verified | Claim from a document or PR description only |
| V1 | Source reviewed | An agent or person read the code |
| V2 | Unit/property tests + build green | CI job "checks" (lint, typecheck, `pnpm test`, `pnpm build`, `pnpm check:bundle`) |
| V3 | Database/RLS tests green | CI job "rls" (`pnpm test:db`, throwaway Postgres, never the hosted project) |
| V4 | Browser e2e green | Playwright config named in the row; not run in CI today (KI-06) |
| V5 | Manual acceptance | A person checked it on a Preview or phone and recorded the result |
| V6 | Production verified | Observed on `https://backdeskapp.com` or the hosted Supabase project |

## Record
| Date | Check | Applies to | Result | Evidence |
|---|---|---|---|---|
| 2026-10-16 | Source review of routes, migration, finance modules, workflows, `package.json` (V1) | `main` @ `4e14ee2` | Done; findings in `KNOWN_ISSUES.md` | This audit |
| 2026-10-11 | CI "checks" (V2) | `main` @ `4e14ee2` | Pass | Actions run 38102385249 |
| 2026-10-11 | CI "rls" (V3) | `main` @ `4e14ee2` | Pass | Actions run 38102385226 |
| 2026-10-10/11 | Unit tests 547, DB tests 88, e2e main 157 / accounts 8 / analytics 8 / preorder 1 (V2–V4) | PR #17 branch before squash | Reported pass in the PR body; **not re-run** | PR #17 description |
| 2026-10-12/14 | CI "checks" + "rls" (V2, V3) | Heads of PRs #19–#24 (`deb0c80`, `3a7ab87`, `3526b95`, `64a009d`, `ffa2f1f`, `0ef9da6`) | Pass | Check runs on each PR |
| 2026-10-16 | CI "checks" + "rls" (V2, V3) | PR #25 (documentation only) | Pass | Actions runs 38981557863, 38981557924 |
| 2026-10-16 | Merge-conflict simulation, pairwise (`git merge-tree`) | PR heads above + PR #25 | Conflicts as listed in `PROJECT_STATUS.md` | Local command output |
| 2026-10-18 | CI "checks" + "rls" (V2, V3) | `main` @ `72903c6` (#33) | Pass | Actions runs 39134180568, 39134180652 |
| 2026-10-18 | CI "checks" (V2) | `main` @ `0d68a58` (#22) | **Fail**: `scenario-view.test.ts` property, fast-check seed 1850402200 (pre-existing tie defect, fixed by #33); "rls" pass | Actions runs 39131816021, 39131816020 |
| 2026-10-18 | Main Playwright 308/308; preorder 1/1; analytics 8/8; accounts 14/14 (V4, local Linux sandbox) | `main` @ `72903c6` | Pass | `pnpm test:e2e` and the three other configs, after `pnpm build`, in a worktree at `72903c6` |
| 2026-10-18 | Main Playwright 308/308; preorder 1/1; analytics 8/8 (V4, local Linux sandbox). The accounts config was **not** run locally on this SHA (CI "accounts-browser" passed) | `main` @ `0d68a58` | Pass | Same commands, in a worktree at `0d68a58` |
| 2026-10-18 | `scenario-view.test.ts` 50 consecutive runs (V2) | `main` @ `72903c6` | 0 failures | Local loop |
| 2026-10-18 | Property stress, 100 seeded batches × 10,000 cases (V2) | before #33 / with #33 | 26 of 100 batches failed / 1,000,000 cases, 0 failures | PR #33 description |
| 2026-10-18 | Coverage (`pnpm test:coverage`) | #33 head `8962539` (finance code = `72903c6`) | 99.66% lines overall; `scenario-view.ts` 100% branches | Local run |
| 2026-10-18 | Production deployment of `72903c6` (V6) | — | **Not verified by an agent** (Vercel API 403; site unreachable from the sandbox) | Owner to confirm |
| 2026-10-19 | Production backup drill, first production run (V6, partial database backup: auth, public, private) | Production Supabase, workflow on `main` @ `2d3f4b0` | Pass: 21 checks, no FAIL rows (owner-reported; run conclusion "success" confirmed via the GitHub API) | Actions run 39202267998; artifact `backdesk-partial-db-backup-39202267998` (39 KB, expires 2026-10-22 05:01 UTC) |
| 2026-10-19 | Main Playwright 309/309 (308 + new Tab-focus test); lint, typecheck, 593 unit tests, build, `check:bundle` (V2, V4, local Linux sandbox) | `main` @ `cdb5d93` + the `NumberFieldRow` fix (KI-24) | Pass | Local run; 308/308 on unmodified `cdb5d93` before the fix |
| 2026-10-19 | Exploratory calculator matrix in Chromium (V4): AR/EN baseline −12,215.30 with revenue + costs = net; exact-zero, −0.01 and +0.01 net; invalid input (empty, letters, negative, fraction, > 9 digits) marked invalid with the stale notice; Arabic-Indic and Persian digits; booked > available shows the data warning and caps occupancy at 100%; 9 pages × AR/EN × 360/768/1440 px with HTTP 200, no horizontal overflow, correct `dir`, no console errors or failed requests | Local production build of `main` @ `cdb5d93` | Pass, except KI-24 (fixed) and a cosmetic clip of a 10-digit headline at 360 px | Scripts and screenshots in the session scratchpad; summary in the PR |
| 2026-10-19 | Production site `backdeskapp.com` and Vercel Previews in a browser (V6) | — | **Blocked**: the cloud environment's network policy denies the host (proxy 403); the Vercel connector lists the project but returns 403 for deployments and aliases | Session log |

## Not yet verified (required before the matching claim can be made)
| Needed check | Level | Why it matters | Owner |
|---|---|---|---|
| Two Google accounts on a Preview: guest unit survives reload, adopts once, appears on a second device, never visible to the other account; sign-out then sign-in as another user | V5 | Isolation has only automated proof (KI-01) | Amir |
| Account deletion on a disposable account (cancel, confirm, reload, other account intact) | V5 | `delete_my_account()` is irreversible | Amir |
| After any migration: run `docs/verify_after_migration.sql` in the Supabase SQL editor | V6 | Migrations apply to production on merge | Amir |
| PostHog Live events show `landing_view`, `landing_cta_click`, `first_run_started`, `verdict_shown` with `env = production` and no IP | V6 | Landing merge gate was never recorded as checked | Amir |
| Landing in Facebook's in-app browser; Sharing Debugger "Scrape Again"; Search Console + sitemap | V5/V6 | Distribution channel | Amir |
| Arabic and English at 360, 768, 1440 px on a real phone (automated layout checks pass, V4) | V5 | Beta-gate row from #22 | Amir |
| Vercel Production serves `cdb5d93` (or later) | V6 | Agents cannot reach Vercel or the site | Amir |
| Encrypted backup artifact of run 39202267998 saved to durable private storage before 2026-10-22 05:01 UTC; temporary `BACKUP_*` repository secrets deleted (agents cannot list Actions secrets: proxy 403) | V6 | The artifact expires; the secrets widen exposure (`BACKUP_DRILL.md`) | Amir |
| Response headers and TLS on production | V6 | KI-04; unreachable from the cloud sandbox | Amir or Vercel access |
| Supabase dashboard: plan and backups, redirect URL list, Google consent screen state | V6 | KI-12 | Amir |
| Agent entry points: whether each tool actually loads `AGENTS.md` / `GEMINI.md` / `copilot-instructions.md` / the `@` import in `CLAUDE.md` | V1 | Only documented behaviour is assumed (see `INDEX.md`) | Any person with that tool |

## How to run each check (details: `OPERATIONS.md`)
`pnpm lint && pnpm typecheck && pnpm test` · `pnpm build && pnpm check:bundle` · `pnpm test:db` (Linux only) · `pnpm test:e2e` and the three other Playwright configs, one build at a time · `pnpm test:coverage`. Documentation-only changes need none of them; verify paths and cross-references instead.
