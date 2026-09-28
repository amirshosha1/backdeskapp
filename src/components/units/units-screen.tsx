import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/empty-state";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { UnitCard } from "./unit-card";
import type { UnitFixture } from "@/demo/fixtures/types";

export function UnitsScreen({ units }: { units: UnitFixture[] }) {
  const t = useTranslations("units");

  return (
    <div>
      <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>}>
        <p className="mt-6 text-center text-3xl font-semibold tracking-tight">{t("count", { count: units.length })}</p>
      </RoyalHero>

      {units.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" aria-hidden="true" />}
          title={t("emptyTitle")}
          body={t("emptyBody")}
        />
      ) : (
        <div className="flex flex-col gap-3 px-4 pt-6">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}
