import { useLocale, useTranslations } from "next-intl";
import { ExpenseGlyph } from "@/components/common/icons";
import { ListRow } from "@/components/common/list-row";
import { Money } from "@/components/common/money";
import { HeroBackLink, HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { formatPercent } from "@/lib/format/percent";
import { ExpenseBubbles } from "./expense-bubbles";
import type { AppLocale } from "@/i18n/routing";
import type { EXPENSE_BREAKDOWN } from "@/demo/fixtures/expense";
import type { Localized } from "@/demo/fixtures/types";

export interface ExpensesScreenProps {
  period: Localized;
  breakdown: typeof EXPENSE_BREAKDOWN;
}

/** Home → "التفاصيل": where the month's money went, as bubbles then as a list. */
export function ExpensesScreen({ period, breakdown }: ExpensesScreenProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;

  return (
    <div>
      <RoyalHero
        leading={<HeroBackLink href="/demo" label={tCommon("back")} />}
        center={<HeroTitle>{t("title")}</HeroTitle>}
        className="pb-8"
        example
      >
        <ExpenseBubbles bubbles={breakdown.bubbles} label={t("bubblesLabel")} />
      </RoyalHero>

      <div className="px-4 pt-6">
        <section className="rounded-card bg-fill px-5 py-6 text-center">
          <p className="text-sm text-muted">{t("totalLabel", { period: period[locale] })}</p>
          <p className="mt-2 text-4xl font-medium tracking-tight">
            <Money amount={breakdown.total} />
          </p>
        </section>

        <h2 className="mt-8 text-lg font-semibold">{t("listTitle")}</h2>
        <div className="mt-1">
          {breakdown.categories.map((category) => (
            <ListRow
              key={category.id}
              icon={<ExpenseGlyph icon={category.icon} />}
              title={category.name[locale]}
              subtitle={t("shareOfTotal", {
                share: formatPercent(category.share, { locale, decimals: 1, isolate: true }),
              })}
              trailing={<Money amount={category.amount} className="text-[0.9375rem] font-semibold" />}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
