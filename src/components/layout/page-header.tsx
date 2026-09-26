import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export interface PageHeaderProps {
  title: string;
  backHref?: string;
  action?: ReactNode;
}

/**
 * A "back" chevron points toward the reading-direction start: left in LTR,
 * right in RTL. `ChevronLeft` is the correct unrotated (LTR) icon; CSS
 * flips it via `rtl:rotate-180` for Arabic — never a hardcoded left or
 * right (CLAUDE.md §7).
 */
export function PageHeader({ title, backHref, action }: PageHeaderProps) {
  const t = useTranslations("common");

  return (
    <header className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
      {backHref && (
        <Link
          href={backHref}
          aria-label={t("back")}
          className="-ms-2 flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted"
        >
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      )}
      <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
      {action}
    </header>
  );
}
