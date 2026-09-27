import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ToastButton } from "./toast";
import { cn } from "@/lib/utils";

export interface ListRowProps {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  /** Navigate on tap. */
  href?: string;
  /** Or explain, on tap, that this opens in the full version. */
  comingSoon?: string;
  /** Tint of the circular avatar. */
  tone?: "neutral" | "brand" | "profit" | "loss" | "amber";
  /** Let the subtitle wrap to two lines instead of truncating. */
  multiline?: boolean;
  /** Hide the trailing chevron (e.g. when `trailing` already shows a lock). */
  hideChevron?: boolean;
  className?: string;
}

const TONES = {
  neutral: "bg-fill text-ink-2",
  brand: "bg-brand-soft text-brand",
  profit: "bg-profit-soft text-profit",
  loss: "bg-loss-soft text-loss",
  amber: "bg-amber-soft text-amber",
} as const;

/**
 * A clean list row with a circular icon avatar (the "Recent Transactions"
 * pattern). Rows are tappable only when they do something: a link, or a
 * clear "coming in the full version" message — never a silent tap.
 */
export function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  href,
  comingSoon,
  tone = "neutral",
  multiline,
  hideChevron,
  className,
}: ListRowProps) {
  const interactive = Boolean(href || comingSoon);
  const body = (
    <>
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", TONES[tone])}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span className="block truncate text-[0.9375rem] font-medium">{title}</span>
        {subtitle && (
          <span className={cn("mt-0.5 block text-xs text-muted", multiline ? "line-clamp-2 leading-relaxed" : "truncate")}>
            {subtitle}
          </span>
        )}
      </span>
      {trailing && <span className="shrink-0 text-end">{trailing}</span>}
      {interactive && !hideChevron && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
      )}
    </>
  );
  const rowClass = cn("flex w-full items-center gap-3 py-3", className);

  if (href) {
    return (
      <Link href={href} className={cn("tap", rowClass)}>
        {body}
      </Link>
    );
  }
  if (comingSoon) {
    return (
      <ToastButton message={comingSoon} className={rowClass}>
        {body}
      </ToastButton>
    );
  }
  return <div className={rowClass}>{body}</div>;
}
