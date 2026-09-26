import { useTranslations } from "next-intl";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";

export interface KpiGridProps {
  occupancy: number;
  adr: string;
  revpar: string;
}

export function KpiGrid({ occupancy, adr, revpar }: KpiGridProps) {
  const t = useTranslations("home");

  const items = [
    { label: t("kpiOccupancy"), value: <Percent ratio={occupancy} /> },
    { label: t("kpiAdr"), value: <Money amount={adr} /> },
    { label: t("kpiRevpar"), value: <Money amount={revpar} /> },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-card border border-border bg-surface p-3 text-center">
          <p className="text-xs text-foreground-muted">{item.label}</p>
          <p className="mt-1 font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
