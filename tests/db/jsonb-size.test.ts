import fc from "fast-check";
import { afterAll, describe, expect, it } from "vitest";
import { jsonbTextBytes } from "@/lib/account/jsonb-size";
import { admin, CALCULATOR_INPUTS, closePools } from "./db";

/**
 * `jsonbTextBytes` (the app's 8 KB check on calculator_inputs) must count
 * exactly what the units check constraint counts:
 * octet_length(calculator_inputs::text) on the stored jsonb.
 */

afterAll(closePools);

async function postgresBytes(value: unknown): Promise<number> {
  const { rows } = await admin.query("select octet_length($1::jsonb::text)::int as n", [JSON.stringify(value)]);
  return rows[0].n as number;
}

// Any code point Postgres accepts in jsonb: everything but NUL and lone surrogates.
const text = fc.string({ unit: "binary", maxLength: 12 }).filter((s) => !s.includes("\u0000"));
const json = fc.letrec((tie) => ({
  value: fc.oneof(
    { depthSize: "small" },
    fc.constant(null),
    fc.boolean(),
    fc.integer({ min: -1_000_000, max: 1_000_000 }),
    text,
    fc.array(tie("value"), { maxLength: 4 }),
    fc.dictionary(text, tie("value"), { maxKeys: 4 }),
  ),
})).value;

describe("jsonbTextBytes matches Postgres", () => {
  it("for the stored calculator inputs", async () => {
    expect(jsonbTextBytes(CALCULATOR_INPUTS)).toBe(await postgresBytes(CALCULATOR_INPUTS));
  });

  it("for escapes, Arabic, emoji and empty containers", async () => {
    const samples = [
      { a: 'quote " backslash \\ newline \n tab \t cr \r bs \b ff \f', b: "\u0001\u001f\u007f" },
      { "اسم": "شقة التجمع ١", emoji: "🏠", nested: { list: [[], {}, [null, true, false, 0, -12]] } },
      [],
      {},
      "",
    ];
    for (const value of samples) expect(jsonbTextBytes(value), JSON.stringify(value)).toBe(await postgresBytes(value));
  });

  it("for any generated JSON value (property)", async () => {
    await fc.assert(
      fc.asyncProperty(json, async (value) => {
        expect(jsonbTextBytes(value)).toBe(await postgresBytes(value));
      }),
      { numRuns: 300 },
    );
  });
});
