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
    <div>
      <PageHeader title={t("stageLabel", { order: stage.order })} backHref="/demo/guide" />
      <div className="flex flex-col gap-8 px-4 pt-4">
        <section className="rounded-card bg-fill p-5">
          <Badge variant="onFill">{t("draftNotice")}</Badge>
          <h2 className="mt-3 text-2xl font-semibold">{stage.title[locale]}</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{stage.overview[locale]}</p>
        </section>

        <Checklist items={checklist} />

        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("detailedPlaybookTitle")}</h2>
          <LockedTeaser title={t("detailedPlaybookTitle")} body={t("detailedPlaybookLockedBody")}>
            <div className="flex flex-col gap-3 p-5">
              {[90, 70, 80, 60].map((width, index) => (
                <div key={index} className="h-4 rounded-full bg-fill-strong" style={{ width: `${width}%` }} />
              ))}
            </div>
          </LockedTeaser>
        </section>
      </div>
    </div>
  );
}
