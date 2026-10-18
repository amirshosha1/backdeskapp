"""Regression tests for the backup drill's fail-closed production TLS.

Run: python3 -I scripts/backup-drill/test_tls_policy.py (the drill's
pull-request job does). Standard library only; needs bash, but no Docker,
no database and no secret: production mode runs against a fake `docker`
that records what it would have executed.

It proves that production mode:
  * refuses a missing, empty, malformed or key-bearing BACKUP_DB_CA_CERT
    before any container starts or any connection is attempted;
  * refuses a connection string that asks for unverified TLS;
  * passes sslmode=verify-full and the validated certificate to every source
    connection, whatever PGSSLMODE/PGSSLROOTCERT the caller's environment
    holds, and stops (no retry, no weaker mode) when that connection fails.
"""

import os
import stat
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
CA_CERT = os.path.join(HERE, "ca_cert.py")
DRILL = os.path.join(HERE, "drill.sh")
GOOD_URL = "postgresql://postgres.kmmfhaypqgzhoptmljki:S3cr3t-pw@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
PASSPHRASE = "p" * 40

# A throwaway self-signed CA made for these tests; its private key was discarded.
# Public certificate only, trusted nowhere.
TEST_CA = """-----BEGIN CERTIFICATE-----
MIIBxzCCAW2gAwIBAgIUI7ipGa6NtwCg+PO/s6DzerG7B4MwCgYIKoZIzj0EAwIw
ODE2MDQGA1UEAwwtYmFja2Rlc2stZHJpbGwtdGVzdC1jYSAobm90IHRydXN0ZWQg
YW55d2hlcmUpMCAXDTI2MTAxODE1MDM0MVoYDzIxMjYwOTI0MTUwMzQxWjA4MTYw
NAYDVQQDDC1iYWNrZGVzay1kcmlsbC10ZXN0LWNhIChub3QgdHJ1c3RlZCBhbnl3
aGVyZSkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQrz4bbkjv/0azmyd74xme6
nIK/8aZtnH/Jpjlo1p9w6R5pwYRe5QYLvMtHBXzg16kTGQhOVeto+tvkxTJDqozr
o1MwUTAdBgNVHQ4EFgQUPkfKOkJacb/ojSeCIifVkYsmzo4wHwYDVR0jBBgwFoAU
PkfKOkJacb/ojSeCIifVkYsmzo4wDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQD
AgNIADBFAiEAgCiqNE1SEM3d44GeBbjerQT8Q99ZSBm4k7EfSc6UJBECIGP/0JZg
gcx7rWtczsBDJX12ZKja14kJcFnWZy2+Vtfc
-----END CERTIFICATE-----
"""
FAKE_KEY = "-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n"

BAD_CERTS = {
    "missing": None,
    "empty": "",
    "whitespace only": " \n\t\n",
    "not PEM": "this is not a certificate",
    "BEGIN line only": "-----BEGIN CERTIFICATE-----\n",
    "not base64": "-----BEGIN CERTIFICATE-----\n!!!not base64!!!\n-----END CERTIFICATE-----\n",
    "base64 but not a certificate": "-----BEGIN CERTIFICATE-----\nAAAAAAAAAAAAAAAA\n-----END CERTIFICATE-----\n",
    "private key only": FAKE_KEY,
    "certificate plus private key": TEST_CA + FAKE_KEY,
    "text around the certificate": "subject=Supabase\n" + TEST_CA,
}

# Records every call and the TLS settings a source connection would get. Every
# command "succeeds" except a source connection (`run --rm ... --network`),
# which fails as libpq does when the server's certificate does not verify.
FAKE_DOCKER = r"""#!/usr/bin/env bash
log="$FAKE_DOCKER_LOG"
printf 'call %s\n' "$*" >>"$log"
if [[ "$1" == "run" && "$2" == "--rm" && " $* " == *" --network "* ]]; then
  work=""; prev=""
  # The first -v is docker's mount; later ones belong to psql (-v ON_ERROR_STOP=1).
  for a in "$@"; do [[ -z "$work" && "$prev" == "-v" ]] && work="${a%%:/work}"; prev="$a"; done
  printf 'source PGSSLMODE=%s PGSSLROOTCERT=%s passes_rootcert=%s ca_present=%s\n' \
    "${PGSSLMODE:-}" "${PGSSLROOTCERT:-}" \
    "$([[ " $* " == *" -e PGSSLROOTCERT "* ]] && echo yes || echo no)" \
    "$([[ -n "$work" && -s "$work/source-ca.crt" ]] && echo yes || echo no)" >>"$log"
  echo "psql: error: SSL error: certificate verify failed" >&2
  exit 2
fi
exit 0
"""


def run_ca_cert(value):
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, "ca.crt")
        env = {"PATH": os.environ.get("PATH", "")}
        if value is not None:
            env["BACKUP_DB_CA_CERT"] = value
        proc = subprocess.run([sys.executable, "-I", CA_CERT, out], env=env, capture_output=True, text=True)
        content = mode = None
        if os.path.exists(out):
            mode = stat.S_IMODE(os.stat(out).st_mode)
            with open(out, encoding="ascii") as f:
                content = f.read()
        return proc, content, mode


def run_production(ca, url=GOOD_URL, extra_env=None):
    """drill.sh production against the fake docker; returns (process, docker log lines, report text)."""
    with tempfile.TemporaryDirectory() as tmp:
        bindir = os.path.join(tmp, "bin")
        os.mkdir(bindir)
        docker = os.path.join(bindir, "docker")
        with open(docker, "w", encoding="utf-8") as f:
            f.write(FAKE_DOCKER)
        os.chmod(docker, 0o755)
        log = os.path.join(tmp, "docker.log")
        open(log, "w").close()
        out = os.path.join(tmp, "out")
        env = {
            "PATH": bindir + os.pathsep + os.environ.get("PATH", ""),
            "HOME": tmp,
            "TMPDIR": tmp,
            "OUT": out,
            "FAKE_DOCKER_LOG": log,
            "SOURCE_URL": url,
            "BACKUP_PASSPHRASE": PASSPHRASE,
        }
        if ca is not None:
            env["BACKUP_DB_CA_CERT"] = ca
        env.update(extra_env or {})
        proc = subprocess.run(["bash", DRILL, "production"], env=env, capture_output=True, text=True, timeout=120)
        with open(log, encoding="utf-8") as f:
            lines = f.read().splitlines()
        report = ""
        if os.path.exists(os.path.join(out, "report.md")):
            with open(os.path.join(out, "report.md"), encoding="utf-8") as f:
                report = f.read()
        return proc, lines, report


def started_anything(lines):
    """True if the drill started a container or created its network (cleanup's rm calls do not count)."""
    return any(line.startswith(("call run", "call network create", "call exec")) for line in lines)


class CaCertValidation(unittest.TestCase):
    def test_accepts_a_pem_certificate_and_writes_it_readable(self):
        for value in (TEST_CA, TEST_CA.replace("\n", "\r\n"), TEST_CA + TEST_CA, "\n" + TEST_CA + "\n\n"):
            proc, content, mode = run_ca_cert(value)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertIn("-----BEGIN CERTIFICATE-----\nMIIBxzCC", content)
            self.assertEqual(mode, 0o644)

    def test_rejects_everything_else_without_printing_it(self):
        for name, value in BAD_CERTS.items():
            proc, content, _ = run_ca_cert(value)
            self.assertNotEqual(proc.returncode, 0, name)
            self.assertIsNone(content, name)
            self.assertIn("BACKUP_DB_CA_CERT rejected", proc.stderr, name)
            self.assertNotIn("MIIBxzCC", proc.stderr, name)
            self.assertNotIn("AAAA", proc.stderr, name)
            self.assertEqual(proc.stdout, "", name)


class ProductionIsFailClosed(unittest.TestCase):
    def test_refuses_a_missing_or_invalid_certificate_before_connecting(self):
        for name, value in BAD_CERTS.items():
            proc, lines, report = run_production(value)
            self.assertNotEqual(proc.returncode, 0, name)
            self.assertIn("BACKUP_DB_CA_CERT rejected", proc.stderr, name)
            self.assertFalse(started_anything(lines), f"{name}: docker was used: {lines}")
            self.assertNotIn("source PGSSLMODE", "\n".join(lines), name)
            self.assertNotIn("TLS verified", report, name)

    def test_refuses_a_connection_string_that_asks_for_unverified_tls(self):
        for mode in ("require", "prefer", "disable", "verify-ca"):
            proc, lines, _ = run_production(TEST_CA, url=f"{GOOD_URL}?sslmode={mode}")
            self.assertNotEqual(proc.returncode, 0, mode)
            self.assertIn("SOURCE_URL rejected", proc.stderr, mode)
            self.assertFalse(started_anything(lines), f"{mode}: docker was used: {lines}")

    def test_every_source_connection_is_verify_full_and_a_failed_verification_stops_the_drill(self):
        # A hostile environment must not weaken TLS: drill.sh sets its own values.
        proc, lines, report = run_production(
            TEST_CA, extra_env={"PGSSLMODE": "disable", "PGSSLROOTCERT": "/nonexistent/evil.crt"}
        )
        self.assertNotEqual(proc.returncode, 0, "a connection that fails TLS verification must fail the drill")
        sources = [line for line in lines if line.startswith("source ")]
        self.assertEqual(len(sources), 1, f"exactly one attempt, no retry or downgrade: {lines}")
        self.assertEqual(
            sources[0], "source PGSSLMODE=verify-full PGSSLROOTCERT=/work/source-ca.crt passes_rootcert=yes ca_present=yes"
        )
        self.assertIn("sslmode verify-full", report)
        self.assertNotIn("TLS verified", report, "the PASS row is written only after a verified connection")
        self.assertNotIn("require", report)


if __name__ == "__main__":
    unittest.main()
