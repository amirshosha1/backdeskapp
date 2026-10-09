import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DemoBanner } from "@/components/demo/demo-banner";
import { ExampleChip } from "@/components/common/example-chip";
import { LanguageSwitch } from "./language-switch";

export interface PageHeaderProps {
  title: string;
  backHref?: string;
  action?: ReactNode;
  /** The screen shows sample data: "مثال · أرقام توضيحية" under the title. */
  example?: boolean;
}

/**
 * The light top bar for sub-screens (statement, add expense, a guide
 * stage). A "back" chevron points toward the reading-direction start: left
 * in LTR, right in RTL — `ChevronLeft` flipped by `rtl:rotate-180`, never a
 * hardcoded left or right (CLAUDE.md §7).
 */
export function PageHeader({ title, backHref, action, example }: PageHeaderProps) {
  const t = useTranslations("common");

  return (
    <header className="bg-page px-4 pb-2">
      <DemoBanner />
      <div className="mt-1 flex items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={t("back")}
            className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink"
          >
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        ) : (
          <span className="w-11 shrink-0" aria-hidden="true" />
        )}
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold">{title}</h1>
        {action}
        <LanguageSwitch tone="soft" />
      </div>
      {example && <ExampleChip className="mt-2" />}
    </header>
  );
}
