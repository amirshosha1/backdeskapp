// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { metadataBase, SITE_URL } from "./site";

afterEach(() => vi.unstubAllEnvs());

describe("metadataBase()", () => {
  it("is production by default and in production", () => {
    expect(metadataBase().href).toBe(`${SITE_URL}/`);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_BRANCH_URL", "str-money-finder-git-main-amir.vercel.app");
    expect(metadataBase().href).toBe(`${SITE_URL}/`);
  });

  it("is the preview's own branch address on a Vercel preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_BRANCH_URL", "str-money-finder-git-claude-x-amir.vercel.app");
    expect(metadataBase().href).toBe("https://str-money-finder-git-claude-x-amir.vercel.app/");
  });
});
