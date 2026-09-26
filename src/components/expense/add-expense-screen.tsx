"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AmountKeypad } from "./amount-keypad";
import { CategoryChips } from "./category-chips";
import type { AppLocale } from "@/i18n/routing";
import type { ExpenseCategory } from "@/demo/fixtures/expense";
import type { UnitFixture } from "@/demo/fixtures/types";

export interface AddExpenseScreenProps {
  categories: ExpenseCategory[];
  unit: UnitFixture;
}

/**
 * BUILD_PLAN.md Phase P/5: add expense in ≤ 4 taps, not counting the amount
 * digits. The unit is preselected and the date defaults to today, so
 * completing the flow takes exactly 3: the Home "Add expense" button (not
 * part of this screen), a category chip, then Save.
 */
export function AddExpenseScreen({ categories, unit }: AddExpenseScreenProps) {
  const t = useTranslations("expense");
  const locale = useLocale() as AppLocale;
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const today = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    day: "numeric",
    month: "long",
  }).format(new Date());

  const canSave = Number(amount) > 0 && categoryId !== null;

  if (saved) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("title")} backHref="/demo" />
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-profit" aria-hidden="true" />
          <h2 className="text-lg font-semibold">{t("confirmationTitle")}</h2>
          <p className="text-sm text-foreground-muted">{t("confirmationBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t("title")} backHref="/demo" />
      <div className="flex flex-col gap-5 p-4 pb-24">
        <AmountKeypad value={amount} onChange={setAmount} />

        <div>
          <p className="mb-2 text-sm font-medium text-foreground-muted">{t("categoryLabel")}</p>
          <CategoryChips categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
          <span className="text-foreground-muted">{t("unitLabel")}</span>
          <span className="font-medium">{unit.name[locale]}</span>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
          <span className="text-foreground-muted">{t("dateLabel")}</span>
          <span className="font-medium">
            {t("todayLabel")} · {today}
          </span>
        </div>

        <Button size="lg" disabled={!canSave} onClick={() => setSaved(true)}>
          {t("saveCta")}
        </Button>
      </div>
    </div>
  );
}
