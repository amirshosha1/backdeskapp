#!/usr/bin/env bash
# Backdesk backup drill: dump → encrypt → decrypt → restore into a throwaway
# Supabase Postgres container → prove the copy matches the source.
#
#   drill.sh self-test    source = a throwaway container, migrated with
#                         supabase/migrations/ and seeded with synthetic data.
#                         Needs no secrets. Runs on pull requests. With
#                         DRILL_TAMPER=1 it damages the restored copy and must
#                         FAIL, which proves the checks catch a bad restore.
#   drill.sh production   source = the hosted project, read-only. Needs
#                         SOURCE_URL and BACKUP_PASSPHRASE. Runs only from the
#                         manual workflow (docs/BACKUP_DRILL.md).
#
# What it reads from the source: role names, the catalog fingerprint
# (scripts/backup-drill/fingerprint.sql, inside READ ONLY transactions) and
# a pg_dump of the auth, public and private schemas (pg_dump itself only reads).
# It never writes to the source.
#
# Output in $OUT (default ./backup-drill-out):
#   encrypted/backdesk-<stamp>.dump.gpg   the backup, AES-256 (gpg symmetric)
#   encrypted/manifest.txt                sizes and SHA-256 of plaintext and ciphertext
#   report.md                             PASS/FAIL per check, no row data
# Plaintext copies stay in a private temporary directory and are shredded on exit.
#
# Needs: bash, docker, gpg, sha256sum. Every Postgres client runs inside
# $IMAGE, so pg_dump/pg_restore/psql always match the restore server.
set -euo pipefail
umask 077

MODE="${1:-}"
[[ "$MODE" == "self-test" || "$MODE" == "production" ]] || { echo "usage: drill.sh self-test|production" >&2; exit 2; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE="${IMAGE:-supabase/postgres:17.6.1.172}"
OUT="$(mkdir -p "${OUT:-$ROOT/backup-drill-out}" && cd "${OUT:-$ROOT/backup-drill-out}" && pwd)"
PROJECT_REF="kmmfhaypqgzhoptmljki"
SCHEMAS=(auth public private)
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ID="drill-$$-$RANDOM"
NET="$ID-net"
TARGET="$ID-target"
SOURCE_CONTAINER="$ID-source"
WORK="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/backdesk-drill.XXXXXX")"
LOCAL_PW="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"
FAILED=0

mkdir -p "$OUT/encrypted"
REPORT="$OUT/report.md"
: >"$REPORT"

cleanup() {
  # DRILL_KEEP (self-test only, for debugging) keeps the two containers; files are always shredded.
  if [[ "$MODE" == "self-test" && -n "${DRILL_KEEP:-}" ]]; then
    echo "drill: kept $SOURCE_CONTAINER and $TARGET (self-test only)"
  else
    docker rm -f "$TARGET" "$SOURCE_CONTAINER" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
  fi
  # Plaintext dump, decrypted copy and fingerprints: overwrite, then delete.
  find "$WORK" -type f -exec shred -u {} + 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT

log() { echo "drill: $*"; }
check() { # check PASS|FAIL "what" "detail"
  local detail="${3:-}"
  detail="${detail//$'\n'/ }"
  detail="${detail//|/\\|}"
  set -- "$1" "$2" "$detail"
  printf '| %s | %s | %s |\n' "$1" "$2" "$3" >>"$REPORT"
  [[ "$1" == "PASS" ]] || FAILED=1
  log "$1 — $2${3:+ ($3)}"
}

if [[ "$MODE" == "production" ]]; then
  : "${SOURCE_URL:?SOURCE_URL is not set}"
  : "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"
  # Only the Backdesk project, never another one in the account (AGENTS.md §5).
  [[ "$SOURCE_URL" == *"$PROJECT_REF"* ]] || { echo "drill: SOURCE_URL is not the Backdesk project ($PROJECT_REF)" >&2; exit 1; }
  (( ${#BACKUP_PASSPHRASE} >= 32 )) || { echo "drill: BACKUP_PASSPHRASE must be at least 32 characters" >&2; exit 1; }
else
  # Throwaway values for the self-test; never a real secret.
  BACKUP_PASSPHRASE="$(head -c 48 /dev/urandom | base64)"
fi
export BACKUP_PASSPHRASE

# Clients run in the image; $WORK is mounted at /work. Secrets travel as
# environment variables named on the command line, never as values in argv.
pg() { # pg <container-or-"run"> <cmd...>
  local where="$1"; shift
  if [[ "$where" == "run" ]]; then
    docker run --rm --network "$NET" -v "$WORK:/work" -e SOURCE_URL -e PGPASSWORD="$LOCAL_PW" "$IMAGE" "$@"
  else
    docker exec -i -e PGPASSWORD="$LOCAL_PW" "$where" "$@"
  fi
}
target_psql() { pg "$TARGET" psql -X -v ON_ERROR_STOP=1 -q -At -h localhost -U supabase_admin -d postgres "$@"; }

start_db() { # start_db <name>
  docker run -d --name "$1" --network "$NET" -e POSTGRES_PASSWORD="$LOCAL_PW" "$IMAGE" >/dev/null
  for _ in $(seq 1 90); do
    if docker exec "$1" pg_isready -h localhost -U supabase_admin -d postgres >/dev/null 2>&1 \
      && docker exec -e PGPASSWORD="$LOCAL_PW" "$1" psql -X -h localhost -U supabase_admin -d postgres -Atc 'select 1' >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  docker logs "$1" | tail -20 >&2
  echo "drill: $1 did not start" >&2
  exit 1
}

log "mode $MODE, image $IMAGE"
docker network create "$NET" >/dev/null
start_db "$TARGET"
cp "$ROOT/scripts/backup-drill/fingerprint.sql" "$WORK/fingerprint.sql"
chmod 644 "$WORK/fingerprint.sql"
chmod 777 "$WORK"   # the image's tools run as their own user

# --- Source -------------------------------------------------------------------
if [[ "$MODE" == "self-test" ]]; then
  start_db "$SOURCE_CONTAINER"
  SOURCE_URL="postgresql://postgres:$LOCAL_PW@$SOURCE_CONTAINER:5432/postgres"
  # Migrations run as postgres, as the Supabase GitHub integration applies them.
  for f in "$ROOT"/supabase/migrations/*.sql; do
    pg "$SOURCE_CONTAINER" psql -X -v ON_ERROR_STOP=1 -q -h localhost -U postgres -d postgres <"$f" >/dev/null
  done
  pg "$SOURCE_CONTAINER" psql -X -v ON_ERROR_STOP=1 -q -h localhost -U supabase_admin -d postgres <"$ROOT/scripts/backup-drill/seed.sql" >/dev/null
  log "source: throwaway container, $(ls "$ROOT"/supabase/migrations/*.sql | wc -l) migrations, synthetic seed"
fi
export SOURCE_URL

source_ro() { # read-only query against the source; output on stdout
  pg run psql -X -v ON_ERROR_STOP=1 -q -At "$SOURCE_URL" -c 'begin transaction read only' -c 'set local search_path = pg_catalog' "$@" -c 'commit'
}

SERVER_MAJOR="$(source_ro -c 'show server_version_num' | head -n 1)"
SERVER_MAJOR="$((SERVER_MAJOR / 10000))"
IMAGE_MAJOR="$(target_psql -c 'show server_version_num')"
IMAGE_MAJOR="$((IMAGE_MAJOR / 10000))"
if [[ "$SERVER_MAJOR" == "$IMAGE_MAJOR" ]]; then
  check PASS "Postgres major version matches the restore image" "source $SERVER_MAJOR, image $IMAGE_MAJOR"
else
  check FAIL "Postgres major version matches the restore image" "source $SERVER_MAJOR, image $IMAGE_MAJOR"
  exit 1
fi

# --- Fingerprint, dump, fingerprint again ----------------------------------------
source_ro -f /work/fingerprint.sql -F $'\t' >"$WORK/source-before.tsv"
source_ro -c "select rolname from pg_roles where rolname !~ '^pg_' order by 1" >"$WORK/source-roles.txt"

DUMP="$WORK/backdesk-$STAMP.dump"
pg run pg_dump --dbname="$SOURCE_URL" --format=custom --compress=9 --no-subscriptions --no-publications \
  "${SCHEMAS[@]/#/--schema=}" --file="/work/$(basename "$DUMP")"
check PASS "pg_dump of auth, public and private completed" "$(stat -c %s "$DUMP") bytes"

source_ro -f /work/fingerprint.sql -F $'\t' >"$WORK/source-after.tsv"
if diff -q <(grep -v $'^info\t' "$WORK/source-before.tsv") <(grep -v $'^info\t' "$WORK/source-after.tsv") >/dev/null; then
  check PASS "Source unchanged while the dump ran"
else
  check FAIL "Source unchanged while the dump ran" "rerun the drill at a quiet time"
fi

# --- Encrypt, then prove the ciphertext decrypts to the same bytes --------------------
ENC="$OUT/encrypted/$(basename "$DUMP").gpg"
gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 --symmetric --cipher-algo AES256 \
  --s2k-digest-algo SHA512 --s2k-count 65011712 --output "$ENC" "$DUMP" 3<<<"$BACKUP_PASSPHRASE"
gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt --output "$WORK/restore.dump" "$ENC" 3<<<"$BACKUP_PASSPHRASE"
PLAIN_SHA="$(sha256sum "$DUMP" | cut -d' ' -f1)"
DECRYPTED_SHA="$(sha256sum "$WORK/restore.dump" | cut -d' ' -f1)"
CIPHER_SHA="$(sha256sum "$ENC" | cut -d' ' -f1)"
if [[ "$PLAIN_SHA" == "$DECRYPTED_SHA" ]] && ! cmp -s "$DUMP" "$ENC"; then
  check PASS "Encrypted with AES-256; decryption returns the identical dump" "sha256 $PLAIN_SHA"
else
  check FAIL "Encrypted with AES-256; decryption returns the identical dump"
fi
{
  echo "backdesk backup drill · mode $MODE · $STAMP"
  echo "file: $(basename "$ENC")"
  echo "ciphertext bytes: $(stat -c %s "$ENC")  sha256: $CIPHER_SHA"
  echo "plaintext bytes: $(stat -c %s "$DUMP")  sha256: $PLAIN_SHA"
  echo "schemas: ${SCHEMAS[*]}  format: pg_dump custom (-Fc), $(pg run pg_dump --version)"
  echo "decrypt: gpg --decrypt --output backdesk.dump $(basename "$ENC")"
} >"$OUT/encrypted/manifest.txt"

# --- Restore into the throwaway target ----------------------------------------------
# Roles: the image already has Supabase's own roles. Any other role the source
# has (none expected) is created without login so ownership and grants restore.
target_psql -c "select rolname from pg_roles where rolname !~ '^pg_' order by 1" >"$WORK/target-roles.txt"
missing_roles="$(comm -23 "$WORK/source-roles.txt" "$WORK/target-roles.txt")"
for role in $missing_roles; do
  target_psql -c "create role \"$role\" nologin"
done
# The image ships a stand-in auth schema: the backup's replaces it. Its public
# schema is kept as Supabase creates it (dropping it would lose grants that
# live in its initial privileges), so the dump's own "CREATE SCHEMA public"
# entry is skipped; the dump's grants on it still apply.
target_psql -c 'drop schema if exists auth cascade' -c 'drop schema if exists private cascade'
if [[ -n "$(target_psql -c "select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' limit 1")" ]]; then
  echo "drill: the restore image's public schema is not empty" >&2; exit 1
fi
# Default privileges in public start empty, so the dump's own entries
# reproduce the source's exactly: the image grants anon and authenticated by
# default, which the migrations revoke and a dump cannot express as a revoke.
target_psql >/dev/null <<'SQL'
do $$
declare d record; g record;
begin
  for d in select pg_get_userbyid(a.defaclrole) as role, a.defaclobjtype as t, a.defaclacl as acl
           from pg_default_acl a join pg_namespace n on n.oid = a.defaclnamespace where n.nspname = 'public' loop
    for g in select distinct case when x.grantee = 0 then 'public' else quote_ident(pg_get_userbyid(x.grantee)) end as grantee
             from aclexplode(d.acl) x loop
      execute format('alter default privileges for role %I in schema public revoke all on %s from %s', d.role,
                     case d.t when 'r' then 'tables' when 'S' then 'sequences' when 'f' then 'functions' when 'T' then 'types' end,
                     g.grantee);
    end loop;
  end loop;
end;
$$;
SQL
docker cp "$WORK/restore.dump" "$TARGET:/tmp/restore.dump" >/dev/null
docker exec "$TARGET" chmod 644 /tmp/restore.dump
pg "$TARGET" sh -c 'pg_restore --list /tmp/restore.dump | grep -v " SCHEMA - public " > /tmp/restore.list'
if pg "$TARGET" pg_restore --host=localhost --username=supabase_admin --dbname=postgres --exit-on-error --single-transaction \
     --use-list=/tmp/restore.list /tmp/restore.dump \
     >"$WORK/restore.log" 2>&1; then
  check PASS "pg_restore into a throwaway Supabase Postgres $IMAGE_MAJOR container" "single transaction, stop on first error${missing_roles:+, created roles: $missing_roles}"
else
  check FAIL "pg_restore into a throwaway Supabase Postgres $IMAGE_MAJOR container" "$(grep -m1 -i error "$WORK/restore.log" | cut -c1-200)"
fi
docker exec "$TARGET" shred -u /tmp/restore.dump || true

# Self-test only: damage the restored copy to prove the checks below catch it.
if [[ "$MODE" == "self-test" && -n "${DRILL_TAMPER:-}" ]]; then
  target_psql -c "delete from public.units where ctid = (select min(ctid) from public.units)" \
              -c "grant select on public.units to anon"
  log "tampered with the restored copy (self-test): one apartment deleted, anon granted select on units"
fi

# --- Compare the restored copy with the source ---------------------------------------
target_psql -c 'begin transaction read only' -c 'set local search_path = pg_catalog' -F $'\t' -f /dev/stdin -c 'commit' <"$WORK/fingerprint.sql" >"$WORK/restored.tsv"
for section in table constraint index trigger policy acl function type sequence schema rows data; do
  src="$(grep -c "^$section"$'\t' "$WORK/source-after.tsv" || true)"
  if diff <(grep "^$section"$'\t' "$WORK/source-after.tsv") <(grep "^$section"$'\t' "$WORK/restored.tsv") >"$WORK/diff-$section.txt"; then
    check PASS "Restored $section fingerprints match the source" "$src objects"
  else
    # Object names only, never values that could carry data.
    names="$(grep -E '^[<>]' "$WORK/diff-$section.txt" | cut -f2 | sort -u | head -n 8 | paste -sd, -)"
    check FAIL "Restored $section fingerprints match the source" "differs: $names"
  fi
done
users="$(grep -P '^rows\tauth\.users\t' "$WORK/source-after.tsv" | cut -f3)"
units="$(grep -P '^rows\tpublic\.units\t' "$WORK/source-after.tsv" | cut -f3)"

# The repository's own read-only post-migration checks, against the restored copy.
if pg "$TARGET" psql -X -v ON_ERROR_STOP=1 -q -At -F $'\t' -h localhost -U supabase_admin -d postgres -f /dev/stdin \
     <"$ROOT/docs/verify_after_migration.sql" >"$WORK/verify.tsv" 2>"$WORK/verify.err"; then
  fails="$(grep -c $'\tFAIL\t' "$WORK/verify.tsv" || true)"
  if [[ "$fails" == "0" ]]; then
    check PASS "docs/verify_after_migration.sql on the restored copy" "$(grep -c $'\tPASS\t' "$WORK/verify.tsv" || true) PASS rows"
  else
    check FAIL "docs/verify_after_migration.sql on the restored copy" "$(grep $'\tFAIL\t' "$WORK/verify.tsv" | cut -f1 | paste -sd, -)"
  fi
else
  check FAIL "docs/verify_after_migration.sql on the restored copy" "$(head -c 200 "$WORK/verify.err")"
fi

# --- Report ---------------------------------------------------------------------------
{
  echo "# Backdesk backup drill — $( ((FAILED)) && echo FAIL || echo PASS )"
  echo
  echo "Mode \`$MODE\` · $STAMP · source Postgres $(grep -P '^info\tserver_version\t' "$WORK/source-after.tsv" | cut -f3) · restore image \`$IMAGE\`"
  echo "Backed up: schemas ${SCHEMAS[*]} (auth.users rows: ${users:-?}, public.units rows: ${units:-?})."
  echo "Not backed up: Storage objects (files), the storage, realtime, vault, extensions, graphql, cron and other Supabase-managed schemas, roles' passwords and memberships, project settings (Auth providers, redirect URLs, API keys). See docs/BACKUP_DRILL.md."
  echo
  echo "| Result | Check | Detail |"
  echo "|---|---|---|"
  cat "$REPORT"
} >"$REPORT.tmp" && mv "$REPORT.tmp" "$REPORT"
cat "$REPORT"
[[ -n "${GITHUB_STEP_SUMMARY:-}" ]] && cat "$REPORT" >>"$GITHUB_STEP_SUMMARY"
exit "$FAILED"
