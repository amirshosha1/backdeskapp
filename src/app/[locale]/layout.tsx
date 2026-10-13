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
import { consentScript } from "@/lib/analytics/consent-script";
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
  const consent = await getTranslations({ locale, namespace: "analyticsConsent" });

  return (
    <html lang={locale} dir={dir} className={plexArabic.variable}>
      <body className="font-sans">
        {process.env.NEXT_PUBLIC_POSTHOG_KEY ? (
          <>
            <aside id="analytics-consent" hidden aria-label={consent("title")} className="relative z-10 m-3 max-w-lg rounded-2xl bg-page p-4 text-ink shadow-lg md:mx-auto" role="region">
              <p className="text-sm font-semibold">{consent("title")}</p>
              <p className="mt-1 text-sm">{consent("body")}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" data-analytics-choice="accept" className="tap flex-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white">{consent("accept")}</button>
                <button type="button" data-analytics-choice="reject" className="tap flex-1 rounded-xl bg-fill px-3 py-2 text-sm font-semibold text-ink">{consent("reject")}</button>
              </div>
              <p id="analytics-consent-status" role="status" className="mt-2 text-sm text-loss" />
            </aside>
            <script dangerouslySetInnerHTML={{ __html: consentScript(consent("error")) }} />
          </>
        ) : null}
        <NextIntlClientProvider locale={locale}>
          <DirectionProvider dir={dir}>{children}</DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
