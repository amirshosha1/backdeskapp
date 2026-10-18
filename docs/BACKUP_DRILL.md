# Backup drill — production backup and isolated restore on the Free plan

Backdesk stays on the Supabase Free plan, which has no downloadable backups. This drill makes one, encrypts it, and proves it restores, without paid services, local installs or Docker on Amir's machine. It is the release gate for PR #21 (`docs/STABILIZATION_DELETION.md`) and the routine before any risky change.

**What one run does** (`.github/workflows/db-backup-drill.yml`, `scripts/backup-drill/drill.sh`):

1. Reads the hosted database **read-only**: role names, a catalog fingerprint (`scripts/backup-drill/fingerprint.sql`, run inside `READ ONLY` transactions), and `pg_dump` of the `auth`, `public` and `private` schemas. It never writes to production.
2. Fingerprints production again and fails if anything changed during the dump.
3. Encrypts the dump with AES-256 (`gpg --symmetric`), decrypts it again and checks the SHA-256 is identical.
4. Restores the decrypted copy into a throwaway container of Supabase's own Postgres 17 image (`supabase/postgres:17.6.1.172`), in one transaction that stops at the first error.
5. Compares the restored copy with production, section by section: tables and columns, constraints, indexes, triggers, RLS flags and policies, table/column/function/sequence/schema privileges and default privileges, functions (definition, `SECURITY DEFINER`, `search_path`, owner), types, sequences, row counts, and an md5 of every table's rows. Then it runs `docs/verify_after_migration.sql` on the copy.
6. Uploads only the encrypted file, its manifest and the report (kept 3 days). Plaintext copies are shredded on the runner, which GitHub deletes after the job.

Report rows are PASS/FAIL with object names and counts; no row data, emails or secrets are printed.

**Proof the checks work:** every pull request that touches the drill or a migration runs it on synthetic data (must PASS), then again with the restored copy deliberately damaged (one row deleted, one grant added), which must FAIL. Future migrations are therefore always proven to dump and restore.

## What is and is not backed up

| Included | Not included (why) |
|---|---|
| `public`: orgs, members, profiles, entitlements, apartments, with policies, grants and triggers | **Storage objects (files)**: Backdesk stores none; they live outside Postgres anyway |
| `private`: the app's helper functions | Supabase-managed schemas: `storage`, `realtime`, `vault` (encrypted secrets; Backdesk stores none), `extensions`, `graphql`, `cron`, `net`, `supabase_functions` |
| `auth`: users, Google identities, sessions, refresh tokens, MFA and audit tables, with their schema | Role passwords and memberships (Supabase manages them); project settings: Auth providers, redirect URLs, API keys, SMTP (re-enter from `docs/SETUP_AUTH.md`) |

Not point-in-time: a run is one consistent snapshot of a quiet database. Vercel and GitHub hold the code; this covers the data.

## Security model

- **Secrets.** On a private repository on GitHub Free, environments with required reviewers are not available (confirm in Settings → Environments; if the page offers protection rules, use an environment instead). Repository secrets can be read by any workflow that a person with push access writes on any branch, agents included. So the database URL is **never left stored**: add it immediately before a run and delete it immediately after. Deleting the secret does not change the password; to fully close the window, reset the database password afterwards (Database → Settings). The app never uses it (only the URL and the publishable key reach the code); after a reset, check that the next migration still deploys through the Supabase GitHub integration.
- **Which job can see them.** Only the `production` job references the secrets, and it runs only on a manual dispatch from `main`, by the repository owner, with the typed confirmation. The pull-request job references none.
- **Which database.** The script refuses a URL that does not contain the project ref `kmmfhaypqgzhoptmljki`.
- **Least privilege.** `contents: read` only; checkout without stored credentials; actions pinned to commit SHAs; the restore runs in an isolated container network that is removed afterwards.
- **Data.** The backup contains personal data (Auth emails and Google profile data). It leaves the runner only encrypted; keep the passphrase in your password manager, never in the repository, a chat or a PR.

## Why the workflow must be merged before it can run

GitHub only offers **Run workflow** for a workflow file that exists on the default branch (`main`). The order is therefore:

1. Review the PR that adds the drill. Its self-test job must be green (synthetic data, no secrets).
2. Merge it with explicit approval. It adds no migration and no application code; merging runs nothing against production.
3. Then the run below, each time with explicit approval.

## Running it (Amir)

1. **Connection string.** Supabase dashboard → project → **Connect** → *Session pooler* (IPv4; the direct connection is IPv6-only and GitHub's runners cannot reach it). It looks like `postgresql://postgres.kmmfhaypqgzhoptmljki:[PASSWORD]@aws-…pooler.supabase.com:5432/postgres`; put the database password in place of `[PASSWORD]`.
2. **Passphrase.** Generate one of at least 32 random characters in your password manager and save it there as "Backdesk backup passphrase".
3. GitHub → repository → Settings → Secrets and variables → Actions → **New repository secret**: `BACKUP_SOURCE_DB_URL` (step 1) and `BACKUP_PASSPHRASE` (step 2).
4. Actions → **Backup drill** → Run workflow → branch `main` → type `back up kmmfhaypqgzhoptmljki` → Run.
5. When it finishes (about 5–10 minutes), open the run: the summary shows the report. **Every row must be PASS.**
6. **Immediately delete both secrets** (Settings → Secrets → delete). Optionally reset the database password (see Security model).
7. Download the artifact `backdesk-backup-<run id>` within 3 days and keep the `.gpg` file somewhere private and durable (not the repository). To check it opens on Windows: Git Bash → `gpg --decrypt --output backdesk.dump <file>.gpg`, enter the passphrase, then delete `backdesk.dump`.
8. Send back the run link and the report table (it contains no personal data).

A FAIL row names the check and the objects. Do not merge a migration until a run passes.

## Restoring for real (outline, needs a reviewed plan)

Decrypt the file, then restore the way the drill does (`scripts/backup-drill/drill.sh`, section "Restore"): replace the target's `auth` and `private` schemas, keep its `public` schema, reset `public`'s default privileges, `pg_restore --single-transaction --exit-on-error` with the `SCHEMA - public` entry removed from the list, then rerun the fingerprint and `docs/verify_after_migration.sql`. Restoring over the live project is destructive: it needs the owner's approval and a written, reviewed plan first.

## Cost

GitHub Free includes, for private repositories, a monthly allowance of Actions minutes (2,000 Linux minutes at the time of writing) and of artifact storage (500 MB). One run takes about 5–10 Linux minutes (most of it pulling the 1.7 GB image) and stores well under 1 MB for 3 days. The self-test adds about 5 minutes to each PR that touches the drill or a migration. These figures are GitHub's published plan limits, not a reading of this account's usage: check Settings → Billing and plans → Usage before relying on them.
