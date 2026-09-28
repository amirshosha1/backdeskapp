import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// vitest.config.mts doesn't enable `test.globals`, so @testing-library/react
// can't auto-detect the test runner to register its own cleanup — without
// this, each test's rendered DOM leaks into the next within the same file.
afterEach(cleanup);

// jsdom's `window.location` is one instance per file, not per test — without
// this, a component that reads/writes the URL (e.g. Home's `?view=` query
// param) leaks it into the next test in the same file.
afterEach(() => window.history.replaceState(null, "", "/"));
