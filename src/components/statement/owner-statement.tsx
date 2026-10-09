import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/common/money";
import type { AppLocale } from "@/i18n/routing";
import type { STATEMENT } from "@/demo/fixtures/statement";
import { cn } from "@/lib/utils";

/**
 * The owner statement keeps direction B's ledger look (Amir's condition in
 * Phase P.1): ink on paper, dotted leaders, dashed rules between lines and a
 * double rule above each total — the page an owner is meant to trust.
 */
export function OwnerStatement({ statement }: { statement: typeof STATEMENT }) {
  const t = useTranslations("statement");
  const locale = useLocale() as AppLocale;

  return (
    <div>
      <PageHeader title={t("title")} backHref="/demo/units" example />
      <div className="px-4 pt-3">
        <article className="rounded-card bg-paper px-5 pt-5 pb-3 shadow-[0_1px_2px_rgb(10_18_36/0.04),0_16px_32px_-20px_rgb(10_18_36/0.25)]">
          <header className="border-b-2 border-ink pb-4">
            <h2 className="text-xl font-bold">{statement.unitName[locale]}</h2>
            <p className="mt-0.5 text-sm text-ink-2">
              {statement.ownerName[locale]} · {statement.period[locale]}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="profit">{t("statusFinalized")}</Badge>
              <Badge variant="onFill">{t("basisCash")}</Badge>
              <Badge variant="onFill">
                <bdi>{t("number", { number: statement.number })}</bdi>
              </Badge>
            </div>
          </header>

          <dl className="text-sm">
            <Line label={t("openingBalanceLabel")} amount={statement.openingBalance} />
            <Line label={t("grossRevenueLabel")} amount={statement.grossRevenue} />
            <Line label={t("platformFeesLabel")} amount={statement.platformFees} />
            <Line label={t("netPayoutLabel")} amount={statement.netPayout} total />
            <Line label={t("ownerExpensesLabel")} amount={statement.ownerExpensesTotal} />
          </dl>
          {/* A plain list, not part of either <dl> above: a <dl>'s child div may
              only contain dt/dd (axe: definition-list), so this breakdown sits
              between the two <dl>s instead of nested inside the expenses line. */}
          <ul className="flex flex-col gap-1.5 border-t border-dashed border-rule-strong py-3 ps-3 text-xs text-muted">
            {statement.ownerExpenses.map((line) => (
              <li key={line.category.en} className="flex items-baseline gap-2">
                <span>{line.category[locale]}</span>
                <span className="flex-1 border-b border-dotted border-rule" aria-hidden="true" />
                <Money amount={line.amount} hideCurrency />
              </li>
            ))}
          </ul>
          <dl className="text-sm">
            <Line
              label={t("commissionLabel", { basis: statement.commissionBasis[locale] })}
              amount={statement.commission}
            />
            <Line label={t("ownerNetLabel")} amount={statement.ownerNet} total />
            <Line label={t("ownerPayoutsLabel")} amount={statement.ownerPayouts} />
            <Line label={t("balanceDueLabel")} amount={statement.balanceDue} total grand />
          </dl>
        </article>

        {/* "تنزيل PDF" and "رابط للمالك" are hidden on the sample (hotfix, 2026-10-09):
            they come back with real statements (Phase 5). */}
      </div>
    </div>
  );
}

function Line({
  label,
  amount,
  total,
  grand,
}: {
  label: string;
  amount: string;
  total?: boolean;
  grand?: boolean;
}) {
  return (
    // dt/dd sit directly in this div — the one wrapping div a <dl> allows
    // per child group (axe: definition-list/dlitem) — rather than in an
    // extra nested flex div, which put them two levels below the <dl>.
    <div
      className={cn(
        "flex items-baseline gap-2 py-3",
        total
          ? "border-t border-ink shadow-[inset_0_3px_0_-2px_var(--color-paper),inset_0_4px_0_-2px_var(--color-ink)]"
          : "border-t border-dashed border-rule-strong",
      )}
    >
      <dt className={cn(total ? "font-semibold text-ink" : "text-ink-2", grand && "text-base")}>{label}</dt>
      <span className="flex-1 border-b border-dotted border-rule" aria-hidden="true" />
      <dd className={cn("font-semibold", grand && "text-lg")}>
        <Money amount={amount} />
      </dd>
    </div>
  );
}
