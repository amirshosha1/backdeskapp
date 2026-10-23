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
| 2026-10-19 | Owner-run Claude in Chrome QA, 11:18–11:31 Cairo (V5/V6): KI-24 reproduced on Production (EN and AR: Tab into ADR, type 3000 → "24503000") and fixed on PR #39's Preview (EN and AR → "3000"; click, End, 5 → "30005"); headline −12,215.30 reconciles; invalid nights marked invalid; Arabic-Indic and Persian digits accepted; 8 pages × 360/768/1440 px with no overflow, correct `dir`, 0 console errors, 0 failed requests; first-run reaches the verdict; no consent banner and `POST /api/e` → 204 on /, /en, /demo/start | Production (deployed SHA not visible: GitHub deployments 404, Vercel 403); Preview of PR #39 @ `409eab1` | KI-24: Production FAIL, Preview PASS; rest PASS. Cookie names and deployed SHA BLOCKED. Layout checked by page width, not window resize or touch | Owner's Chrome report and screenshots in the session; reported behaviour D2–D4 matches documented decisions (PROGRESS.md "Booked nights above available nights", "تجريبي tag", "While a field is invalid") |
| 2026-10-19 | Account deletion flow (`delete_my_account()`) on PR #21's Preview, mobile, disposable account: all 5 steps (V5) | Preview of PR #21 | PASS | Founder report (2026-10-19) |
| 2026-10-19 | `docs/verify_after_migration.sql` and `docs/verify_preserve_fk_set_null.sql` in the Supabase SQL editor after #21 merged (migrations `20261012100000_preserve_fk_set_null.sql`, `20261017142500_guard_shared_org_deletion.sql`) (V6) | Production database | **PASS, 20 of 20** (6 deletion-hardening, 14 schema); exposed schemas only `public` and `graphql_public`, `private` not exposed | Founder-pasted results; merge commit `adeab33` |
| 2026-10-19 | **Account deletion verified on production after the #21 migrations**: More → delete on a disposable test Google account via Claude in Chrome; toast confirmed, signed-out state, `backdesk:guest` cleared; after Back, Reload, `/demo/units`, `/` and a direct link none of the 5 apartments returned (V6) | `https://backdeskapp.com` (deployed SHA not visible to agents) | PASS. Not covered: a shared-org smoke test (still NOT TESTED; shared orgs are not creatable in the app), direct Auth-user deletion (KI-23). Findings UX-S28…S30 | `UX_AUDIT_SIGNED_IN_2026-10.md` Journey 6 |
| 2026-10-19 | **G1 attribution check on production (V6)**: six journeys on `backdeskapp.com` via Claude in Chrome, 17:59–18:11 Cairo, 390 px frame, storage cleared before each, every `/api/e` call captured. (1) Arabic tagged `ar-a`, «أستأجرها وأعيد تأجيرها»; (2) English tagged `en-a`, "I manage it for an owner"; (3) repeat tagged `ar-b`; (4) direct tagged to `/demo/start` (`utm_content=direct`, no `utm_medium`); (5) untagged `/`; (6) invalid `utm_source` (`Bad Value!` → `other`). Each sent the contract's events in order, all by `sendBeacon` with 204: `landing_view` (journeys 1–3, 5, 6), `landing_cta_click`, `first_run_started` (`entry`, no labels, no model), exactly one `calc_start` after the pick (labels + `model`), `verdict_shown` (labels + `entry`, `outcome`, `model`); journey 4 sent no `landing_view`; journey 5 carried no `utm_*`; no `ar-a` value leaked into journey 3 | Production; deployed commit `ba1434a` (merge of #46): Vercel deployment `dpl_2eu1sg5jZkKUxKXguZr2U3Kj3C4F`, target production, READY, created 2026-10-19 14:50:48 UTC (read-only lookup by SHA); the Chrome run itself could not match the SHA, and ran after the deployment | **PASS** (G1). No URL, path, referrer, user or session id, cookie or financial value in any payload; no `utm_` left in the address bar after the button; no script-readable cookie; only the app's existing `backdesk:first-run` / `backdesk:guest` storage, with no `utm_*` in it. Not covered by this run: HttpOnly cookies (the app sets none by design); the physical-phone check is the next row | Founder-run report; PostHog read-only query (project timezone +03:00): `env = production` events for `g1check` with `ar-a`, `en-a`, `ar-b`, `direct` and `bad` (3 `landing_view`, 1 `calc_start`, 1 `verdict_shown`), keys limited to `utm_*`, `entry`, `outcome`, `model`, `locale`, `display_mode` plus the server's `in_app_browser`, `env`, `country`, `$lib`, `$process_person_profile`, `$geoip_disable` |
| 2026-10-19 | G1 attribution check on a physical phone against production (V5/V6), run by the founder on a Samsung A54 in Chrome with the tagged test URLs; journey 1 completed to the verdict with no issues | Production; deployed commit `ba1434a` | **PASS**, as reported by the founder | Founder report only (device and browser as stated; no payload capture filed); the contract itself is evidenced by the six-journey row above |
| 2026-10-19 | Production site `backdeskapp.com` and Vercel Previews in a browser (V6) | — | **Blocked**: the cloud environment's network policy denies the host (proxy 403); the Vercel connector lists the project but returns 403 for deployments and aliases | Session log |

## Not yet verified (required before the matching claim can be made)
| Needed check | Level | Why it matters | Owner |
|---|---|---|---|
| Two Google accounts on a Preview: guest unit survives reload, adopts once, appears on a second device, never visible to the other account; sign-out then sign-in as another user | V5 | Isolation has only automated proof (KI-01) | Amir |
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
