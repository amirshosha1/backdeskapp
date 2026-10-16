---
description: Sync Backdesk project memory with what changed this session (updates context files, never commits)
---

Update the project memory from evidence. Do not commit, push or open PRs unless the user explicitly asks.

1. Collect evidence: `git status -sb`, `git log --oneline <handoff base commit>..HEAD`, `git diff --stat` for uncommitted work, and any test/CI results from this session (quote the command and outcome; never invent results). For PRs, read their state with the GitHub tools, using small pages.
2. Update only the files whose facts changed:
   - `SESSION_HANDOFF.md`: always. Date, branch, base commit, what was completed, what is in progress, next three actions, blockers, files to read next. Keep it under 100 lines.
   - `PROJECT_STATUS.md`: change an area's status only with new evidence (CODE / CI / PR / MANUAL / PROD) and update the verified commit and date.
   - `ROADMAP.md`: change task status; add tasks only if they have acceptance criteria.
   - `KNOWN_ISSUES.md`: add verified issues, close fixed ones with the evidence, deduplicate.
   - `DECISIONS.md`: only a real decision that constrains future work; mark superseded ones.
   - `ARCHITECTURE.md` / `PROJECT_OVERVIEW.md` / `RULES_REFERENCE.md`: only if structure, scope or a rule changed.
3. Remove or merge stale or duplicated lines instead of appending. Facts, paths and evidence only; no transcripts.
4. If `CLAUDE.md` or a context file disagrees with the code, fix the doc after verifying the code.
5. Check that file paths named in the edited files still exist (`ls`), and that `CLAUDE.md` is still about 100 lines.
6. Report which context files were updated and which were intentionally left alone, plus anything you could not verify.
