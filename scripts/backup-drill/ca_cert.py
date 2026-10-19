"""Validate the CA certificate the backup drill's production mode must verify TLS against.

Reads the PEM text from the environment variable BACKUP_DB_CA_CERT (the
repository secret holding Supabase's CA certificate, docs/BACKUP_DRILL.md,
"TLS"), never from argv, and refuses:

  * a missing, empty or whitespace-only value;
  * anything that is not one or more PEM "CERTIFICATE" blocks, such as a
    private key, a CSR, or text around the blocks;
  * a block whose contents are not a valid X.509 certificate.

Production runs are fail-closed: without a certificate that passes these
rules, drill.sh stops before it opens any connection to the source, and it
never falls back to an unverified sslmode. Error messages name the rule that
failed, never the certificate text.

On success it writes the certificate blocks, normalized, to the file given as
the only argument (mode 0644: the PEM is public, and the client container
reads it as its own user).

Run with `python3 -I` (isolated mode). Standard library only.
"""

import os
import re
import ssl
import sys

BLOCK = re.compile(r"-----BEGIN CERTIFICATE-----\r?\n(.*?)\r?\n-----END CERTIFICATE-----", re.S)
ANY_PEM = re.compile(r"-----BEGIN ([A-Z0-9 ]+)-----")
BASE64_LINE = re.compile(r"[A-Za-z0-9+/=]+")


def fail(rule: str) -> None:
    print(f"drill: BACKUP_DB_CA_CERT rejected: {rule}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: ca_cert.py <output file>")
    raw = os.environ.get("BACKUP_DB_CA_CERT", "")
    if not raw.strip():
        fail("it is missing or empty (production requires Supabase's CA certificate for sslmode=verify-full)")

    kinds = set(ANY_PEM.findall(raw))
    if kinds - {"CERTIFICATE"}:
        fail("it must contain only PEM CERTIFICATE blocks (no private key or other PEM type)")
    blocks = BLOCK.findall(raw)
    if not blocks:
        fail("it is not a PEM certificate")
    if BLOCK.sub("", raw).strip():
        fail("it contains text outside the PEM CERTIFICATE blocks")

    pems = []
    for body in blocks:
        lines = [line.strip() for line in body.splitlines() if line.strip()]
        if not lines or not all(BASE64_LINE.fullmatch(line) for line in lines):
            fail("a CERTIFICATE block is not base64")
        pem = "-----BEGIN CERTIFICATE-----\n" + "\n".join(lines) + "\n-----END CERTIFICATE-----\n"
        try:
            ssl.PEM_cert_to_DER_cert(pem)
        except ValueError:
            fail("a CERTIFICATE block is not valid PEM")
        # Each block on its own, so the store's de-duplication cannot hide a bad one.
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        try:
            context.load_verify_locations(cadata=pem)
        except ssl.SSLError:
            fail("a CERTIFICATE block is not a valid X.509 certificate")
        if context.cert_store_stats().get("x509", 0) != 1:
            fail("a CERTIFICATE block is not a valid X.509 certificate")
        pems.append(pem)

    bundle = "".join(pems)
    fd = os.open(sys.argv[1], os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    with os.fdopen(fd, "w", encoding="ascii") as out:
        out.write(bundle)
    os.chmod(sys.argv[1], 0o644)


if __name__ == "__main__":
    main()
