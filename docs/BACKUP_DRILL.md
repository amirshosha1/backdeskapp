# Backup drill — a partial database backup and an isolated restore on the Free plan

Backdesk stays on the Supabase Free plan, which has no downloadable backups. This drill takes one, encrypts it, and proves it restores, with no paid service, no local install and no Docker on Amir's machine. It is the release gate for PR #21 (`docs/STABILIZATION_DELETION.md`) and the routine before any risky database change.

## What this is and is not

**The encrypted file is a partial database backup: the `auth`, `public` and `private` schemas of one Postgres database.** It is **not** a recovery of the Supabase project. If the project were lost, this file alone would not bring Backdesk back: a new project, its settings and the steps under "Restoring for real" are also needed.

| Included | Not included |
|---|---|
| `public`: orgs, members, profiles, entitlements, apartments, with their policies, grants, triggers and default privileges | **Storage objects (files)**: they live outside Postgres; Backdesk stores none today |
| `private`: the app's helper functions | Supabase-managed schemas: `storage`, `realtime`, `vault` (encrypted secrets; Backdesk stores none), `extensions`, `graphql`, `cron`, `net`, `supabase_functions` |
| `auth`: users, Google identities, sessions, refresh tokens, MFA and audit tables, with their schema | Roles' passwords and memberships; installed extension versions |
| | Project settings: Auth providers and Google client, redirect URLs, API keys, JWT secret, SMTP, network restrictions, the GitHub integration (re-enter from `docs/SETUP_AUTH.md`) |
| | Vercel environment variables and anything outside Supabase |

It is one consistent snapshot of a quiet database, not point-in-time recovery: anything written after the run is not in it.

## What one run does

`.github/workflows/db-backup-drill.yml` runs `scripts/backup-drill/drill.sh`:

1. **Validates the CA certificate** (`ca_cert.py`, see TLS), then **the connection string** (`source_url.py`). The connection string must be Backdesk's session pooler:
   - user `postgres.kmmfhaypqgzhoptmljki`;
   - host `aws-N-eu-west-1.pooler.supabase.com`;
   - port 5432, database `postgres`;
   - at most one parameter, `sslmode=verify-full` (omitted means `verify-full`; every other mode is refused).

   Anything else is refused before any connection, with an error that names the failed rule and never the URL. The password reaches the Postgres client only as an environment variable, is masked in the log, and never appears in a command line.
2. **Preflight.** It checks the Postgres major version and the size of the three schemas (catalog statistics only). It stops before any heavy work if they exceed the limits below.
3. **Reads production, read-only:**
   - role names;
   - a catalog fingerprint (`fingerprint.sql`);
   - the CHECK and policy definitions (`expressions.sql`), each in a `READ ONLY` transaction with a statement and lock timeout;
   - `pg_dump` of the three schemas, under a time limit.

   It fingerprints again after the dump and fails if anything changed meanwhile. It never writes to production.
4. **Encrypts** the dump with AES-256 (`gpg --symmetric`), decrypts it again and checks the SHA-256 is identical.
5. **Restores** into a throwaway container of Supabase's Postgres 17 image (`supabase/postgres:17.6.1.172`), in one transaction that stops at the first error.
6. **Compares** the copy with production:
   - tables and columns, constraints, indexes, triggers;
   - RLS flags, policies (mode, command, roles);
   - privileges on tables, columns, functions, sequences and schemas, and default privileges;
   - functions (definition, `SECURITY DEFINER`, `search_path`, owner);
   - types, sequences;
   - row counts and an md5 of every table's rows;
   - every CHECK constraint and policy expression (see "How expressions are compared");
   - finally `docs/verify_after_migration.sql` on the copy.
7. **Uploads** only the encrypted file, its manifest and the report, kept 3 days. Plaintext copies, the connection details and the CA file are shredded on the runner. GitHub-hosted runners are discarded after each job.

Report rows are PASS, FAIL or INFO, with object names and counts. They contain no row data, emails or secrets.

**Proof the checks work.** Every pull request that touches a workflow, the drill or a migration runs the drill's self-test job:
1. a static check that no workflow but the manual production job references a `BACKUP_*` secret, and that the production job still passes `BACKUP_DB_CA_CERT` (`check_workflows.py`);
2. the connection-string validator's tests (`test_source_url.py`): 4 accepted forms and 25 rejected ones, including look-alike hosts, the direct connection, transaction mode, extra parameters and every TLS mode but `verify-full`;
3. the fail-closed TLS tests (`test_tls_policy.py`, no Docker needed). Production mode refuses a missing, empty, malformed or key-bearing certificate before starting any container, and refuses `sslmode=require`. It passes `verify-full` and the certificate to the source connection even when the environment says otherwise, and stops after a failed verification, with no retry and no weaker mode;
4. the drill on synthetic data, which must PASS;
5. the drill with the restored copy deliberately damaged, which must FAIL. The damage is one row deleted, `anon` granted access, a policy opened to `true`, and a CHECK constraint loosened.

## How expressions are compared

Postgres stores CHECK constraints and policy expressions as parse trees and prints them back as text. After a dump and restore, the same expression can print differently (`(((a AND b) AND c))` comes back as `((a AND b AND c))`). An earlier version of this drill compared them with parentheses and spaces removed. That hid real differences: `a AND (b OR c)` and `(a AND b) OR c` both became `aANDbORc`. This was demonstrated on the Postgres 17 image on 2026-10-18.

The drill now re-parses each source definition on the restore server itself. It attaches the definition to the restored table as a scratch constraint or policy inside a transaction that is always rolled back (`canonicalize.sql`), and compares what that server prints with the restored object. Both sides then go through the same parser and printer, so formatting differences disappear and any change in meaning, grouping included, remains. The catalog fingerprint still covers each constraint's and policy's existence, name, kind, mode, command and roles.

## Limits and operational impact on production

| Setting | Default | What it protects |
|---|---|---|
| `DRILL_MAX_TOTAL_BYTES` | 512 MiB | Refuses to start if `auth` + `public` + `private` are larger (catalog sizes, no table scan). The Free plan's database limit is 500 MB. |
| `DRILL_MAX_TABLE_BYTES` | 128 MiB | Refuses to start if any one table is larger: the data hash holds one table's text in memory at a time. |
| `DRILL_STATEMENT_TIMEOUT` | 120 s | Cancels any single read on production that runs longer. |
| `DRILL_LOCK_TIMEOUT` | 5 s | Never queues behind another session's lock, so a running migration is never blocked by the drill (and the dump gives up instead of waiting). |
| `DRILL_DUMP_TIMEOUT` | 900 s | Stops `pg_dump` (TERM, then KILL 30 s later). |
| Job timeout | 30 min | GitHub stops the whole job. |

Raising a limit is a code change and goes through review.

**What a run costs production:**
- The fingerprint reads every row of every table in the three schemas, twice (before and after the dump), and `pg_dump` reads them a third time: three sequential scans plus hashing.
- The synthetic copy is about 0.4 MB, which takes well under a second. Production's size has not been measured yet: the first run's preflight row will show it.
- It runs one connection at a time through the session pooler, named `backdesk-backup-drill` in `pg_stat_activity`, so it can be identified and, if ever needed, terminated from the dashboard.
- It takes only `ACCESS SHARE` locks, which block nothing except `ALTER`/`DROP`/`TRUNCATE` on the same table. The lock timeout makes the drill give way instead of making a migration wait.
- Run it when no migration is being deployed. When the database grows, check the preflight sizes in the report first.

## TLS

**Production runs are fail-closed on verified TLS (owner decision, 2026-10-18; enforced in code).**
- Every connection to the production database uses `sslmode=verify-full`: libpq checks the server's certificate against Supabase's CA and checks the host name.
- The CA certificate comes from the repository secret `BACKUP_DB_CA_CERT`. Download it from the Supabase dashboard → Database → Settings → SSL Configuration → Download certificate, and paste its PEM text.
- `ca_cert.py` refuses a missing, empty or malformed certificate, a private key, or text around the PEM blocks. When it refuses, the drill stops **before** it starts any container or opens any connection.
- `source_url.py` refuses any `sslmode` other than `verify-full`; an omitted `sslmode` means `verify-full`. `drill.sh` sets `PGSSLMODE=verify-full` and `PGSSLROOTCERT` itself, whatever the environment holds, and refuses a source connection that lacks either.
- If verification fails (wrong certificate, host name mismatch), the drill fails. There is **no fallback** to `require` or any weaker mode. Report the failure; changing the TLS rule needs a new owner decision and a code change.
- The report shows `sslmode verify-full` in its Connection row and a PASS row "TLS verified" after the first verified connection.
- `test_tls_policy.py` proves these refusals on every pull request, and `check_workflows.py` fails if the production job stops passing `BACKUP_DB_CA_CERT`.
- The self-test needs no certificate: its source is a local throwaway container.

## Secrets: exposure window, cleanup and rotation

Private repositories on GitHub Free have no environments with required reviewers. Confirm in Settings → Environments; if protection rules are offered, move these secrets into a protected environment instead. **Repository secrets can be read by any workflow that someone with push access, agents included, writes on any branch while the secrets exist.** Deleting a secret does not undo a read that already happened. The controls are therefore:

1. **Never stored at rest.**
   - `BACKUP_SOURCE_DB_URL` exists only between "add" and "delete" below, typically under 15 minutes.
   - `BACKUP_PASSPHRASE` only during the run; its home is your password manager.
   - `BACKUP_DB_CA_CERT` is a public certificate and may stay.
2. **Referenced only by the manual production job.** That job runs only on `workflow_dispatch` from `main`, by the repository owner, with the typed confirmation. The pull-request job references no secret, and `check_workflows.py` fails any workflow change that would. Forked pull requests never receive secrets. No workflow in this repository uses `pull_request_target` or `workflow_run`, and the guard keeps it that way.
3. **During the window**, do not merge or approve other work. Afterwards, look at Actions → All workflows for any run you did not start in that window.
4. **Cleanup after every run:** Settings → Secrets and variables → Actions → delete `BACKUP_SOURCE_DB_URL` and `BACKUP_PASSPHRASE`.
5. **Rotation:**
   - **Database password.** Reset it after each run (Supabase dashboard → Database → Settings → Reset database password). This makes any copy of the URL useless.
     - Backdesk's app never uses it: only the project URL and the publishable key reach the code.
     - After a reset, confirm the next migration still deploys through the Supabase GitHub integration.
     - Reset it immediately if a secret might have been read by a run you did not start.
   - **Passphrase.** Keep it unless it may have leaked; it is needed to decrypt existing backups. If it leaked, create a new one, run the drill again, and delete the old encrypted files.
   - **Encrypted files.** Keep at most the newest few; delete the rest.

## Why the workflow must be merged before it can run

GitHub offers **Run workflow** only for a workflow file that exists on the default branch (`main`). So:
1. Review the PR. Its self-test job must be green: synthetic data, no secrets.
2. Merge it, with explicit approval. It adds no migration and no application code. Merging runs nothing against production.
3. Run it, each time with explicit approval.

## Running it (Amir)

1. **Connection string.** Supabase dashboard → project → **Connect** → *Session pooler*. The direct connection is IPv6-only, and GitHub's runners cannot reach it. The string looks like `postgresql://postgres.kmmfhaypqgzhoptmljki:[PASSWORD]@aws-…-eu-west-1.pooler.supabase.com:5432/postgres`. Put the database password in place of `[PASSWORD]`, percent-encoding `@ : / ? # %` if they appear in it.
2. **Passphrase.** Generate one of at least 32 random characters in your password manager and save it there as "Backdesk backup passphrase".
3. GitHub → repository → Settings → Secrets and variables → Actions → **New repository secret**:
   - `BACKUP_SOURCE_DB_URL` (step 1);
   - `BACKUP_PASSPHRASE` (step 2);
   - `BACKUP_DB_CA_CERT`, Supabase's CA certificate (see TLS). **Required:** without a valid one the drill refuses to start.
4. Actions → **Backup drill** → Run workflow → branch `main` → type `back up kmmfhaypqgzhoptmljki` → Run.
5. When it finishes (about 5–10 minutes), open the run: the summary shows the report. **Every PASS/FAIL row must be PASS**, including "TLS verified (sslmode=verify-full against BACKUP_DB_CA_CERT)".
6. **Immediately delete `BACKUP_SOURCE_DB_URL` and `BACKUP_PASSPHRASE`**, then reset the database password (see Rotation).
7. Download the artifact `backdesk-partial-db-backup-<run id>` within 3 days. Keep the `.gpg` file somewhere private and durable, not in the repository. To check it opens on Windows: Git Bash → `gpg --decrypt --output backdesk.dump <file>.gpg`, enter the passphrase, then delete `backdesk.dump`.
8. Send back the run link and the report table (it contains no personal data).

A FAIL row names the check and the objects. Do not merge a migration until a run passes.

## Restoring for real (outline; needs a reviewed plan)

1. Decrypt the file.
2. Prepare the target: create or choose a Supabase project on the same Postgres major version, and re-enter its settings (Auth providers, redirect URLs, keys, SMTP).
3. Restore the way the drill does (`drill.sh`, section "Restore into the throwaway target"):
   - replace the `auth` and `private` schemas;
   - keep `public`, and reset its default privileges;
   - run `pg_restore --single-transaction --exit-on-error` with the `SCHEMA - public` entry removed from the list.
4. Rerun the fingerprint, the expression comparison and `docs/verify_after_migration.sql`.

Restoring over the live project is destructive and replaces its Auth users. It needs the owner's approval and a written, reviewed plan first.

## Cost

GitHub Free includes, for private repositories, a monthly allowance of Actions minutes (2,000 Linux minutes when this was written) and of artifact storage (500 MB). Estimates:
- one production run: about 5–10 Linux minutes, mostly pulling the 1.7 GB image;
- storage: well under 1 MB for 3 days;
- the self-test: about 2–5 minutes on each PR that touches a workflow, the drill or a migration.

These are GitHub's published plan limits, not a reading of this account's usage. Check Settings → Billing and plans → Usage.
