import Decimal from "decimal.js";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export interface BreakEvenProgressProps {
  bookedNights: number;
  breakEvenNights: string;
  reached: boolean;
}

export function BreakEvenProgress({ bookedNights, breakEvenNights, reached }: BreakEvenProgressProps) {
  const t = useTranslations("home");
  const target = new Decimal(breakEvenNights).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
  const percent = Math.min(100, (bookedNights / Number(breakEvenNights)) * 100);

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("breakEvenTitle")}</h2>
        <Badge variant={reached ? "profit" : "warning"}>
          {reached ? t("breakEvenReached") : t("breakEvenNotReached")}
        </Badge>
      </div>
      <Progress value={percent} className="mt-3" />
      <p className="mt-2 text-sm text-foreground-muted">
        {t("breakEvenProgress", { booked: bookedNights, target })}
      </p>
    </div>
  );
}
