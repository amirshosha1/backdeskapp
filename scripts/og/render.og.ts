import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { test } from "vitest";
import { SHARE_LOCALES, SHARE_MAX_BYTES, SHARE_SIZE, shareCardHtml, shareCardInputsHash } from "@/lib/landing/share-card";

/** Renders the share images; see src/lib/landing/share-card.ts. */

const ROOT = process.cwd();
const FONT_DIR = join(ROOT, "node_modules/@fontsource/ibm-plex-sans-arabic/files");
// The same subsets next/font serves (fontsource's own unicode ranges).
const RANGES = {
  arabic: "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC",
  latin: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
};

function fontCss(): string {
  return [400, 500, 600, 700]
    .flatMap((weight) =>
      (Object.keys(RANGES) as (keyof typeof RANGES)[]).map((subset) => {
        const data = readFileSync(join(FONT_DIR, `ibm-plex-sans-arabic-${subset}-${weight}-normal.woff2`)).toString("base64");
        return `@font-face{font-family:"IBM Plex Sans Arabic";font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2");unicode-range:${RANGES[subset]};}`;
      }),
    )
    .join("\n");
}

test("render the landing share images", async () => {
  const browser = await chromium.launch({ executablePath: process.env.OG_CHROMIUM ?? "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: SHARE_SIZE, deviceScaleFactor: 1 });
  const fonts = fontCss();
  const manifest: Record<string, { inputs: string; sha256: string; bytes: number }> = {};
  mkdirSync(join(ROOT, "public/og"), { recursive: true });
  for (const locale of SHARE_LOCALES) {
    await page.setContent(shareCardHtml(locale, fonts), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, ...SHARE_SIZE } });
    if (png.length >= SHARE_MAX_BYTES) throw new Error(`landing-${locale}.png is ${png.length} bytes (limit ${SHARE_MAX_BYTES})`);
    writeFileSync(join(ROOT, `public/og/landing-${locale}.png`), png);
    manifest[locale] = { inputs: shareCardInputsHash(locale), sha256: createHash("sha256").update(png).digest("hex"), bytes: png.length };
  }
  await browser.close();
  writeFileSync(join(ROOT, "src/lib/landing/share-images.json"), JSON.stringify(manifest, null, 2) + "\n");
});
