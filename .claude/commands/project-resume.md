---
description: Resume Backdesk work from the project memory with a short brief (no full re-audit)
argument-hint: [task, e.g. "review PR #23"]
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git fetch:*), Bash(git ls-remote:*), Read, Grep, Glob
---

Resume the project cheaply. Do not re-audit it.

1. Read `.claude/context/SESSION_HANDOFF.md` (you already have `CLAUDE.md`). Note its branch, base commit and "next three actions".
2. Check freshness with small git commands only: `git status -sb`, `git fetch -q origin`, `git log --oneline <baseline>..origin/main` (the code baseline named in the handoff), `git ls-remote origin 'refs/heads/*'` and compare with the PR heads in `PROJECT_STATUS.md`. A new commit on `main` or a changed PR head means the related status facts are stale: say which, and re-verify only those before relying on them.
3. Decide the current task: `$ARGUMENTS` if given, otherwise the first item under "Next three actions". If it is ambiguous, ask one question with 2–3 options and a recommendation.
4. Read only the context files and source files for that task, using the table in `SESSION_HANDOFF.md` §9 and the map in `CLAUDE.md` §9. Do not open `docs/PROGRESS.md` in full or unrelated subsystems.
5. If a context file contradicts the code you read, trust the code and note the correction for `/project-sync`.
6. Print a brief of at most 12 lines: branch and commit, working-tree state, task, files to touch, risks or blockers, and the first step. Then start the work (follow `CLAUDE.md` §8: present a plan first for phase work and wait for approval).
