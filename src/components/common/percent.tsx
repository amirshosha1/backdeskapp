import { useLocale } from "next-intl";
import { capDisplayRatio, formatPercent } from "@/lib/format/percent";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface PercentProps {
  ratio: number;
  decimals?: number;
  /** Caps the displayed value at 100% (BUILD_PLAN.md §4.1). Default: true. */
  capAt100?: boolean;
  signDisplay?: "auto" | "always";
  className?: string;
}

/**
 * A ratio shown as a percentage, inside an LTR isolate so "%" and any sign
 * stay on the right side in Arabic. Occupancy is never clamped silently in
 * the engine; only the *displayed* value is capped here, and callers pair
 * an over-capacity value with `<DataWarning />`.
 */
export function Percent({ ratio, decimals, capAt100 = true, signDisplay, className }: PercentProps) {
  const locale = useLocale() as AppLocale;
  const value = capAt100 ? capDisplayRatio(ratio).display : ratio;

  return (
    <bdi dir="ltr" className={cn("tabular-nums-money", className)}>
      {formatPercent(value, { locale, decimals, signDisplay })}
    </bdi>
  );
}

export { capDisplayRatio };
