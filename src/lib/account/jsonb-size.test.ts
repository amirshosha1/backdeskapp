// @vitest-environment node
import { describe, expect, it } from "vitest";
import { jsonbTextBytes } from "./jsonb-size";

/** Expected values are octet_length(x::jsonb::text) from Postgres 16; tests/db/jsonb-size.test.ts checks the same against a live Postgres. */
describe("jsonbTextBytes", () => {
  it("counts jsonb's text form: a space after every colon and comma", () => {
    expect(jsonbTextBytes({ a: 1, b: [true, null] })).toBe('{"a": 1, "b": [true, null]}'.length);
    expect(jsonbTextBytes([])).toBe(2);
    expect(jsonbTextBytes({})).toBe(2);
    expect(jsonbTextBytes("")).toBe(2);
    expect(jsonbTextBytes(false)).toBe(5);
  });

  it("counts UTF-8 bytes and escapes as Postgres writes them", () => {
    expect(jsonbTextBytes("ش")).toBe(4);
    expect(jsonbTextBytes("🏠")).toBe(6);
    expect(jsonbTextBytes('"\\\n')).toBe(8);
    expect(jsonbTextBytes(String.fromCharCode(1))).toBe(8);
  });

  it("skips undefined object values, as JSON does", () => {
    expect(jsonbTextBytes({ a: "x", b: undefined })).toBe(jsonbTextBytes({ a: "x" }));
  });

  it("refuses numbers Postgres would rewrite, and non-JSON values", () => {
    expect(() => jsonbTextBytes(1.5)).toThrow(TypeError);
    expect(() => jsonbTextBytes(1e21)).toThrow(TypeError);
    expect(() => jsonbTextBytes(() => 1)).toThrow(TypeError);
  });
});
