import { defineRouting } from "next-intl/routing";

/**
 * Arabic is the default locale (CLAUDE.md §7). English is complete, not an
 * afterthought, but Arabic never carries a locale prefix in the URL so the
 * primary experience reads as the product's home, not a translated branch.
 */
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: {
    mode: "as-needed",
  },
});

export type AppLocale = (typeof routing.locales)[number];
