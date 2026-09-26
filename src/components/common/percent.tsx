import { useLocale } from "next-intl";
import { capDisplayRatio, formatPercent } from "@/lib/format/percent";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface PercentProps {
  ratio: number;
  decimals?: number;
  /** Caps the displayed value at 100% (BUILD_PLAN.md §4.1). Default: true. */
  capAt100?: boolean;
  className?: string;
}

/**
 * Renders a ratio as a percentage. Occupancy is never clamped silently in
 * the engine, but the *displayed* value is capped at 100% here; pair this
 * with `<DataWarning />` when `isOverCapacity` is true so the cap is never
 * silent in the UI either.
 */
export function Percent({ ratio, decimals, capAt100 = true, className }: PercentProps) {
  const locale = useLocale() as AppLocale;
  const { display } = capDisplayRatio(ratio);
  const value = capAt100 ? display : ratio;

  return (
    <span className={cn("tabular-nums-money", className)}>
      {formatPercent(value, { locale, decimals })}
    </span>
  );
}

export { capDisplayRatio };
