import { ArrowDownLeft, FileText, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToastButton } from "@/components/common/toast";
import type { HomeView } from "./view-switch";

const PILL = "tap flex h-12 min-w-0 flex-1 basis-0 items-center justify-center gap-1 rounded-full px-1.5 text-[0.8125rem] font-medium whitespace-nowrap";

/**
 * Pill quick actions under the hero. The third action depends on the view:
 * owners get the month report (arrives with P.2), co-hosts get the owner
 * statement.
 */
export function QuickActions({ view }: { view: HomeView }) {
  const t = useTranslations("home");
  const tToast = useTranslations("toast");

  return (
    <div className="flex gap-2">
      <Link href="/demo/expenses/new" className={`${PILL} grow-[1.25] bg-ink text-white`}>
        <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t("actionAddExpense")}
      </Link>
      <ToastButton message={tToast("addIncome")} className={`${PILL} bg-fill text-ink`}>
        <ArrowDownLeft className="h-4 w-4 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
        {t("actionAddIncome")}
      </ToastButton>
      {view === "owner" ? (
        <ToastButton message={tToast("monthReport")} className={`${PILL} bg-fill text-ink`}>
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("actionMonthReport")}
        </ToastButton>
      ) : (
        <Link href="/demo/units/downtown-cairo/statement" className={`${PILL} bg-fill text-ink`}>
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("actionStatement")}
        </Link>
      )}
    </div>
  );
}
