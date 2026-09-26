import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";
import { SampleBadge } from "@/components/common/sample-badge";
import type { AppLocale } from "@/i18n/routing";
import type { WalkthroughStep } from "@/demo/fixtures/calculator";

export function AssumptionList({ step }: { step: WalkthroughStep }) {
  const locale = useLocale() as AppLocale;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{step.title[locale]}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-2 text-sm">
          {step.rows.map((row) => (
            <div key={row.label.en} className="flex items-center justify-between gap-2">
              <dt className="text-foreground-muted">{row.label[locale]}</dt>
              <dd className="flex items-center gap-2 font-medium">
                {row.isSample && <SampleBadge />}
                {row.kind === "money" && <Money amount={row.amount} />}
                {row.kind === "percent" && <Percent ratio={row.ratio} />}
                {row.kind === "text" && <span>{row.value[locale]}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
