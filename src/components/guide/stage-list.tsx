import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import type { GuideStage } from "@/demo/fixtures/guide";

/** Only stage 3 links through in Phase P — the one stage page this phase builds. */
const LINKED_STAGE_ID = "3";

export function StageList({ stages }: { stages: GuideStage[] }) {
  const t = useTranslations("guide");
  const locale = useLocale() as AppLocale;

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      {stages.map((stage) => {
        const content = (
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-foreground-muted">
                  {t("stageLabel", { order: stage.order })}
                </p>
                <p className="font-semibold">{stage.title[locale]}</p>
                <p className="mt-1 text-sm text-foreground-muted">{stage.overview[locale]}</p>
              </div>
              {stage.id === LINKED_STAGE_ID && (
                <ChevronRight className="h-5 w-5 shrink-0 rtl:rotate-180" aria-hidden="true" />
              )}
            </CardContent>
          </Card>
        );

        return stage.id === LINKED_STAGE_ID ? (
          <Link key={stage.id} href={`/demo/guide/${stage.id}`}>
            {content}
          </Link>
        ) : (
          <div key={stage.id}>{content}</div>
        );
      })}
    </div>
  );
}
