"""Static guard for the backup drill's secrets, run by the drill's pull-request job.

Fails when any workflow in .github/workflows:
  * references a BACKUP_* secret outside db-backup-drill.yml's `production` job;
  * uses `pull_request_target` or `workflow_run` (triggers that run with the
    repository's secrets on behalf of pull-request code);
and when the drill's `production` job can run on anything but a manual
dispatch from main by the repository owner, stops passing the CA
certificate that verify-full TLS needs, or the `self-test` job references
any secret.

This catches mistakes in reviewed changes. It cannot stop a hostile workflow
pushed to another branch from reading repository secrets while they exist:
that is why the runbook keeps them only for the minutes of a run.

Run: python3 -I scripts/backup-drill/check_workflows.py (repository root). Standard library only.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"
DRILL = WORKFLOWS / "db-backup-drill.yml"
BACKUP_SECRET = re.compile(r"secrets\.BACKUP_[A-Z_]+")
ANY_SECRET = re.compile(r"secrets\.")
DANGEROUS_TRIGGERS = re.compile(r"^\s*(pull_request_target|workflow_run)\s*:", re.M)


def job_blocks(text: str) -> dict[str, str]:
    """Top-level jobs of a workflow, by name, as raw text (two-space indented keys under `jobs:`)."""
    jobs_at = re.search(r"^jobs:\s*$", text, re.M)
    if not jobs_at:
        return {}
    body = text[jobs_at.end():]
    starts = list(re.finditer(r"^  ([A-Za-z0-9_-]+):\s*$", body, re.M))
    blocks = {}
    for i, m in enumerate(starts):
        end = starts[i + 1].start() if i + 1 < len(starts) else len(body)
        blocks[m.group(1)] = body[m.start():end]
    return blocks


def main() -> int:
    problems = []
    for path in sorted(WORKFLOWS.glob("*.y*ml")):
        text = path.read_text(encoding="utf-8")
        if DANGEROUS_TRIGGERS.search(text):
            problems.append(f"{path.name}: uses pull_request_target or workflow_run")
        if path == DRILL:
            continue
        if BACKUP_SECRET.search(text):
            problems.append(f"{path.name}: references a BACKUP_* secret")

    text = DRILL.read_text(encoding="utf-8")
    jobs = job_blocks(text)
    if set(jobs) != {"self-test", "production"}:
        problems.append(f"db-backup-drill.yml: expected jobs self-test and production, found {sorted(jobs)}")
    before_jobs = text[: text.find("\njobs:")]
    if ANY_SECRET.search(before_jobs):
        problems.append("db-backup-drill.yml: a secret is referenced outside the jobs")
    if ANY_SECRET.search(jobs.get("self-test", "")):
        problems.append("db-backup-drill.yml: the pull-request self-test job references a secret")
    production = jobs.get("production", "")
    for guard in (
        "github.event_name == 'workflow_dispatch'",
        "github.ref == 'refs/heads/main'",
        "github.actor == github.repository_owner",
        "inputs.confirm == 'back up kmmfhaypqgzhoptmljki'",
    ):
        if guard not in production:
            problems.append(f"db-backup-drill.yml: the production job lost its guard {guard!r}")
    if "secrets.BACKUP_DB_CA_CERT" not in production:
        problems.append("db-backup-drill.yml: the production job no longer passes BACKUP_DB_CA_CERT (verify-full TLS)")
    if "pull_request" in production:
        problems.append("db-backup-drill.yml: the production job mentions pull_request")

    for problem in problems:
        print(f"check_workflows: {problem}", file=sys.stderr)
    if not problems:
        print("check_workflows: BACKUP_* secrets are referenced only by the manual production job")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
