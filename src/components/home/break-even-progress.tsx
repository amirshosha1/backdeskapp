import { CircleAlert, CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import type { Localized } from "@/demo/fixtures/types";
import { cn } from "@/lib/utils";

export interface BreakEvenProgressProps {
  unitName: Localized;
  bookedNights: number;
  /** Rounded break-even nights to show, e.g. 19 for 18.99. */
  targetNights: number;
  /** Nights still needed, from the fixture (the engine provides it from Phase 1). */
  nightsShort: number;
  /** Bar fill, 0–1 (booked ÷ break-even nights, presentation only). */
  progress: number;
  reached: boolean;
}

/** "How close is this unit to covering its costs?" — a meter, not a chart. */
export function BreakEvenProgress({
  unitName,
  bookedNights,
  targetNights,
  nightsShort,
  progress,
  reached,
}: BreakEvenProgressProps) {
  const t = useTranslations("home");
  const locale = useLocale() as AppLocale;
  const Icon = reached ? CircleCheck : CircleAlert;

  return (
    <div className="rounded-card bg-fill p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            reached ? "bg-profit-soft text-profit" : "bg-amber-soft text-amber",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] font-semibold">
            {reached
              ? t("breakEvenReachedTitle", { unit: unitName[locale] })
              : t("breakEvenBelowTitle", { unit: unitName[locale] })}
          </h3>
          {!reached && <p className="mt-0.5 text-xs text-muted">{t("breakEvenNeeds", { nights: nightsShort })}</p>}
        </div>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={targetNights}
        aria-valuenow={bookedNights}
        aria-label={t("breakEvenMeterLabel")}
        className="relative mt-4 h-2 rounded-full bg-amber-track"
      >
        <span
          className={cn("absolute inset-y-0 start-0 rounded-full", reached ? "bg-profit" : "bg-amber")}
          style={{ width: `${Math.min(progress, 1) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{t("breakEvenBooked", { nights: bookedNights })}</span>
        <span>{t("breakEvenAt", { nights: targetNights })}</span>
      </div>
    </div>
  );
}
