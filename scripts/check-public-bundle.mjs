#!/usr/bin/env node
/**
 * Post-build guard for the public pages (run after `pnpm build`; CI does).
 * Reads the client-reference manifests Next.js writes, joins the JS every
 * public page loads (framework + layout + the [locale] not-found boundary
 * + the page) and fails when app-only code reaches them: the guest store,
 * the account store or the finance engine's decimal.js. This is the leak
 * the 404 fix removed (docs/PROGRESS.md, Batch 4); e2e does not run in CI,
 * so this check has to.
 *
 * Prints each page's JS in gzip bytes. Usage: node scripts/check-public-bundle.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const NEXT = ".next";
/** Public pages: route key in the manifest → the file it lives in. */
const PAGES = {
  "/": "[locale]/page",
  "/privacy": "[locale]/privacy/page",
};
/** Strings that only exist in app-only modules. */
const FORBIDDEN = [
  ["backdesk:guest", "the guest store (src/lib/guest)"],
  ["signInWithGoogle", "the account store (src/lib/account/store.ts)"],
  ["DecimalError", "decimal.js (the finance engine)"],
];

function manifestFor(route) {
  const file = join(NEXT, "server", "app", `${route}_client-reference-manifest.js`);
  if (!existsSync(file)) throw new Error(`No manifest at ${file}: run pnpm build first.`);
  globalThis.__RSC_MANIFEST = {};
  new Function(readFileSync(file, "utf8"))();
  return globalThis.__RSC_MANIFEST[`/${route}`];
}

const buildManifest = JSON.parse(readFileSync(join(NEXT, "build-manifest.json"), "utf8"));
let failed = false;

for (const [path, route] of Object.entries(PAGES)) {
  const manifest = manifestFor(route);
  const segments = Object.entries(manifest.entryJSFiles).filter(([key]) => key.includes("/src/app/"));
  const files = new Set([...buildManifest.rootMainFiles, ...segments.flatMap(([, chunks]) => chunks)]);
  let gzip = 0;
  for (const file of files) {
    const code = readFileSync(join(NEXT, file));
    gzip += gzipSync(code, { level: 9 }).length;
    for (const [marker, what] of FORBIDDEN) {
      if (code.includes(marker)) {
        failed = true;
        console.error(`✗ ${path}: ${file} contains "${marker}" — ${what} reaches a public page.`);
      }
    }
  }
  console.log(`${path}: ${files.size} JS files, ${(gzip / 1024).toFixed(1)} KB gzip`);
}

if (failed) {
  console.error("App-only code reaches a public page. See scripts/check-public-bundle.mjs.");
  process.exit(1);
}
console.log("✓ No app-only code on the public pages.");
