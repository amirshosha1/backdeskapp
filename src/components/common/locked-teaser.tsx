import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export interface LockedTeaserProps {
  title: string;
  body: string;
  children: ReactNode;
}

/**
 * A blurred placeholder for paid-only data (CLAUDE.md §6.5: blurred teasers
 * render placeholder data only — never real paid-plan numbers to a Free
 * client). `children` is decorative filler, not real figures.
 */
export function LockedTeaser({ title, body, children }: LockedTeaserProps) {
  const t = useTranslations("common");

  return (
    <div className="relative overflow-hidden rounded-card bg-fill">
      <div aria-hidden="true" className="pointer-events-none select-none opacity-60 blur-[6px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-page text-brand shadow-sm">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted">{body}</p>
        <Link
          href="/demo/pricing"
          className="tap mt-1 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          {t("unlockWithPro")}
        </Link>
      </div>
    </div>
  );
}
