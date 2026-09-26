import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * CLAUDE.md §7: use CSS logical properties only (`ms-`, `me-`, `ps-`, `pe-`,
 * `start`, `end`); never `left`/`right` for layout. This greps the whole
 * source tree for physical-direction Tailwind classes so a regression fails
 * CI instead of only showing up in a manual RTL check.
 */
const PHYSICAL_CLASS_PATTERN =
  /\b-?(?:m|p)[lr]-(?:\d|\[)|\bleft-(?:\d|\[)|\bright-(?:\d|\[)|\btext-left\b|\btext-right\b|\bfloat-left\b|\bfloat-right\b|\brounded-[tb]?[lr]-/;

function listTsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listTsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("no hardcoded left/right layout classes", () => {
  it("src/**/*.tsx uses only logical (start/end) Tailwind classes", () => {
    const files = listTsxFiles(join(process.cwd(), "src"));
    const offenders: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      for (const line of content.split("\n")) {
        if (PHYSICAL_CLASS_PATTERN.test(line)) {
          offenders.push(`${file}: ${line.trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
