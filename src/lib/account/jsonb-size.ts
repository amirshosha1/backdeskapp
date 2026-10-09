/**
 * The size, in bytes, of a JSON value as Postgres stores and checks it:
 * `octet_length(value::jsonb::text)`. `units.calculator_inputs` has a
 * check constraint of 8192 bytes measured that way, and jsonb's text form
 * is not JSON.stringify's: it puts a space after every `:` and `,`, so a
 * limit checked on JSON.stringify would let through values the database
 * then rejects. tests/db/jsonb-size.test.ts compares this with Postgres.
 *
 * Numbers other than safe integers are refused: Postgres rewrites them
 * (`1e3` → `1000`), and the stored calculator inputs hold none.
 */

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const encoder = new TextEncoder();

/** A string as Postgres's escape_json writes it. */
function stringBytes(s: string): number {
  let bytes = 2; // the quotes
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (ch === '"' || ch === "\\" || ch === "\b" || ch === "\f" || ch === "\n" || ch === "\r" || ch === "\t") bytes += 2;
    else if (code < 0x20) bytes += 6; // \u00XX
    else bytes += encoder.encode(ch).length;
  }
  return bytes;
}

export function jsonbTextBytes(value: unknown): number {
  if (value === null) return 4;
  if (value === true) return 4;
  if (value === false) return 5;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError("jsonbTextBytes: only safe integers are supported");
    return String(value).length;
  }
  if (typeof value === "string") return stringBytes(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return 2;
    return 2 + value.reduce<number>((sum, item) => sum + jsonbTextBytes(item), 0) + 2 * (value.length - 1);
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return 2;
    // `"key": value`, joined by `, `.
    return 2 + entries.reduce((sum, [k, v]) => sum + stringBytes(k) + 2 + jsonbTextBytes(v), 0) + 2 * (entries.length - 1);
  }
  throw new TypeError(`jsonbTextBytes: not a JSON value (${typeof value})`);
}
