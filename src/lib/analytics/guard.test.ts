// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * One way out for analytics (docs/ANALYTICS.md): only src/lib/analytics
 * sends, only to the route in src/app/api/e. A stray sendBeacon, a direct
 * PostHog call or a second path would bypass the catalogue and its rules.
 */

const ROOT = join(__dirname, "..", "..");
const ALLOWED = ["lib/analytics/", "app/api/e/"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    // Shipping code only: tests may stub a beacon.
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("analytics leaves only through src/lib/analytics", () => {
  it("no other source file sends a beacon, names the route or talks to PostHog", () => {
    const offenders = files(ROOT)
      .map((path) => ({ path: relative(ROOT, path), text: readFileSync(path, "utf8") }))
      .filter(({ path }) => !ALLOWED.some((allowed) => path.startsWith(allowed)))
      .filter(({ text }) => /sendBeacon|["'`]\/api\/e["'`]|posthog\.com/i.test(text))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });
});
