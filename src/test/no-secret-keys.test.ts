// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Batch 3 rule: no flow relies on a service-role or secret key. The app
 * only ever holds the publishable key; everything it may do is decided by
 * grants and Row Level Security. This guard fails if any source file
 * mentions a secret key, or calls a database function other than the one
 * the migration exposes to signed-in users.
 */

const SRC = fileURLToPath(new URL("..", import.meta.url));
const SELF = fileURLToPath(import.meta.url);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|js|mjs)$/.test(name) && full !== SELF ? [full] : [];
  });
}

/** Code only: comments may explain that no secret key exists. */
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

const files = sourceFiles(SRC).map((file) => ({ file: path.relative(SRC, file), text: stripComments(readFileSync(file, "utf8")) }));

describe("no secret keys in the app", () => {
  it("never mentions a service-role or secret key", () => {
    const forbidden = /service[_-]?role|sb_secret_|SUPABASE_SECRET|SECRET_KEY|SUPABASE_JWT_SECRET/i;
    const offenders = files.filter(({ text }) => forbidden.test(text)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("calls no database function except delete_my_account", () => {
    const calls = files.flatMap(({ file, text }) => [...text.matchAll(/\.rpc\(\s*["'`]([^"'`]+)["'`]/g)].map((m) => `${file}: ${m[1]}`));
    expect(calls.every((c) => c.endsWith(": delete_my_account"))).toBe(true);
    expect(calls.length).toBeGreaterThan(0);
  });

  it("reads Supabase settings only from the two public variables", () => {
    const envNames = new Set(files.flatMap(({ text }) => [...text.matchAll(/process\.env\.([A-Z0-9_]*SUPABASE[A-Z0-9_]*)/g)].map((m) => m[1])));
    expect([...envNames].sort()).toEqual(["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_URL"]);
  });
});
