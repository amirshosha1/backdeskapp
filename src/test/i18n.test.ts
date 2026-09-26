import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

type MessageTree = { [key: string]: string | MessageTree };

/** Recursively collects dotted key paths, e.g. "home.heroQuestion". */
function collectKeys(tree: MessageTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : collectKeys(value, path);
  });
}

describe("message key parity (CLAUDE.md §7: no hardcoded UI strings)", () => {
  it("ar.json and en.json declare exactly the same keys", () => {
    const arKeys = collectKeys(ar as MessageTree).sort();
    const enKeys = collectKeys(en as MessageTree).sort();

    expect(enKeys).toEqual(arKeys);
  });

  it("has no empty translation values in either locale", () => {
    for (const [locale, tree] of [
      ["ar", ar],
      ["en", en],
    ] as const) {
      for (const key of collectKeys(tree as MessageTree)) {
        const value = key.split(".").reduce<unknown>((node, part) => (node as MessageTree)[part], tree);
        expect(typeof value === "string" && value.trim().length > 0, `${locale}.${key}`).toBe(
          true,
        );
      }
    }
  });
});
