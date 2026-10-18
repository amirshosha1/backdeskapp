#!/usr/bin/env bash
# Backdesk backup drill: dump → encrypt → decrypt → restore into a throwaway
# Supabase Postgres container → prove the copy matches the source.
#
# The result is a PARTIAL DATABASE BACKUP (the auth, public and private
# schemas), not a recovery of the whole Supabase project: see
# docs/BACKUP_DRILL.md, "What this is and is not".
#
#   drill.sh self-test    source = a throwaway container, migrated with
#                         supabase/migrations/ and seeded with synthetic data.
#                         Needs no secrets. Runs on pull requests. With
#                         DRILL_TAMPER=1 it damages the restored copy and must
#                         FAIL, which proves the checks catch a bad restore.
#   drill.sh production   source = the hosted project, read-only. Needs
#                         SOURCE_URL (session pooler, validated strictly by
#                         source_url.py) and BACKUP_PASSPHRASE; optional
#                         BACKUP_DB_CA_CERT (PEM) for verify-full TLS. Runs only
#                         from the manual workflow (docs/BACKUP_DRILL.md).
#
# What it reads from the source, never writing to it: catalog sizes, role
# names, the catalog fingerprint (fingerprint.sql) and the CHECK/policy
# definitions (expressions.sql), each inside a READ ONLY transaction with a
# statement and lock timeout, and a pg_dump of the three schemas (pg_dump
# itself only reads) under a wall-clock limit.
#
# Limits (environment variables, defaults in brackets; docs/BACKUP_DRILL.md):
#   DRILL_MAX_TOTAL_BYTES  [536870912]  refuse if the three schemas are larger
#   DRILL_MAX_TABLE_BYTES  [134217728]  refuse if any one table is larger
#   DRILL_STATEMENT_TIMEOUT [120s]      per read-only statement on the source
#   DRILL_LOCK_TIMEOUT     [5s]         never queue behind another session's lock
#   DRILL_DUMP_TIMEOUT     [900]        seconds for pg_dump
#
# Output in $OUT (default ./backup-drill-out):
#   encrypted/backdesk-<stamp>.dump.gpg   the backup, AES-256 (gpg symmetric)
#   encrypted/manifest.txt                sizes and SHA-256 of plaintext and ciphertext
#   report.md                             PASS/FAIL/INFO per check, no row data
# Plaintext copies stay in a private temporary directory and are shredded on exit.
#
# Needs: bash, docker, gpg, sha256sum, python3. Every Postgres client runs
# inside $IMAGE, so pg_dump/pg_restore/psql always match the restore server.
set -euo pipefail
umask 077

MODE="${1:-}"
[[ "$MODE" == "self-test" || "$MODE" == "production" ]] || { echo "usage: drill.sh self-test|production" >&2; exit 2; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$ROOT/scripts/backup-drill"
IMAGE="${IMAGE:-supabase/postgres:17.6.1.172}"
OUT="$(mkdir -p "${OUT:-$ROOT/backup-drill-out}" && cd "${OUT:-$ROOT/backup-drill-out}" && pwd)"
SCHEMAS=(auth public private)
MAX_TOTAL_BYTES="${DRILL_MAX_TOTAL_BYTES:-536870912}"
MAX_TABLE_BYTES="${DRILL_MAX_TABLE_BYTES:-134217728}"
STATEMENT_TIMEOUT="${DRILL_STATEMENT_TIMEOUT:-120s}"
LOCK_TIMEOUT="${DRILL_LOCK_TIMEOUT:-5s}"
DUMP_TIMEOUT="${DRILL_DUMP_TIMEOUT:-900}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ID="drill-$$-$RANDOM"
NET="$ID-net"
TARGET="$ID-target"
SOURCE_CONTAINER="$ID-source"
WORK="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/backdesk-drill.XXXXXX")"
LOCAL_PW="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"
FAILED=0

[[ "$MAX_TOTAL_BYTES" =~ ^[0-9]+$ && "$MAX_TABLE_BYTES" =~ ^[0-9]+$ && "$DUMP_TIMEOUT" =~ ^[0-9]+$ ]] \
  || { echo "drill: size and dump limits must be whole numbers" >&2; exit 2; }
[[ "$STATEMENT_TIMEOUT" =~ ^[0-9]+(ms|s|min)?$ && "$LOCK_TIMEOUT" =~ ^[0-9]+(ms|s|min)?$ ]] \
  || { echo "drill: timeouts must look like 120s, 5000ms or 2min" >&2; exit 2; }

mkdir -p "$OUT/encrypted"
REPORT="$OUT/report.md"
: >"$REPORT"

cleanup() {
  # DRILL_KEEP (self-test only, for debugging) keeps the two containers; files are always shredded.
  if [[ "$MODE" == "self-test" && -n "${DRILL_KEEP:-}" ]]; then
    echo "drill: kept $SOURCE_CONTAINER and $TARGET (self-test only)"
  else
    docker rm -f "$TARGET" "$SOURCE_CONTAINER" "$ID-dump" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
  fi
  # Plaintext dump, decrypted copy, credentials, fingerprints: overwrite, then delete.
  find "$WORK" -type f -exec shred -u {} + 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT

log() { echo "drill: $*"; }
check() { # check PASS|FAIL|INFO "what" "detail" — INFO never fails the drill
  local detail="${3:-}"
  detail="${detail//$'\n'/ }"
  detail="${detail//|/\\|}"
  set -- "$1" "$2" "$detail"
  printf '| %s | %s | %s |\n' "$1" "$2" "$3" >>"$REPORT"
  [[ "$1" == "PASS" || "$1" == "INFO" ]] || FAILED=1
  log "$1 — $2${3:+ ($3)}"
}

# --- Source connection --------------------------------------------------------------
# Every source connection uses libpq environment variables inside a subshell:
# no connection string or password ever appears in argv, `docker inspect` of
# the target, or the log.
if [[ "$MODE" == "production" ]]; then
  : "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"
  (( ${#BACKUP_PASSPHRASE} >= 32 )) || { echo "drill: BACKUP_PASSPHRASE must be at least 32 characters" >&2; exit 1; }
  python3 -I "$HERE/source_url.py" "$WORK/source.conn"   # reads SOURCE_URL; exits non-zero with the failed rule
  unset SOURCE_URL
  { IFS= read -r -d '' SRC_HOST; IFS= read -r -d '' SRC_PORT; IFS= read -r -d '' SRC_USER
    IFS= read -r -d '' SRC_PASSWORD; IFS= read -r -d '' SRC_DB; IFS= read -r -d '' SRC_SSLMODE; } <"$WORK/source.conn"
  shred -u "$WORK/source.conn"
  # GitHub masks the whole secret; mask the password on its own as well.
  [[ -n "${GITHUB_ACTIONS:-}" ]] && echo "::add-mask::$SRC_PASSWORD"
  SRC_ROOTCERT=""
  if [[ -n "${BACKUP_DB_CA_CERT:-}" ]]; then
    printf '%s\n' "$BACKUP_DB_CA_CERT" >"$WORK/source-ca.crt"
    grep -q 'BEGIN CERTIFICATE' "$WORK/source-ca.crt" || { echo "drill: BACKUP_DB_CA_CERT is not a PEM certificate" >&2; exit 1; }
    chmod 644 "$WORK/source-ca.crt"
    SRC_SSLMODE="verify-full"
    SRC_ROOTCERT="/work/source-ca.crt"
  elif [[ "$SRC_SSLMODE" == "verify-full" ]]; then
    echo "drill: sslmode=verify-full needs BACKUP_DB_CA_CERT (Supabase's CA certificate)" >&2; exit 1
  fi
else
  # Throwaway values for the self-test; never a real secret.
  BACKUP_PASSPHRASE="$(head -c 48 /dev/urandom | base64)"
  SRC_HOST="$SOURCE_CONTAINER"; SRC_PORT=5432; SRC_USER=postgres; SRC_PASSWORD="$LOCAL_PW"; SRC_DB=postgres
  SRC_SSLMODE=disable; SRC_ROOTCERT=""
fi
export BACKUP_PASSPHRASE

# Clients run in the image; $WORK is mounted at /work.
src_run() ( # src_run [--name N] <cmd...> — a client container connected to the source
  export PGHOST="$SRC_HOST" PGPORT="$SRC_PORT" PGUSER="$SRC_USER" PGPASSWORD="$SRC_PASSWORD" PGDATABASE="$SRC_DB" \
         PGSSLMODE="$SRC_SSLMODE" PGAPPNAME="backdesk-backup-drill" PGCONNECT_TIMEOUT=15
  local env=(-e PGHOST -e PGPORT -e PGUSER -e PGPASSWORD -e PGDATABASE -e PGSSLMODE -e PGAPPNAME -e PGCONNECT_TIMEOUT)
  if [[ -n "$SRC_ROOTCERT" ]]; then export PGSSLROOTCERT="$SRC_ROOTCERT"; env+=(-e PGSSLROOTCERT); fi
  local name=()
  if [[ "${1:-}" == "--name" ]]; then name=(--name "$2"); shift 2; fi
  docker run --rm "${name[@]}" --network "$NET" -v "$WORK:/work" "${env[@]}" "$IMAGE" "$@"
)
source_ro() { # read-only, time-limited query against the source; output on stdout
  src_run psql -X -v ON_ERROR_STOP=1 -q -At \
    -c 'begin transaction read only' \
    -c "set local statement_timeout = '$STATEMENT_TIMEOUT'" -c "set local lock_timeout = '$LOCK_TIMEOUT'" \
    -c "set local idle_in_transaction_session_timeout = '60s'" -c 'set local search_path = pg_catalog' \
    "$@" -c 'commit'
}
target_exec() { docker exec -i -e PGPASSWORD="$LOCAL_PW" "$TARGET" "$@"; }
target_psql() { target_exec psql -X -v ON_ERROR_STOP=1 -q -At -h localhost -U supabase_admin -d postgres "$@"; }

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
cp "$HERE/fingerprint.sql" "$HERE/expressions.sql" "$WORK/"
chmod 644 "$WORK/fingerprint.sql" "$WORK/expressions.sql"
chmod 777 "$WORK"   # the image's tools run as their own user

if [[ "$MODE" == "self-test" ]]; then
  start_db "$SOURCE_CONTAINER"
  # Migrations run as postgres, as the Supabase GitHub integration applies them.
  for f in "$ROOT"/supabase/migrations/*.sql; do
    docker exec -i -e PGPASSWORD="$LOCAL_PW" "$SOURCE_CONTAINER" psql -X -v ON_ERROR_STOP=1 -q -h localhost -U postgres -d postgres <"$f" >/dev/null
  done
  docker exec -i -e PGPASSWORD="$LOCAL_PW" "$SOURCE_CONTAINER" psql -X -v ON_ERROR_STOP=1 -q -h localhost -U supabase_admin -d postgres <"$HERE/seed.sql" >/dev/null
  log "source: throwaway container, $(find "$ROOT/supabase/migrations" -name '*.sql' | wc -l) migrations, synthetic seed"
else
  check INFO "Connection" "session pooler, project user, port $SRC_PORT, database $SRC_DB, sslmode $SRC_SSLMODE"
  if [[ "$SRC_SSLMODE" == "require" ]]; then
    check INFO "TLS" "encrypted; server certificate not verified (add BACKUP_DB_CA_CERT for verify-full)"
  fi
fi

# --- Preflight: version and size, before anything expensive --------------------------------
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

read -r TOTAL_BYTES LARGEST_BYTES < <(source_ro -F ' ' -c "
  select coalesce(sum(pg_total_relation_size(c.oid)), 0), coalesce(max(pg_total_relation_size(c.oid)), 0)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p') and n.nspname in ('auth', 'public', 'private')")
if (( TOTAL_BYTES <= MAX_TOTAL_BYTES && LARGEST_BYTES <= MAX_TABLE_BYTES )); then
  check PASS "Size within the drill's limits" "schemas $TOTAL_BYTES bytes (limit $MAX_TOTAL_BYTES), largest table $LARGEST_BYTES (limit $MAX_TABLE_BYTES)"
else
  check FAIL "Size within the drill's limits" "schemas $TOTAL_BYTES bytes (limit $MAX_TOTAL_BYTES), largest table $LARGEST_BYTES (limit $MAX_TABLE_BYTES); see docs/BACKUP_DRILL.md before raising"
  exit 1
fi

# --- Fingerprint, dump, fingerprint again ----------------------------------------
source_ro -F $'\t' -f /work/fingerprint.sql >"$WORK/source-before.tsv"
source_ro -c "select rolname from pg_roles where rolname !~ '^pg_' order by 1" >"$WORK/source-roles.txt"

DUMP="$WORK/backdesk-$STAMP.dump"
if src_run --name "$ID-dump" timeout -s TERM -k 30 "$DUMP_TIMEOUT" \
     pg_dump --format=custom --compress=9 --no-subscriptions --no-publications --lock-wait-timeout="$LOCK_TIMEOUT" \
     "${SCHEMAS[@]/#/--schema=}" --file="/work/$(basename "$DUMP")" 2>"$WORK/dump.err"; then
  check PASS "pg_dump of auth, public and private completed" "$(stat -c %s "$DUMP") bytes, limit ${DUMP_TIMEOUT}s"
else
  check FAIL "pg_dump of auth, public and private completed" "$(grep -m1 -iE 'error|timeout|terminated' "$WORK/dump.err" | cut -c1-160)"
  exit 1
fi

source_ro -F $'\t' -f /work/fingerprint.sql >"$WORK/source-after.tsv"
source_ro -f /work/expressions.sql >"$WORK/source-expressions.jsonl"
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
  echo "PARTIAL DATABASE BACKUP: schemas ${SCHEMAS[*]} only. Not a Supabase project recovery (docs/BACKUP_DRILL.md)."
  echo "file: $(basename "$ENC")"
  echo "ciphertext bytes: $(stat -c %s "$ENC")  sha256: $CIPHER_SHA"
  echo "plaintext bytes: $(stat -c %s "$DUMP")  sha256: $PLAIN_SHA"
  echo "format: pg_dump custom (-Fc), $(docker run --rm "$IMAGE" pg_dump --version)"
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
target_exec sh -c 'pg_restore --list /tmp/restore.dump | grep -v " SCHEMA - public " > /tmp/restore.list'
if target_exec pg_restore --host=localhost --username=supabase_admin --dbname=postgres --exit-on-error --single-transaction \
     --use-list=/tmp/restore.list /tmp/restore.dump >"$WORK/restore.log" 2>&1; then
  check PASS "pg_restore into a throwaway Supabase Postgres $IMAGE_MAJOR container" "single transaction, stop on first error${missing_roles:+, created roles: $missing_roles}"
else
  check FAIL "pg_restore into a throwaway Supabase Postgres $IMAGE_MAJOR container" "$(grep -m1 -i error "$WORK/restore.log" | cut -c1-200)"
fi
docker exec "$TARGET" shred -u /tmp/restore.dump || true

# Self-test only: damage the restored copy to prove the checks below catch it.
if [[ "$MODE" == "self-test" && -n "${DRILL_TAMPER:-}" ]]; then
  target_psql -c "delete from public.units where ctid = (select min(ctid) from public.units)" \
              -c "grant select on public.units to anon" \
              -c "alter policy \"users read their own profile\" on public.profiles using (true)" \
              -c "alter table public.units drop constraint units_name_check" \
              -c "alter table public.units add constraint units_name_check check (char_length(name) between 1 and 61)"
  log "tampered with the restored copy (self-test): one apartment deleted, anon granted select on units, a policy opened, a check loosened"
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

# CHECK constraints and policy expressions: re-parse each source definition
# on the restore server and compare (canonicalize.sql). Always rolled back.
docker cp "$WORK/source-expressions.jsonl" "$TARGET:/tmp/source-expressions.jsonl" >/dev/null
docker cp "$HERE/canonicalize.sql" "$TARGET:/tmp/canonicalize.sql" >/dev/null
docker exec "$TARGET" chmod 644 /tmp/source-expressions.jsonl /tmp/canonicalize.sql
if target_psql -F $'\t' -c 'begin' -c 'set local search_path = pg_catalog' \
     -c 'create temp table drill_src (line text) on commit drop' \
     -c "\\copy drill_src from '/tmp/source-expressions.jsonl' with (format csv, delimiter e'\\x01', quote e'\\x02')" \
     -f /tmp/canonicalize.sql -c 'rollback' >"$WORK/expressions.tsv" 2>"$WORK/expressions.err"; then
  compared="$(grep -P '^count\t' "$WORK/expressions.tsv" | cut -f2 || true)"
  mismatches="$( (grep -vP '^count\t' "$WORK/expressions.tsv" || true) | cut -f1-4 | sed 's/\t/ /g' | head -n 6 | paste -sd';' -)"
  expected="$(wc -l <"$WORK/source-expressions.jsonl" | tr -d ' ')"
  if [[ -z "$mismatches" && "$compared" == "$expected" ]]; then
    check PASS "Restored CHECK constraints and policy expressions match the source (re-parsed by the restore server)" "$compared definitions"
  else
    check FAIL "Restored CHECK constraints and policy expressions match the source (re-parsed by the restore server)" "${mismatches:-compared $compared of $expected}"
  fi
else
  check FAIL "Restored CHECK constraints and policy expressions match the source (re-parsed by the restore server)" "$(head -c 200 "$WORK/expressions.err")"
fi
docker exec "$TARGET" rm -f /tmp/source-expressions.jsonl /tmp/canonicalize.sql || true

users="$(grep -P '^rows\tauth\.users\t' "$WORK/source-after.tsv" | cut -f3)"
units="$(grep -P '^rows\tpublic\.units\t' "$WORK/source-after.tsv" | cut -f3)"

# The repository's own read-only post-migration checks, against the restored copy.
if target_psql -F $'\t' -f /dev/stdin <"$ROOT/docs/verify_after_migration.sql" >"$WORK/verify.tsv" 2>"$WORK/verify.err"; then
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
  echo "**Partial database backup, not a Supabase project recovery.** Mode \`$MODE\` · $STAMP · source Postgres $(grep -P '^info\tserver_version\t' "$WORK/source-after.tsv" | cut -f3) · restore image \`$IMAGE\`"
  echo
  echo "Backed up: schemas ${SCHEMAS[*]} (auth.users rows: ${users:-?}, public.units rows: ${units:-?})."
  echo "Not backed up: Storage objects (files), the storage, realtime, vault, extensions, graphql, cron and other Supabase-managed schemas, roles' passwords and memberships, project settings (Auth providers, redirect URLs, API keys, SMTP). See docs/BACKUP_DRILL.md."
  echo
  echo "| Result | Check | Detail |"
  echo "|---|---|---|"
  cat "$REPORT"
} >"$REPORT.tmp" && mv "$REPORT.tmp" "$REPORT"
cat "$REPORT"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then cat "$REPORT" >>"$GITHUB_STEP_SUMMARY"; fi
exit "$FAILED"
