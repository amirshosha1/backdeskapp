---
description: Sync Backdesk project knowledge with this session's work (wraps docs/project/INDEX.md section 3; never commits)
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git diff:*), Bash(git fetch:*), Bash(git ls-remote:*), Bash(git merge-tree:*), Bash(ls:*), Read, Edit, Write, Grep, Glob
---

Follow the sync procedure in `docs/project/INDEX.md` §3; it is agent-independent and this command only wraps it. Do not commit, push or open PRs unless the user asks.

1. Collect evidence: `git status -sb`, `git log --oneline <baseline>..HEAD`, `git diff --stat`, and the test or CI results you actually obtained (never invent results).
2. Update only the changed facts in `docs/project/`: `PROJECT_STATUS.md` (status, evidence level, refs, date, PR heads from `git ls-remote origin 'refs/heads/*'`), `VERIFICATION.md` (record of checks), `ROADMAP.md`, `KNOWN_ISSUES.md`, `DECISIONS.md` (real decisions only; mark superseded), and always `SESSION_HANDOFF.md` (under 100 lines, code baseline = last commit that changed non-documentation files).
3. Remove or merge stale lines instead of appending; fix contradictions after checking the code; check that paths named in edited files exist.
4. Skip the sync for trivial edits. Report which files changed and anything you could not verify.
