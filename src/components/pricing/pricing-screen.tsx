import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import { SampleBadge } from "@/components/common/sample-badge";
import { PlanCard } from "./plan-card";
import { FoundingOffer } from "./founding-offer";
import type { AppLocale } from "@/i18n/routing";
import type { FOUNDING_OFFER, PlanFixture, SETUP_KIT } from "@/demo/fixtures/pricing";

export interface PricingScreenProps {
  plans: PlanFixture[];
  setupKit: typeof SETUP_KIT;
  foundingOffer: typeof FOUNDING_OFFER;
}

export function PricingScreen({ plans, setupKit, foundingOffer }: PricingScreenProps) {
  const t = useTranslations("pricing");
  const locale = useLocale() as AppLocale;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-xl font-semibold">{t("title")}</h1>

      <FoundingOffer offer={foundingOffer} />

      {plans.map((plan) => (
        <PlanCard key={plan.code} plan={plan} />
      ))}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{setupKit.name[locale]}</CardTitle>
          <span className="flex items-center gap-2 font-semibold">
            <Money amount={setupKit.price} />
            <SampleBadge />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-muted">{setupKit.description[locale]}</p>
        </CardContent>
      </Card>
    </div>
  );
}
