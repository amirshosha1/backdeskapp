import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { closePools } from "./db";
import { generateDatabaseTypes } from "./types";

/**
 * src/types/database.ts must match the migrations. `pnpm db:types` sets
 * UPDATE_DB_TYPES=1 to rewrite it; every other run only compares.
 */

const FILE = fileURLToPath(new URL("../../src/types/database.ts", import.meta.url));

afterAll(closePools);

describe("src/types/database.ts", () => {
  it("matches the migrated schema and its grants (run `pnpm db:types` to regenerate)", async () => {
    const generated = await generateDatabaseTypes();
    if (process.env.UPDATE_DB_TYPES === "1") writeFileSync(FILE, generated);
    let committed = "";
    try {
      committed = readFileSync(FILE, "utf8");
    } catch {
      // Missing file: the comparison below fails with the full expected text.
    }
    expect(committed).toBe(generated);
  });

  it("lets a signed-in user write only the granted columns", async () => {
    const generated = await generateDatabaseTypes();
    const units = generated.slice(generated.indexOf("      units: {"));
    const insert = units.slice(units.indexOf("Insert: {"), units.indexOf("Update: {"));
    const update = units.slice(units.indexOf("Update: {"), units.indexOf("Relationships"));
    const writable = (block: string) => [...block.matchAll(/^ {10}(\w+)\??: (?!never)/gm)].map((m) => m[1]).sort();
    expect(writable(insert)).toEqual(["calculator_inputs", "engine_version", "name", "operating_model", "org_id"]);
    expect(writable(update)).toEqual(["calculator_inputs", "engine_version", "name", "operating_model"]);
    const profiles = generated.slice(generated.indexOf("      profiles: {"));
    expect(writable(profiles.slice(profiles.indexOf("Insert: {"), profiles.indexOf("Update: {")))).toEqual([]);
    expect(writable(profiles.slice(profiles.indexOf("Update: {"), profiles.indexOf("Relationships")))).toEqual(["apartment_count_answer"]);
  });
});
