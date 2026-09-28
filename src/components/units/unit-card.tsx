import { ChevronRight, FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";
import { ToastButton } from "@/components/common/toast";
import { UnitGlyph } from "@/components/common/icons";
import type { AppLocale } from "@/i18n/routing";
import type { UnitFixture } from "@/demo/fixtures/types";

/**
 * One unit on the Units screen. The header opens the unit page (a message
 * until the full version); managed units add a statement action.
 */
export function UnitCard({ unit }: { unit: UnitFixture }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("units");
  const tToast = useTranslations("toast");
  const isManaged = unit.operatingModel === "managed_for_owner";
  const profit = (isManaged ? unit.managerProfit : unit.netProfit)!;

  return (
    <article className="rounded-card bg-fill p-4" data-testid="unit-card">
      <ToastButton message={tToast("unitPage")} className="flex w-full items-center gap-3 text-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-page text-ink-2">
          <UnitGlyph model={unit.operatingModel} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold">{unit.name[locale]}</span>
          <span className="block text-xs leading-snug text-muted">
            {t(`operatingModel.${unit.operatingModel}`)} · {unit.area[locale]}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
      </ToastButton>

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-tile bg-page p-3 text-center">
        <div>
          <dt className="text-[0.6875rem] text-muted">{t("occupancyLabel")}</dt>
          <dd className="mt-1 text-[0.9375rem] font-semibold">
            <Percent ratio={unit.occupancy} decimals={0} />
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] text-muted">{t("adrLabel")}</dt>
          <dd className="mt-1 text-[0.9375rem] font-semibold">
            <Money amount={unit.adr} decimals={0} hideCurrency />
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] text-muted">{isManaged ? t("managerProfitLabel") : t("netProfitLabel")}</dt>
          <dd className="mt-1 text-[0.9375rem] font-semibold">
            <Money amount={profit} decimals={0} hideCurrency colorBySign signDisplay="always" />
          </dd>
        </div>
      </dl>

      {isManaged && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="truncate text-xs leading-snug text-muted">
            {t("ownerLabel", { name: unit.owner![locale] })}
          </span>
          {unit.hasStatement ? (
            <Link
              href={`/demo/units/${unit.id}/statement`}
              className="tap flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-page px-4 text-sm font-medium text-brand"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t("viewStatementCta")}
            </Link>
          ) : (
            <ToastButton
              message={tToast("statementLater")}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-page px-4 text-sm font-medium text-brand"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t("viewStatementCta")}
            </ToastButton>
          )}
        </div>
      )}
    </article>
  );
}
