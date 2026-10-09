import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LandingScreen } from "@/components/landing/landing-screen";
import { routing, type AppLocale } from "@/i18n/routing";
import { landingEventsScript } from "@/lib/analytics/landing-events-script";
import { landingExample } from "@/lib/landing/example";
import { landingRedirectScript } from "@/lib/landing/redirect-script";
import { landingMetadata } from "@/lib/seo/landing-meta";
import { supabaseEnv } from "@/lib/supabase/env";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return landingMetadata(locale as AppLocale);
}

/**
 * The public landing page (/, /en; Batch 4, docs/BUILD_PLAN.md). Static:
 * first visits, crawlers and link previews get the whole page; someone
 * with a saved apartment or signed in goes straight to the app (the first
 * script). The second script sends the page's two anonymous events, and
 * exists only in builds with NEXT_PUBLIC_POSTHOG_KEY.
 */
export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const redirect = landingRedirectScript(supabaseEnv()?.authCookie ?? null);
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: redirect }} />
      <LandingScreen example={landingExample()} />
      {process.env.NEXT_PUBLIC_POSTHOG_KEY ? <script dangerouslySetInnerHTML={{ __html: landingEventsScript() }} /> : null}
    </>
  );
}
