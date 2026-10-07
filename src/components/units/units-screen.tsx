import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/empty-state";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { OwnUnitsCount, OwnUnitSection } from "./own-unit";
import { UnitCard } from "./unit-card";
import type { UnitFixture } from "@/demo/fixtures/types";

/**
 * Units: the visitor's own first unit (kept in this browser) on top, then
 * the sample units, unchanged, under "أمثلة تجريبية".
 */
export function UnitsScreen({ units }: { units: UnitFixture[] }) {
  const t = useTranslations("units");

  return (
    <div>
      <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>}>
        <OwnUnitsCount />
      </RoyalHero>

      <div className="flex flex-col gap-3 px-4 pt-6">
        <OwnUnitSection />
        <h2 className="mt-3 text-base font-semibold" data-testid="examples-heading">
          {t("examplesHeading")}
        </h2>
        {units.length === 0 ? (
          <EmptyState icon={<Building2 className="h-7 w-7" aria-hidden="true" />} title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          units.map((unit) => <UnitCard key={unit.id} unit={unit} />)
        )}
      </div>
    </div>
  );
}
