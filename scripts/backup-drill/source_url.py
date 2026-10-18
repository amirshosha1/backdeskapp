"""Validate the backup drill's production connection string and split it for libpq.

Reads the URL from the environment variable SOURCE_URL, never from argv, and
accepts only Backdesk's Supabase *session pooler* connection:

    postgresql://postgres.<project ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres[?sslmode=require|verify-full]

Anything else is refused: another project, the direct or transaction-mode
endpoint, another database, extra parameters (options, host, service, ...),
weaker TLS (disable, allow, prefer) or a malformed URL. Error messages name
the rule that failed, never the URL or any part of it.

On success it writes host, port, user, password, database and sslmode,
NUL-separated, to the file given as the only argument (created with mode
0600), for drill.sh to pass to libpq as environment variables.

Run with `python3 -I` (isolated mode). Standard library only.
"""

import os
import re
import sys
from urllib.parse import parse_qsl, unquote, urlsplit

PROJECT_REF = "kmmfhaypqgzhoptmljki"
REGION = "eu-west-1"  # Ireland (docs/project/OPERATIONS.md, "Regions").
HOST_PATTERN = re.compile(r"aws-[0-9]{1,2}-" + re.escape(REGION) + r"\.pooler\.supabase\.com")
SESSION_PORT = 5432  # Session mode. 6543 (transaction mode) cannot run pg_dump safely.
ALLOWED_SSLMODES = {"require", "verify-full"}


def fail(rule: str) -> None:
    print(f"drill: SOURCE_URL rejected: {rule}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: source_url.py <output file>")
    raw = os.environ.get("SOURCE_URL", "")
    if not raw:
        fail("it is empty")
    if raw != raw.strip() or any(ord(ch) < 0x21 or ord(ch) == 0x7F for ch in raw):
        fail("it contains whitespace or control characters")

    try:
        url = urlsplit(raw)
        port = url.port
    except ValueError:
        fail("it is not a valid URL")

    if url.scheme not in ("postgresql", "postgres"):
        fail("the scheme must be postgresql://")
    if url.fragment:
        fail("it must not have a #fragment")
    # urlsplit keeps the last '@'; a second '@' in the user part means an unencoded password.
    if url.netloc.count("@") != 1:
        fail("it must contain exactly one '@' (percent-encode '@' in the password)")

    user = unquote(url.username or "")
    password = unquote(url.password or "")
    host = (url.hostname or "").lower()
    database = unquote(url.path[1:] if url.path.startswith("/") else url.path)

    if user != f"postgres.{PROJECT_REF}":
        fail(f"the user must be postgres.{PROJECT_REF} (the Backdesk project's session pooler user)")
    if not password:
        fail("the password is missing")
    if not HOST_PATTERN.fullmatch(host):
        fail(f"the host must be Supabase's session pooler in {REGION} (aws-N-{REGION}.pooler.supabase.com)")
    if port != SESSION_PORT:
        fail(f"the port must be {SESSION_PORT} (session mode)")
    if database != "postgres":
        fail("the database must be postgres")

    params = parse_qsl(url.query, keep_blank_values=True, strict_parsing=False) if url.query else []
    names = [name for name, _ in params]
    if any(name != "sslmode" for name in names) or len(names) > 1:
        fail("the only parameter allowed is sslmode")
    sslmode = params[0][1] if params else "require"
    if sslmode not in ALLOWED_SSLMODES:
        fail("sslmode must be require or verify-full")

    fields = [host, str(port), user, password, database, sslmode]
    if any("\0" in field for field in fields):
        fail("it contains a NUL character")
    fd = os.open(sys.argv[1], os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as out:
        out.write("\0".join(fields) + "\0")


if __name__ == "__main__":
    main()
