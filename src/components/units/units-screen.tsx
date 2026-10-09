import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/empty-state";
import { UnitsExamples, UnitsHero, UnitsOwnArea } from "./account-units";
import { UnitCard } from "./unit-card";
import type { UnitFixture } from "@/demo/fixtures/types";

/**
 * Units: the visitor's own first unit (kept in this browser), or a
 * signed-in person's apartments from their account, on top; then the
 * sample units under "أمثلة تجريبية", only while they have no apartment.
 */
export function UnitsScreen({ units }: { units: UnitFixture[] }) {
  const t = useTranslations("units");

  return (
    <div>
      <UnitsHero />

      <div className="flex flex-col gap-3 px-4 pt-6">
        <UnitsOwnArea />
        <UnitsExamples>
          <h2 className="mt-3 text-base font-semibold" data-testid="examples-heading">
            {t("examplesHeading")}
          </h2>
          {units.length === 0 ? (
            <EmptyState icon={<Building2 className="h-7 w-7" aria-hidden="true" />} title={t("emptyTitle")} body={t("emptyBody")} />
          ) : (
            units.map((unit) => <UnitCard key={unit.id} unit={unit} />)
          )}
        </UnitsExamples>
      </div>
    </div>
  );
}
