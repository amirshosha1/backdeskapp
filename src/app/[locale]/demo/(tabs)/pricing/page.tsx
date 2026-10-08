import { setRequestLocale } from "next-intl/server";
import { PricingScreen } from "@/components/pricing/pricing-screen";
import { FOUNDING_OFFER, MAX_LISTED_APARTMENTS, PLANS, PRO_APARTMENT_TOTALS, SETUP_KIT } from "@/demo/fixtures/pricing";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PricingScreen
      plans={PLANS}
      apartmentTotals={PRO_APARTMENT_TOTALS}
      maxListedApartments={MAX_LISTED_APARTMENTS}
      setupKit={SETUP_KIT}
      foundingOffer={FOUNDING_OFFER}
    />
  );
}
