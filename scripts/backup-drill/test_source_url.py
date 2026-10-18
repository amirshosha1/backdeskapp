"""Tests for source_url.py. Run: python3 -I scripts/backup-drill/test_source_url.py
(the backup drill's pull-request job does). Standard library only."""

import os
import stat
import subprocess
import sys
import tempfile
import unittest

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source_url.py")
REF = "kmmfhaypqgzhoptmljki"
SECRET = "S3cr3t-pw"
GOOD = f"postgresql://postgres.{REF}:{SECRET}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"


def run(url: str):
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, "conn")
        env = {"PATH": os.environ.get("PATH", ""), "SOURCE_URL": url}
        proc = subprocess.run([sys.executable, "-I", SCRIPT, out], env=env, capture_output=True, text=True)
        fields, mode = None, None
        if os.path.exists(out):
            mode = stat.S_IMODE(os.stat(out).st_mode)
            with open(out, encoding="utf-8") as f:
                fields = f.read().split("\0")[:-1]
        return proc, fields, mode


class AcceptsOnlyTheSessionPooler(unittest.TestCase):
    def test_accepts_the_session_pooler_url(self):
        for url in (GOOD, GOOD.replace("aws-0-", "aws-1-"), GOOD + "?sslmode=require", GOOD + "?sslmode=verify-full",
                    GOOD.replace("postgresql://", "postgres://")):
            proc, fields, mode = run(url)
            self.assertEqual(proc.returncode, 0, (url.replace(SECRET, "***"), proc.stderr))
            self.assertEqual(fields[0], "aws-0-eu-west-1.pooler.supabase.com" if "aws-0-" in url else "aws-1-eu-west-1.pooler.supabase.com")
            self.assertEqual(fields[1:5], ["5432", f"postgres.{REF}", SECRET, "postgres"])
            self.assertEqual(fields[5], "verify-full" if "verify-full" in url else "require")
            self.assertEqual(mode, 0o600)

    def test_decodes_a_percent_encoded_password(self):
        proc, fields, _ = run(GOOD.replace(SECRET, "p%40ss%3Aw%2Fo%25rd"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(fields[3], "p@ss:w/o%rd")

    def test_rejects_everything_else_without_printing_the_url(self):
        bad = {
            "another project": GOOD.replace(REF, "abcdefghijklmnopqrst"),
            "ref only in the password": f"postgresql://postgres.other:{REF}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
            "ref only in the database": f"postgresql://postgres.other:{SECRET}@aws-0-eu-west-1.pooler.supabase.com:5432/{REF}",
            "plain postgres user": GOOD.replace(f"postgres.{REF}", "postgres"),
            "direct connection host": f"postgresql://postgres:{SECRET}@db.{REF}.supabase.co:5432/postgres",
            "look-alike host": GOOD.replace("pooler.supabase.com", "pooler.supabase.com.evil.example"),
            "host with the ref as subdomain": GOOD.replace("aws-0-eu-west-1.pooler.supabase.com", f"{REF}.evil.example"),
            "other region": GOOD.replace("eu-west-1", "us-east-1"),
            "transaction mode port": GOOD.replace(":5432/", ":6543/"),
            "missing port": GOOD.replace(":5432/", "/"),
            "other database": GOOD.replace("/postgres", "/template1"),
            "sslmode disable": GOOD + "?sslmode=disable",
            "sslmode prefer": GOOD + "?sslmode=prefer",
            "extra options parameter": GOOD + "?sslmode=require&options=-c%20default_transaction_read_only%3Doff",
            "host override parameter": GOOD + "?host=evil.example",
            "duplicate sslmode": GOOD + "?sslmode=require&sslmode=disable",
            "unencoded @ in password": GOOD.replace(SECRET, "pa@ss"),
            "no password": GOOD.replace(f":{SECRET}@", "@"),
            "fragment": GOOD + "#x",
            "wrong scheme": GOOD.replace("postgresql://", "mysql://"),
            "trailing space": GOOD + " ",
            "newline": GOOD.replace("5432", "5432\n"),
            "empty": "",
        }
        for name, url in bad.items():
            proc, fields, _ = run(url)
            self.assertNotEqual(proc.returncode, 0, name)
            self.assertIsNone(fields, name)
            self.assertIn("SOURCE_URL rejected", proc.stderr, name)
            for secret_part in (SECRET, "pa@ss", "evil.example", REF):
                self.assertNotIn(secret_part, proc.stderr.replace(f"postgres.{REF}", ""), f"{name}: stderr leaks {secret_part!r}")
            self.assertEqual(proc.stdout, "", name)


if __name__ == "__main__":
    unittest.main()
