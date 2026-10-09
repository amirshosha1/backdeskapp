// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SHARE_LOCALES, SHARE_MAX_BYTES, SHARE_SIZE, shareCardInputsHash } from "./share-card";
import manifest from "./share-images.json";

/**
 * The committed share images match what the page says today: the HTML
 * they are drawn from (messages, engine figure, colours, key) hashes to
 * the value recorded when they were rendered, and the files are the ones
 * rendered then, 1200×630 and small enough for WhatsApp's preview.
 */
describe("landing share images (public/og)", () => {
  for (const locale of SHARE_LOCALES) {
    describe(locale, () => {
      const entry = manifest[locale];
      const png = readFileSync(join(process.cwd(), `public/og/landing-${locale}.png`));

      it("were drawn from today's page (otherwise: run pnpm og:render and commit the result)", () => {
        expect(shareCardInputsHash(locale), "run pnpm og:render and commit public/og and share-images.json").toBe(entry.inputs);
      });

      it("are the files recorded in share-images.json", () => {
        expect(createHash("sha256").update(png).digest("hex")).toBe(entry.sha256);
        expect(png.length).toBe(entry.bytes);
      });

      it("are 1200×630 PNGs under 300 KB", () => {
        expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
        expect(png.readUInt32BE(16)).toBe(SHARE_SIZE.width);
        expect(png.readUInt32BE(20)).toBe(SHARE_SIZE.height);
        expect(png.length).toBeLessThan(SHARE_MAX_BYTES);
      });
    });
  }
});
