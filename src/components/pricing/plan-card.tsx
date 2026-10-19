import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Money } from "@/components/common/money";
import { SampleBadge } from "@/components/common/sample-badge";
import { Link } from "@/i18n/navigation";
import { PreorderAction } from "./preorder-button";
import type { AppLocale } from "@/i18n/routing";
import type { PlanFixture } from "@/demo/fixtures/pricing";
import { cn } from "@/lib/utils";

/** One plan. `children` sit between the feature list and the action (Pro's apartment totals). */
export function PlanCard({ plan, children }: { plan: PlanFixture; children?: ReactNode }) {
  const t = useTranslations("pricing");
  const locale = useLocale() as AppLocale;

  return (
    <article
      className={cn(
        "rounded-card p-5",
        plan.highlighted ? "bg-page shadow-[0_1px_2px_rgb(10_18_36/0.04),0_16px_36px_-18px_rgb(29_78_216/0.35)] ring-2 ring-brand" : "bg-fill",
      )}
    >
      <h2 className="text-lg font-semibold">{plan.name[locale]}</h2>
      <p className="mt-0.5 text-sm text-muted">{t(`scope.${plan.code}`)}</p>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {plan.priceMonthly ? (
          <>
            <Money amount={plan.priceMonthly} decimals={0} className="text-3xl font-semibold" />
            <span className="text-sm text-muted">{t("perMonth")}</span>
            <SampleBadge />
          </>
        ) : (
          <span className="text-3xl font-semibold">{t("free")}</span>
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {plan.features.map((feature) => (
          <li key={feature.label.en} className="flex items-start gap-2" data-availability={feature.availability}>
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", feature.availability === "available" ? "text-brand" : "text-muted")} aria-hidden="true" />
            <span className="min-w-0 flex-1" data-testid="feature-label">{feature.label[locale]}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs",
                feature.availability === "available" ? "bg-brand/10 text-brand" : "bg-amber-soft text-amber",
              )}
              data-testid="feature-availability"
            >
              {t(`availability.${feature.availability}`)}
            </span>
          </li>
        ))}
      </ul>

      {children}

      <div className="mt-5">
        {plan.priceMonthly ? (
          <PreorderAction className={plan.highlighted ? "bg-brand text-white" : "bg-ink text-white"}>
            {t("choosePlan", { plan: plan.name[locale] })}
          </PreorderAction>
        ) : (
          // Free is the calculator, which works today without an account.
          <Link
            href="/demo/calculator"
            className="tap flex h-12 w-full items-center justify-center rounded-full bg-page text-sm font-semibold"
            data-testid="start-free"
          >
            {t("startFree")}
          </Link>
        )}
      </div>
    </article>
  );
}
