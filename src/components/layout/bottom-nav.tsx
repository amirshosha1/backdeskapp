"use client";

import { Calculator, Home, ListChecks, MoreHorizontal, ScrollText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/demo", labelKey: "home", Icon: Home },
  { href: "/demo/calculator", labelKey: "calculator", Icon: Calculator },
  { href: "/demo/guide", labelKey: "guide", Icon: ScrollText },
  { href: "/demo/units", labelKey: "units", Icon: ListChecks },
  { href: "/demo/more", labelKey: "more", Icon: MoreHorizontal },
] as const;

/**
 * Thumb-reachable bottom navigation (CLAUDE.md §7): Home, Calculator, Guide,
 * Units, More. Active state matches on the full path so `/demo/guide/3`
 * still highlights the Guide tab.
 */
export function BottomNav() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  return (
    <nav
      aria-label={tCommon("bottomNavLabel")}
      className="fixed inset-x-0 bottom-0 z-20 flex h-[4.5rem] border-t border-border bg-surface"
    >
      {TABS.map(({ href, labelKey, Icon }) => {
        const isActive = href === "/demo" ? pathname === "/demo" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
              isActive ? "text-primary" : "text-foreground-muted",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
