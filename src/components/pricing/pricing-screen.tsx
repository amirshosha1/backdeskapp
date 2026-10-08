import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Money } from "@/components/common/money";
import { SampleBadge } from "@/components/common/sample-badge";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { ApartmentTotals } from "./apartment-totals";
import { PlanCard } from "./plan-card";
import { PreorderAction } from "./preorder-button";
import type { AppLocale } from "@/i18n/routing";
import type { FOUNDING_OFFER, PlanFixture, SETUP_KIT } from "@/demo/fixtures/pricing";
import type { ApartmentTotal } from "@/lib/pricing/apartment-price";

export interface PricingScreenProps {
  plans: PlanFixture[];
  /** Pro's monthly totals for 2 to `maxListedApartments` apartments. */
  apartmentTotals: ApartmentTotal[];
  maxListedApartments: number;
  setupKit: typeof SETUP_KIT;
  foundingOffer: typeof FOUNDING_OFFER;
}

export function PricingScreen({ plans, apartmentTotals, maxListedApartments, setupKit, foundingOffer }: PricingScreenProps) {
  const t = useTranslations("pricing");
  const locale = useLocale() as AppLocale;

  return (
    <div>
      <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>}>
        <section className="glass mt-6 rounded-card p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-xl font-semibold">{foundingOffer.title[locale]}</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/80">{foundingOffer.description[locale]}</p>
          <PreorderAction className="mt-4 bg-white text-navy-900">{t("preorderCta")}</PreorderAction>
        </section>
      </RoyalHero>

      <div className="flex flex-col gap-4 px-4 pt-6">
        <p className="rounded-tile bg-amber-soft px-4 py-3 text-center text-xs text-amber">{t("samplePricesNote")}</p>

        {plans.map((plan) => (
          <PlanCard key={plan.code} plan={plan}>
            {plan.code === "pro" && <ApartmentTotals totals={apartmentTotals} maxApartments={maxListedApartments} />}
          </PlanCard>
        ))}

        <div className="flex flex-col gap-1 px-2 text-center text-sm text-muted" data-testid="plan-terms">
          <p>{t("firstMonthOpen")}</p>
          <p>{t("monthToMonth")}</p>
        </div>

        <article className="rounded-card bg-fill p-5">
          <h2 className="text-lg font-semibold">{setupKit.name[locale]}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{setupKit.description[locale]}</p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Money amount={setupKit.price} decimals={0} className="text-3xl font-semibold" />
            <span className="text-sm text-muted">{t("oneTime")}</span>
            <SampleBadge />
          </div>
          <PreorderAction className="mt-5 bg-ink text-white">{t("orderSetupKit")}</PreorderAction>
        </article>
      </div>
    </div>
  );
}
