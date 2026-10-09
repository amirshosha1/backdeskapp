import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PrivacyScreen } from "@/components/privacy/privacy-screen";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  return { title: `${t("title")} · ${tMeta("siteName")}` };
}

/** /privacy and /en/privacy: static, indexable (linked from Google's consent screen). */
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyScreen />;
}
