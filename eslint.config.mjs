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
    files: ["src/components/**", "src/demo/**", "src/lib/format/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/finance/projection", "**/finance/projection"],
              message: "projection.ts is server-only (CLAUDE.md §6.5); call it from server code.",
            },
          ],
        },
      ],
    },
  },
];

export default config;
