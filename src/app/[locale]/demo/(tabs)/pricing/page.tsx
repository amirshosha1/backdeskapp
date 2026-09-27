import { setRequestLocale } from "next-intl/server";
import { PricingScreen } from "@/components/pricing/pricing-screen";
import { FOUNDING_OFFER, PLANS, SETUP_KIT } from "@/demo/fixtures/pricing";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PricingScreen plans={PLANS} setupKit={SETUP_KIT} foundingOffer={FOUNDING_OFFER} />;
}
