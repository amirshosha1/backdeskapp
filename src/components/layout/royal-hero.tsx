import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/common/brand-mark";
import { DemoBanner } from "@/components/demo/demo-banner";
import { LanguageSwitch } from "./language-switch";
import { cn } from "@/lib/utils";

export interface RoyalHeroProps {
  /** Start of the top bar: the logo mark or a back button. Empty by default (a spacer keeps the title centred). */
  leading?: ReactNode;
  /** Middle of the top bar: a title or a control (Home's view switch). */
  center?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Shown after the top line's text (the calculator's save status). */
  bannerTrailing?: ReactNode;
}

/**
 * The royal-blue panel every tab screen opens with: the top line (DemoBanner),
 * top bar (leading · centre · language switch), then the screen's key
 * figure. Rounded at the bottom; the light page continues underneath.
 */
export function RoyalHero({ leading, center, children, className, bannerTrailing }: RoyalHeroProps) {
  return (
    <section
      className={cn(
        "royal-hero relative overflow-hidden rounded-b-[var(--radius-hero)] px-4 pb-6 text-white",
        className,
      )}
    >
      <DemoBanner onHero trailing={bannerTrailing} />
      <div className="mt-2 flex items-center gap-2">
        {leading ?? <span className="h-11 w-11 shrink-0" aria-hidden="true" />}
        <div className="min-w-0 flex-1">{center}</div>
        <LanguageSwitch />
      </div>
      {children}
    </section>
  );
}

/** The circular brand chip used as the hero's leading element; its accessible name is the brand name. */
export function LogoMark({ label }: { label: string }) {
  return (
    <span
      aria-label={label}
      role="img"
      className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
    >
      <BrandMark />
    </span>
  );
}

/** A centred screen title for the hero's top bar. */
export function HeroTitle({ children }: { children: ReactNode }) {
  return <h1 className="truncate text-center text-base font-semibold">{children}</h1>;
}

/** A frosted back button for the hero's leading slot (points to the reading start). */
export function HeroBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="glass tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
    >
      <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
    </Link>
  );
}
