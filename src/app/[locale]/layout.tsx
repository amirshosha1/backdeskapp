import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DirectionProvider } from "@radix-ui/react-direction";
import { routing, type AppLocale } from "@/i18n/routing";
import { siteShareMetadata } from "@/lib/seo/landing-meta";
import { metadataBase } from "@/lib/site";
import "@/styles/globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-arabic",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the layout reach under the iPhone home bar; the navigation pill
  // pads itself with env(safe-area-inset-bottom).
  viewportFit: "cover",
  themeColor: "#071a4f",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    // Relative URLs in metadata (canonical, alternates, share images) resolve against production (a preview: itself).
    metadataBase: metadataBase(),
    title: t("siteName"),
    description: t("description"),
    ...(await siteShareMetadata(locale as AppLocale)),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for this locale (next-intl requirement).
  setRequestLocale(locale);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={plexArabic.variable}>
      <body className="font-sans">
        <NextIntlClientProvider locale={locale}>
          <DirectionProvider dir={dir}>{children}</DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
