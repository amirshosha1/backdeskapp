import { useTranslations } from "next-intl";
import { UnitCard } from "./unit-card";
import type { UnitFixture } from "@/demo/fixtures/types";

export function UnitsScreen({ units }: { units: UnitFixture[] }) {
  const t = useTranslations("units");

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      {units.map((unit) => (
        <UnitCard key={unit.id} unit={unit} />
      ))}
    </div>
  );
}
