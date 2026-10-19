# INDEX — documentation map, resume and sync

> Documentation map and the resume/sync procedures. Shared, agent-independent. Startup reads `AGENTS.md`, `docs/strategy/90-day-launch.md` and `SESSION_HANDOFF.md`; open this file when you need the map or a procedure.

## 1. Startup set (`AGENTS.md`, `docs/strategy/90-day-launch.md`, `SESSION_HANDOFF.md`) and everything else (on demand)
| File | Contains | Read when |
|---|---|---|
| `AGENTS.md` (root) | Identity, truth precedence, non-goals, architecture rules, safety, workflow | Always |
| [`../strategy/90-day-launch.md`](../strategy/90-day-launch.md) | 90-day strategy, approved vs pending scope, provenance, review and evidence rules | Always, before choosing work |
| `SESSION_HANDOFF.md` | Objective, code baseline + freshness commands, what is done / active / next, blockers | Always |
| `PROJECT_STATUS.md` | Per-area status, evidence level, open PRs and conflicts | Before claiming anything works or is missing; after the freshness check says it may be stale |
| `ROADMAP.md` | Approved scope vs recommendations, IDs, dependencies, acceptance | Choosing or scoping work |
| `KNOWN_ISSUES.md` | Verified defects and risks (KI-n), resolution criteria | Touching an affected area; before a merge |
| `DECISIONS.md` | Decisions (D-n), rationale, superseded ones | Before changing behaviour that was decided |
| `PRODUCT_SCOPE.md` | Planned modules, boundaries, acceptance index, glossary | Product questions, finance terms |
| `PROJECT_OVERVIEW.md` | Purpose, users, pricing principle, stage, objectives | New to the product |
| `ARCHITECTURE.md` | Design, data flow, database and RLS, auth, integrations, deployment, stack | Design or security work |
| `CODEBASE_MAP.md` | Directories, feature → code → tests, entry points | Locating code |
| `VERIFICATION.md` | Evidence levels V0–V6, check record, what is still unverified | Recording or questioning a check |
| `OPERATIONS.md` | Commands, environments, CI/CD, migrations, rollback, limits | Running, deploying, migrating |
| `UX_RULES.md` | i18n, RTL, UX, landing and analytics display rules | Any UI or copy work |
| `../BUILD_PLAN.md` | Full spec: formulas, data model, worked examples, phases | One section at a time: `grep -n '^#' docs/BUILD_PLAN.md` |
| `../PROGRESS.md` | Dated history (592 lines) | Rarely; search a date or term, never read in full |
| `../ANALYTICS.md`, `../SETUP_AUTH.md`, `../FINANCIAL_BASELINE.md` | Event catalogue; Google/Supabase setup; sourced default figures | Analytics, auth setup, presets |

Task shortcuts: auth → `ARCHITECTURE.md` (AuthN/AuthZ), `CODEBASE_MAP.md`, `docs/SETUP_AUTH.md`, `tests/db/` · database → migrations, `OPERATIONS.md`, `KNOWN_ISSUES.md` · billing → `PRODUCT_SCOPE.md`, `DECISIONS.md` D-07..D-09, `BUILD_PLAN.md` §2 · deployment → `OPERATIONS.md`, `.github/workflows/` · UI → `UX_RULES.md`.

## 2. Resume procedure (any agent)
1. Read `AGENTS.md`, `docs/strategy/90-day-launch.md` and `SESSION_HANDOFF.md` (this file only for the map).
2. Freshness (the handoff and status files are dated snapshots, never proof of current state; live Git and PR state win): `git status -sb`; `git fetch -q origin`; `git log --oneline <baseline>..origin/main -- . ':!docs' ':!.claude' ':!*.md' ':!.github/copilot-instructions.md'` (baseline from the handoff; code commits only); `git ls-remote origin 'refs/heads/*'` against the PR heads in `PROJECT_STATUS.md`; when a GitHub tool is available also list open PRs with minimal fields (`number`, `title`, `draft`, `state`, `head`) and compare. A PR that is merged, closed, or at a different head is a correction to make, not a fact to repeat. Distinguish the code baseline (last code commit) from `origin/main` HEAD (may be a documentation commit).
3. A new commit or head invalidates only the claims about what it touched: `git diff --stat <baseline>..origin/main` shows which. Re-verify those rows; leave the rest.
4. Choose the task (the user's, else the handoff's first next action). Read only its files via `CODEBASE_MAP.md`.
5. Reply with a brief: branch, working tree, task, files, risks, first step. Then work. No repository-wide audit.

## 3. Sync procedure (after meaningful work; skip for trivial edits)
1. Inspect the real change: `git status -sb`, `git diff --stat`, `git log <baseline>..HEAD`.
2. Record test evidence you actually ran (command, result, commit) in `VERIFICATION.md`; CI results by run id.
3. Update only changed facts: `PROJECT_STATUS.md` row (status, level, refs, date), `ROADMAP.md` status, `KNOWN_ISSUES.md` (add or close with evidence), `DECISIONS.md` (only real decisions; mark superseded, never delete).
4. Rewrite `SESSION_HANDOFF.md` (under 100 lines): objective, code baseline, done, active, next three, blockers, files, required verification. Do not record the docs commit itself, it can never be current; the baseline is the last commit that changed non-documentation files.
5. Fix contradictions you find (code wins). Check that paths named in edited files exist.
6. Report which files changed. Commit or push only if the owner asked.

## 4. Agent compatibility (documented behaviour; **not verified in this environment**)
| Agent | Entry point | Mechanism |
|---|---|---|
| OpenAI Codex | `AGENTS.md` | Reads root `AGENTS.md` natively. Keep it small (Codex caps combined instructions at a configurable size, 32 KiB by default; `AGENTS.md` is about 9 KB) |
| Cursor | `AGENTS.md` | Reads `AGENTS.md` natively; no `.cursor/rules` needed or created |
| GitHub Copilot | `AGENTS.md`, `.github/copilot-instructions.md` | Coding agent reads `AGENTS.md`; the repository instructions file is read by Copilot chat and code review and holds a short rule digest plus a pointer |
| Gemini CLI | `GEMINI.md` | Default context file; `@AGENTS.md` import pulls in the shared text |
| Claude Code | `CLAUDE.md` | `@AGENTS.md` import; Claude-only commands in `.claude/commands/` |
| Any other agent | `AGENTS.md` then this file | Plain file reading |
Whether each tool really loads these files has not been tested here (`VERIFICATION.md`, ROADMAP P2-9). If one does not, read `AGENTS.md` by hand.

## 5. Legacy citations
Code comments and docs cite the old `CLAUDE.md` by section. §2 non-goals, §4 commands (summary), §6 architecture rules, §8 workflow: `AGENTS.md` same number. §1 product: `PROJECT_OVERVIEW.md`. §3 stack: `ARCHITECTURE.md`. §4 command details and §5 environments: `OPERATIONS.md`. §7 UX: `UX_RULES.md`. §9 glossary: `PRODUCT_SCOPE.md`.

## 6. Keeping this system small
One canonical file per subject; link, do not copy. Facts, paths, evidence; no transcripts. Move closed history to `docs/PROGRESS.md`-style archives only with the owner's permission. Never store secrets.
