import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
    ],
  },
  ...nextCoreWebVitals,
  {
    // CLAUDE.md §7: no hardcoded UI strings — everything lives in messages/.
    // Attribute strings (aria-label, alt, title) are exempt: next-intl's
    // t() calls return strings that flow into those props, not literals.
    files: ["src/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: true,
          allowedStrings: ["·", "•", "/", "-", ":", "%"],
          ignoreProps: true,
        },
      ],
    },
  },
  {
    // CLAUDE.md §6.5: the 12-month projection never ships to a client.
    // `import "server-only"` makes `next build` fail if a client module
    // imports it; this rule catches it earlier, in UI and demo code.
    // Zod (and the engine's schemas) stay out of client code too: they
    // validate server boundaries (§6.6) and cost ~97 KB gzipped in a bundle.
    files: ["src/components/**", "src/demo/**", "src/lib/format/**", "src/lib/calculator/**", "src/lib/guest/**", "src/lib/first-run/**", "src/lib/analytics/**"],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/finance/projection", "**/finance/projection"],
              message: "projection.ts is server-only (CLAUDE.md §6.5); call it from server code.",
            },
            {
              group: ["zod", "zod/*", "@/lib/finance/schemas", "**/finance/schemas"],
              message: "Zod schemas validate server boundaries (CLAUDE.md §6.6); keep them out of client bundles.",
            },
          ],
        },
      ],
    },
  },
];

export default config;
