// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasAuthCookie, supabaseEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("supabaseEnv", () => {
  it("is null (accounts off) while either value is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    expect(supabaseEnv()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(supabaseEnv()).toBeNull();
  });

  it("derives the auth cookie name from the project ref", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://kmmfhaypqgzhoptmljki.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    expect(supabaseEnv()).toEqual({
      url: "https://kmmfhaypqgzhoptmljki.supabase.co",
      key: "sb_publishable_x",
      authCookie: "sb-kmmfhaypqgzhoptmljki-auth-token",
    });
  });

  it("is null for a malformed URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not a url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    expect(supabaseEnv()).toBeNull();
  });
});

describe("hasAuthCookie", () => {
  const name = "sb-ref-auth-token";
  it("finds the session cookie, whole or in chunks", () => {
    expect(hasAuthCookie(`${name}=base64-abc`, name)).toBe(true);
    expect(hasAuthCookie(`a=1; ${name}.0=base64-abc; ${name}.1=def`, name)).toBe(true);
  });

  it("ignores other cookies, empty values and the PKCE verifier", () => {
    expect(hasAuthCookie("", name)).toBe(false);
    expect(hasAuthCookie(`${name}=`, name)).toBe(false);
    expect(hasAuthCookie(`${name}-code-verifier=abc`, name)).toBe(false);
    expect(hasAuthCookie(`x${name}=abc`, name)).toBe(false);
    expect(hasAuthCookie("bd_next=%2Fdemo", name)).toBe(false);
  });
});
