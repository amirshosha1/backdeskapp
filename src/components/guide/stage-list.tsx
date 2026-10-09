import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ListRow } from "@/components/common/list-row";
import { ToastButton } from "@/components/common/toast";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import type { AppLocale } from "@/i18n/routing";
import type { GuideStage } from "@/demo/fixtures/guide";

/** Only stage 3 has a built page in the prototype; the rest say so on tap. */
const LINKED_STAGE_ID = "3";

export function StageList({ stages }: { stages: GuideStage[] }) {
  const t = useTranslations("guide");
  const tToast = useTranslations("toast");
  const locale = useLocale() as AppLocale;

  return (
    <div>
      <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>} example>
        <p className="mt-6 text-center text-[0.9375rem] text-white/80">{t("subtitle")}</p>
        {/* Quick jump: stage 3 opens its page, the others explain on tap. */}
        <ol className="mt-5 flex justify-center gap-2">
          {stages.map((stage) => {
            const label = t("stageLabel", { order: stage.order });
            const circle = "tap flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold";
            return (
              <li key={stage.id}>
                {stage.id === LINKED_STAGE_ID ? (
                  <Link
                    href={`/demo/guide/${stage.id}`}
                    aria-label={label}
                    className={`${circle} bg-white text-navy-900 shadow-[0_6px_16px_-8px_rgb(1_8_36/0.7)]`}
                  >
                    {stage.order}
                  </Link>
                ) : (
                  <ToastButton message={tToast("stageLocked")} aria-label={label} className={`${circle} glass`}>
                    {stage.order}
                  </ToastButton>
                )}
              </li>
            );
          })}
        </ol>
      </RoyalHero>

      <ol className="px-4 pt-4">
        {stages.map((stage) => {
          const linked = stage.id === LINKED_STAGE_ID;
          return (
            <li key={stage.id} className="border-b border-line last:border-b-0">
              <ListRow
                tone={linked ? "brand" : "neutral"}
                icon={<span className="text-sm font-semibold">{stage.order}</span>}
                title={stage.title[locale]}
                subtitle={stage.overview[locale]}
                trailing={linked ? undefined : <Lock className="h-4 w-4 text-muted" aria-hidden="true" />}
                hideChevron={!linked}
                multiline
                href={linked ? `/demo/guide/${stage.id}` : undefined}
                comingSoon={linked ? undefined : tToast("stageLocked")}
                className="py-4"
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
