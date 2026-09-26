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
];

export default config;
