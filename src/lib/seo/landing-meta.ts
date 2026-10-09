import Decimal from "decimal.js";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { formatMoney } from "@/lib/format/money";
import { landingExample } from "@/lib/landing/example";
import { openGraphDefaults } from "./share";

/** The share image's alt text names the example and its verdict ("a loss of 7,014": the word carries the sign), from the same engine figure. */
async function shareAlt(locale: AppLocale): Promise<string> {
  const t = await getTranslations({ locale, namespace: "landing" });
  const example = landingExample();
  const amount = formatMoney(new Decimal(example.net).abs(), { locale, decimals: 0 });
  return t("ogAlt", { model: example.model, outcome: example.outcome, net: amount });
}

/** Open Graph and Twitter fields for every page; the landing adds its own title, description and URL. */
export async function siteShareMetadata(locale: AppLocale): Promise<Pick<Metadata, "openGraph" | "twitter">> {
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    openGraph: { ...openGraphDefaults(locale, t("shareName"), await shareAlt(locale)), title: t("siteName"), description: t("description") },
    twitter: { card: "summary_large_image" },
  };
}

/** The landing page (/, /en): indexable, canonical, with both languages as alternates. */
export async function landingMetadata(locale: AppLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "landing" });
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  const url = locale === "en" ? "/en" : "/";
  const title = t("metaTitle");
  const description = t("metaDescription");
  const alt = await shareAlt(locale);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: { ar: "/", en: "/en", "x-default": "/" } },
    openGraph: { ...openGraphDefaults(locale, tMeta("shareName"), alt), url, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}
