import { useLocale, useTranslations } from "next-intl";
import { Money } from "@/components/common/money";
import type { AppLocale } from "@/i18n/routing";
import type { Localized } from "@/demo/fixtures/types";

export interface TopExpensesProps {
  items: { category: Localized; amount: string }[];
}

export function TopExpenses({ items }: TopExpensesProps) {
  const t = useTranslations("home");
  const locale = useLocale() as AppLocale;

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold">{t("topExpensesTitle")}</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.category.en} className="flex items-center justify-between text-sm">
            <span>{item.category[locale]}</span>
            <Money amount={item.amount} />
          </li>
        ))}
      </ul>
    </div>
  );
}
