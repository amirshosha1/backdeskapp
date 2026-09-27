"use client";

import { BookOpen, Building2, Calculator, House, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/demo", labelKey: "home", Icon: House },
  { href: "/demo/calculator", labelKey: "calculator", Icon: Calculator },
  { href: "/demo/guide", labelKey: "guide", Icon: BookOpen },
  { href: "/demo/units", labelKey: "units", Icon: Building2 },
  { href: "/demo/more", labelKey: "more", Icon: LayoutGrid },
] as const;

/**
 * Floating dark navigation pill (CLAUDE.md §7: thumb-reachable bottom
 * navigation). The active tab is a filled white circle. Home's sub-screen
 * (expense details) keeps Home active; other tabs match on their prefix.
 */
export function BottomNav() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  return (
    <nav
      aria-label={tCommon("bottomNavLabel")}
      className="nav-pill fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex h-[4.5rem] items-center justify-between rounded-full px-2"
    >
      {TABS.map(({ href, labelKey, Icon }) => {
        const isActive =
          href === "/demo"
            ? pathname === "/demo" || pathname.startsWith("/demo/expenses")
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "tap flex flex-1 flex-col items-center gap-0.5 text-[0.6875rem]",
              isActive ? "font-semibold text-white" : "text-[#8c95ab]",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                isActive && "bg-white text-navy-900",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
