import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";
import type { CALCULATOR_RESULTS } from "@/demo/fixtures/calculator";

export function ResultsPanel({ results }: { results: typeof CALCULATOR_RESULTS }) {
  const t = useTranslations("calculator");

  const rows: { label: string; value: ReactNode }[] = [
    { label: t("grossRevenueLabel"), value: <Money amount={results.grossRevenue} /> },
    { label: t("platformFeesLabel"), value: <Money amount={results.platformFees} colorBySign /> },
    { label: t("netPayoutLabel"), value: <Money amount={results.netPayout} /> },
    { label: t("opexLabel"), value: <Money amount={results.opex} colorBySign /> },
    { label: t("rentLabel"), value: <Money amount={results.rent} colorBySign /> },
    { label: t("noiLabel"), value: <Money amount={results.noi} colorBySign /> },
    { label: t("contributionPerNightLabel"), value: <Money amount={results.contributionPerNight} /> },
    { label: t("breakEvenNightsLabel"), value: results.breakEvenNights },
    {
      label: t("breakEvenOccupancyLabel"),
      value: <Percent ratio={results.breakEvenOccupancy} />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("resultsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <dl className="flex flex-col gap-2 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <dt className="text-foreground-muted">{row.label}</dt>
              <dd className="font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-foreground-subtle">{t("depreciationExcludedNote")}</p>
      </CardContent>
    </Card>
  );
}
