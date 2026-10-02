// Vitest stand-in for the `server-only` package. The real package throws when
// it is imported outside a React Server Components build, which is exactly
// what makes `next build` fail if client code imports a server-only module
// (BUILD_PLAN.md Phase 1: projection.ts). Unit tests run outside that build,
// so they import this empty module instead (alias in vitest.config.mts).
export {};
