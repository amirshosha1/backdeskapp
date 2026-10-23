import { useLocale } from "next-intl";
import { formatMoneyParts } from "@/lib/format/money";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface HeroFigureProps {
  amount: string;
  /**
   * "lg" (56px) leads a screen; "md" (48px, 40px on a viewport under 820px
   * tall) and "sm" (40px) where the screen's controls need the height.
   */
  size?: "lg" | "md" | "sm";
  /** Decimals shown (default 2); 0 for whole pounds. Presentation only (half-up). */
  decimals?: number;
  /** Hide the sign: for a figure shown beside the word that already says loss or profit (the landing example). */
  unsigned?: boolean;
  className?: string;
}

/**
 * The one number a screen leads with (≥ 48px, same sans as everything else):
 * whole units in full weight, decimals dimmed, currency small.
 */
export function HeroFigure({ amount, size = "lg", decimals, unsigned = false, className }: HeroFigureProps) {
  const locale = useLocale() as AppLocale;
  const parts = formatMoneyParts(amount, { locale, decimals });
  const number = (
    <bdi
      dir="ltr"
      className={cn(
        "leading-none font-medium tracking-[-0.04em]",
        size === "lg" ? "text-[3.5rem]" : size === "md" ? "text-[3rem] [@media(max-height:820px)]:text-[2.5rem]" : "text-[2.5rem]",
      )}
    >
      {unsigned ? "" : parts.sign}
      {parts.integer}
      <span className="opacity-45">{parts.fraction}</span>
    </bdi>
  );
  const label = <span className="text-base font-medium opacity-70">{parts.currency}</span>;

  return (
    <p className={cn("flex items-baseline justify-center gap-1.5", className)} data-testid="hero-figure">
      {locale === "ar" ? (
        <>
          {number}
          {label}
        </>
      ) : (
        <>
          {label}
          {number}
        </>
      )}
    </p>
  );
}
