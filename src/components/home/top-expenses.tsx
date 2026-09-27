import { useLocale, useTranslations } from "next-intl";
import { ListRow } from "@/components/common/list-row";
import { Money } from "@/components/common/money";
import { ExpenseGlyph } from "@/components/common/icons";
import { SectionHeader } from "@/components/common/section-header";
import { formatPercent } from "@/lib/format/percent";
import type { AppLocale } from "@/i18n/routing";
import type { ExpenseShare } from "@/demo/fixtures/types";

/** Home's compact version of the expense breakdown; "التفاصيل" opens the full one. */
export function TopExpenses({ items }: { items: ExpenseShare[] }) {
  const t = useTranslations("home");
  const locale = useLocale() as AppLocale;

  return (
    <section>
      <SectionHeader title={t("topExpensesTitle")} action={{ label: t("details"), href: "/demo/expenses" }} />
      <div className="mt-1">
        {items.map((item) => (
          <ListRow
            key={item.id}
            icon={<ExpenseGlyph icon={item.icon} />}
            title={item.name[locale]}
            subtitle={t("shareOfMonth", {
              share: formatPercent(item.share, { locale, decimals: 0, isolate: true }),
            })}
            trailing={<Money amount={item.amount} className="text-[0.9375rem] font-semibold" />}
          />
        ))}
      </div>
    </section>
  );
}
