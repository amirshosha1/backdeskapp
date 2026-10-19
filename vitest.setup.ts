import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import fc from "fast-check";

// Property tests: every run uses an explicit seed and every failure reports it
// (with the shrink path and counterexample), so a CI failure can be replayed
// locally with `FC_SEED=<seed> pnpm test <file>`. Without FC_SEED a fresh
// random seed is drawn per test file, as before.
const fcSeed = process.env.FC_SEED === undefined ? Date.now() ^ (Math.random() * 0x100000000) : Number(process.env.FC_SEED);
fc.configureGlobal({ seed: fcSeed, verbose: 1 });

// vitest.config.mts doesn't enable `test.globals`, so @testing-library/react
// can't auto-detect the test runner to register its own cleanup — without
// this, each test's rendered DOM leaks into the next within the same file.
afterEach(cleanup);

// jsdom's `window.location` is one instance per file, not per test — without
// this, a component that reads/writes the URL (e.g. Home's `?view=` query
// param) leaks it into the next test in the same file.
// Finance-engine tests opt into the faster `node` environment, which has no window.
afterEach(() => {
  if (typeof window !== "undefined") window.history.replaceState(null, "", "/");
});

// The visitor's data lives in browser storage (src/lib/guest/), which jsdom
// keeps for a whole file: every test starts with an empty browser.
afterEach(() => {
  if (typeof window === "undefined") return;
  window.localStorage.clear();
  window.sessionStorage.clear();
});
