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
| — | Coverage ≥95% on `src/lib/finance/` (`pnpm test:coverage`) | — | Last claimed 99.8% line / 98.6% branch at Phase 1 (`docs/PROGRESS.md`); **not run since** | — |

## Not yet verified (required before the matching claim can be made)
| Needed check | Level | Why it matters | Owner |
|---|---|---|---|
| Two Google accounts on a Preview: guest unit survives reload, adopts once, appears on a second device, never visible to the other account; sign-out then sign-in as another user | V5 | Isolation has only automated proof (KI-01) | Amir |
| Account deletion on a disposable account (cancel, confirm, reload, other account intact) | V5 | `delete_my_account()` is irreversible | Amir |
| After any migration: run `docs/verify_after_migration.sql` in the Supabase SQL editor | V6 | Migrations apply to production on merge | Amir |
| PostHog Live events show `landing_view`, `landing_cta_click`, `first_run_started`, `verdict_shown` with `env = production` and no IP | V6 | Landing merge gate was never recorded as checked | Amir |
| Landing in Facebook's in-app browser; Sharing Debugger "Scrape Again"; Search Console + sitemap | V5/V6 | Distribution channel | Amir |
| Arabic and English at 360, 768, 1440 px on a Preview | V5 | Beta-gate row on PR #22 | Amir |
| Response headers and TLS on production | V6 | KI-04; unreachable from the cloud sandbox | Amir or Vercel access |
| Supabase dashboard: plan and backups, redirect URL list, Google consent screen state | V6 | KI-12 | Amir |
| Agent entry points: whether each tool actually loads `AGENTS.md` / `GEMINI.md` / `copilot-instructions.md` / the `@` import in `CLAUDE.md` | V1 | Only documented behaviour is assumed (see `INDEX.md`) | Any person with that tool |

## How to run each check (details: `OPERATIONS.md`)
`pnpm lint && pnpm typecheck && pnpm test` · `pnpm build && pnpm check:bundle` · `pnpm test:db` (Linux only) · `pnpm test:e2e` and the three other Playwright configs, one build at a time · `pnpm test:coverage`. Documentation-only changes need none of them; verify paths and cross-references instead.
