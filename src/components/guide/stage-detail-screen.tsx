import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { LockedTeaser } from "@/components/common/locked-teaser";
import { Checklist } from "./checklist";
import type { AppLocale } from "@/i18n/routing";
import type { GuideStage } from "@/demo/fixtures/guide";
import type { Localized } from "@/demo/fixtures/types";

export interface StageDetailScreenProps {
  stage: GuideStage;
  checklist: Localized[];
}

export function StageDetailScreen({ stage, checklist }: StageDetailScreenProps) {
  const t = useTranslations("guide");
  const locale = useLocale() as AppLocale;

  return (
    <div className="flex flex-col">
      <PageHeader title={t("stageLabel", { order: stage.order })} backHref="/demo/guide" />
      <div className="flex flex-col gap-4 p-4 pb-24">
        <Badge variant="outline">{t("draftNotice")}</Badge>
        <div>
          <h2 className="text-lg font-semibold">{stage.title[locale]}</h2>
          <p className="mt-2 text-sm font-semibold text-foreground-muted">{t("overviewTitle")}</p>
          <p className="mt-1 text-sm">{stage.overview[locale]}</p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">{t("checklistTitle")}</h3>
          <Checklist items={checklist} />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">{t("detailedPlaybookTitle")}</h3>
          <LockedTeaser title={t("detailedPlaybookTitle")} body={t("detailedPlaybookLockedBody")}>
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-4 rounded bg-surface-muted" />
              ))}
            </div>
          </LockedTeaser>
        </div>
      </div>
    </div>
  );
}
