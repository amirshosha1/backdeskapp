---
description: Resume Backdesk work from the repository's project knowledge (wraps docs/project/INDEX.md section 2)
argument-hint: [task, e.g. "review PR #23"]
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git fetch:*), Bash(git ls-remote:*), Read, Grep, Glob
---

Follow the resume procedure in `docs/project/INDEX.md` §2; it is agent-independent and this command only wraps it.

1. Read `docs/project/SESSION_HANDOFF.md` (`AGENTS.md` is already loaded through `CLAUDE.md`). Open `docs/project/INDEX.md` only if you need the map.
2. Run the freshness checks from the handoff (`git status -sb`, `git fetch -q origin`, `git log --oneline <baseline>..origin/main -- . ':!docs' ':!.claude' ':!*.md' ':!.github/copilot-instructions.md'` (code commits only), `git ls-remote origin 'refs/heads/*'`; also list open PRs live when a GitHub tool is available). The handoff is a dated snapshot: PR states and heads in it are claims to check, and the code baseline is not the HEAD. Re-verify only the claims the changes touch.
3. Task: `$ARGUMENTS` if given, else the handoff's first next action; if ambiguous ask one question with 2-3 options and a recommendation.
4. Read only that task's documents and files (`INDEX.md` shortcuts, `CODEBASE_MAP.md`). Code beats documentation; note any correction for `/project-sync`.
5. Print a brief of at most 12 lines (branch, working tree, task, files, risks, first step), then start. Phase work: present a plan first and wait for approval (`AGENTS.md` §8).
