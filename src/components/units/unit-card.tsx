import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";
import { Link } from "@/i18n/navigation";
import { OperatingModelBadge } from "./operating-model-badge";
import type { AppLocale } from "@/i18n/routing";
import type { UnitFixture } from "@/demo/fixtures/types";

export function UnitCard({ unit }: { unit: UnitFixture }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("units");

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <p className="font-semibold">{unit.name[locale]}</p>
          <p className="text-sm text-foreground-muted">{unit.area[locale]}</p>
        </div>
        <OperatingModelBadge model={unit.operatingModel} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-foreground-muted">{t("occupancyLabel")}</dt>
          <dd className="text-end">
            <Percent ratio={unit.occupancy} />
          </dd>
          <dt className="text-foreground-muted">{t("adrLabel")}</dt>
          <dd className="text-end">
            <Money amount={unit.adr} />
          </dd>
          <dt className="text-foreground-muted">
            {unit.netProfit ? t("netProfitLabel") : t("managerProfitLabel")}
          </dt>
          <dd className="text-end font-semibold">
            <Money amount={(unit.netProfit ?? unit.managerProfit)!} colorBySign />
          </dd>
          {unit.owner && (
            <>
              <dt className="text-foreground-muted">{t("ownerLabel")}</dt>
              <dd className="text-end">{unit.owner[locale]}</dd>
            </>
          )}
        </dl>
        {unit.hasStatement ? (
          <Link
            href={`/demo/units/${unit.id}/statement`}
            className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-2 text-sm font-medium text-primary"
          >
            {t("viewStatementCta")}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        ) : unit.operatingModel === "managed_for_owner" ? (
          <p className="text-xs text-foreground-subtle">{t("noStatementNote")}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
