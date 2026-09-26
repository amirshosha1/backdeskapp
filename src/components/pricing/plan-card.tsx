import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/common/money";
import { SampleBadge } from "@/components/common/sample-badge";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";
import type { PlanFixture } from "@/demo/fixtures/pricing";

export function PlanCard({ plan }: { plan: PlanFixture }) {
  const t = useTranslations("pricing");
  const locale = useLocale() as AppLocale;

  return (
    <Card className={cn(plan.highlighted && "border-primary")}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{plan.name[locale]}</CardTitle>
        {plan.highlighted && <Badge>{t("mostPopular")}</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-foreground-muted">
          {plan.unitLimit === 1 ? t("unitsOne") : t("unitsUpTo", { count: plan.unitLimit })}
        </p>

        <div className="flex items-baseline gap-2">
          {plan.priceMonthly ? (
            <>
              <span className="text-2xl font-bold">
                <Money amount={plan.priceMonthly} />
              </span>
              <span className="text-sm text-foreground-muted">{t("perMonth")}</span>
              <SampleBadge />
            </>
          ) : (
            <span className="text-2xl font-bold">{t("currentPlanFree")}</span>
          )}
        </div>

        <ul className="flex flex-col gap-1.5 text-sm">
          {plan.features.map((feature) => (
            <li key={feature.en} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{feature[locale]}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
