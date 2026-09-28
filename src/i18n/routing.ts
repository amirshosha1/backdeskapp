import { defineRouting } from "next-intl/routing";

/**
 * Arabic is the default locale (CLAUDE.md §7) and never carries a URL
 * prefix; English lives under `/en`. The URL alone decides the language:
 * the phone's language (`Accept-Language`) and cookies are ignored, so an
 * English-language phone opening `/demo` still gets Arabic. Users switch
 * with the language switch, which navigates between the two URLs.
 */
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: {
    mode: "as-needed",
  },
  localeDetection: false,
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];
