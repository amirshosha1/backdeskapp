import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="relative overflow-hidden rounded-card border border-border">
      <div aria-hidden="true" className="pointer-events-none select-none opacity-70 blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/60 p-4 text-center">
        <Lock className="h-5 w-5 text-locked" aria-hidden="true" />
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-foreground-muted">{body}</p>
        <Button asChild size="sm" variant="outline">
          <Link href="/demo/pricing">{t("unlockWithPro")}</Link>
        </Button>
      </div>
    </div>
  );
}
