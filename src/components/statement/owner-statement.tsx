import { useLocale, useTranslations } from "next-intl";
import { Download, Link2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/common/money";
import type { AppLocale } from "@/i18n/routing";
import type { STATEMENT } from "@/demo/fixtures/statement";

export function OwnerStatement({ statement }: { statement: typeof STATEMENT }) {
  const t = useTranslations("statement");
  const locale = useLocale() as AppLocale;

  return (
    <div className="flex flex-col">
      <PageHeader title={t("title")} backHref="/demo/units" />
      <div className="flex flex-col gap-4 p-4 pb-24">
        <div>
          <p className="font-semibold">{statement.unitName[locale]}</p>
          <p className="text-sm text-foreground-muted">{statement.ownerName[locale]}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="profit">{t("statusFinalized")}</Badge>
          <Badge variant="outline">{t("basisCash")}</Badge>
          <Badge variant="outline">
            {t("numberLabel")} {statement.number}
          </Badge>
          <Badge variant="outline">{statement.period[locale]}</Badge>
        </div>

        <dl className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 text-sm">
          <Row label={t("openingBalanceLabel")} amount={statement.openingBalance} />
          <Row label={t("grossRevenueLabel")} amount={statement.grossRevenue} />
          <Row label={t("platformFeesLabel")} amount={statement.platformFees} colorBySign />
          <Row label={t("netPayoutLabel")} amount={statement.netPayout} emphasize />
          <Row
            label={t("ownerExpensesLabel")}
            amount={statement.ownerExpensesTotal}
            colorBySign
          />
          <Row label={t("commissionLabel")} amount={statement.commission} colorBySign />
          <Row label={t("ownerNetLabel")} amount={statement.ownerNet} emphasize />
          <Row label={t("ownerPayoutsLabel")} amount={statement.ownerPayouts} colorBySign />
          <Row label={t("balanceDueLabel")} amount={statement.balanceDue} emphasize />
        </dl>

        <div className="flex flex-col gap-2">
          <Button variant="outline" size="lg" disabled>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("pdfLockedCta")}
          </Button>
          <Button variant="outline" size="lg" disabled>
            <Link2 className="h-4 w-4" aria-hidden="true" />
            {t("shareLinkLockedCta")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  amount,
  colorBySign,
  emphasize,
}: {
  label: string;
  amount: string;
  colorBySign?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className={emphasize ? "font-semibold" : "text-foreground-muted"}>{label}</dt>
      <dd className={emphasize ? "font-semibold" : "font-medium"}>
        <Money amount={amount} colorBySign={colorBySign} />
      </dd>
    </div>
  );
}
