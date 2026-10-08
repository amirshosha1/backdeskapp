#!/usr/bin/env bash
# Database tests (`pnpm test:db`): RLS, grants, triggers and functions of
# supabase/migrations/, run against a throwaway local Postgres cluster that
# mirrors Supabase's role layout. Never touches the hosted Supabase project
# and needs no secrets (CLAUDE.md §5).
#
# The cluster's bootstrap superuser is `supabase_admin`, as on Supabase, so
# `postgres` (which owns everything the migrations create) is NOT a
# superuser: a migration that would need superuser rights fails here the
# same way it would fail when Supabase applies it.
#
# Runs on Linux with the Postgres server binaries installed (Claude Code on
# the web; GitHub Actions' ubuntu runners). Extra arguments go to Vitest.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

find_bindir() {
  if [[ -n "${PG_BINDIR:-}" ]]; then echo "$PG_BINDIR"; return; fi
  local newest
  newest="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -n 1 || true)"
  if [[ -n "$newest" && -x "$newest/initdb" ]]; then echo "$newest"; return; fi
  if command -v pg_config >/dev/null 2>&1 && [[ -x "$(pg_config --bindir)/initdb" ]]; then pg_config --bindir; return; fi
  echo "test-db: no Postgres server binaries found (set PG_BINDIR)" >&2
  exit 1
}

BINDIR="$(find_bindir)"
PORT="${TEST_PG_PORT:-54329}"
WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/backdesk-test-db.XXXXXX")"

# Postgres refuses to run as root; in a root shell, run the server as `postgres`.
RUN=()
if [[ "$(id -u)" == "0" ]]; then
  chown postgres "$WORKDIR"
  RUN=(runuser -u postgres --)
fi

cleanup() {
  "${RUN[@]}" "$BINDIR/pg_ctl" -D "$WORKDIR/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

"${RUN[@]}" "$BINDIR/initdb" -D "$WORKDIR/data" -U supabase_admin --auth=trust --encoding=UTF8 --no-locale >/dev/null
"${RUN[@]}" "$BINDIR/pg_ctl" -D "$WORKDIR/data" -l "$WORKDIR/server.log" -w \
  -o "-p $PORT -k $WORKDIR -c listen_addresses=''" start >/dev/null

echo "test-db: Postgres $("$BINDIR/postgres" --version | awk '{print $3}') on socket $WORKDIR, port $PORT"

cd "$ROOT"
TEST_PG_HOST="$WORKDIR" TEST_PG_PORT="$PORT" pnpm exec vitest run --config vitest.db.config.mts "$@"
