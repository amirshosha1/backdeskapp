import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/routing";
import manifest from "@/lib/landing/share-images.json";
import { SHARE_SIZE } from "@/lib/landing/share-size";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The share image for a language; `?v=` changes with the file, so Facebook and WhatsApp fetch the new one. */
export function shareImage(locale: AppLocale, alt: string) {
  return {
    url: `/og/landing-${locale}.png?v=${manifest[locale].sha256.slice(0, 8)}`,
    width: SHARE_SIZE.width,
    height: SHARE_SIZE.height,
    type: "image/png",
    alt,
  };
}

/**
 * Open Graph fields every page shares. Next.js replaces `openGraph` as a
 * whole when a page sets its own, so pages spread these first.
 * `ar_AR` is Facebook's own code for Arabic.
 */
export function openGraphDefaults(locale: AppLocale, siteName: string, imageAlt: string): OpenGraph {
  return {
    type: "website",
    siteName,
    locale: locale === "ar" ? "ar_AR" : "en_US",
    alternateLocale: locale === "ar" ? ["en_US"] : ["ar_AR"],
    images: [shareImage(locale, imageAlt)],
  };
}
