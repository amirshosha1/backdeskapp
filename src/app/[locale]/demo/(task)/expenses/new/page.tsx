import { setRequestLocale } from "next-intl/server";
import { AddExpenseScreen } from "@/components/expense/add-expense-screen";
import { DEFAULT_EXPENSE_UNIT, EXPENSE_UNITS, RECENT_CATEGORIES } from "@/demo/fixtures/expense";

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AddExpenseScreen categories={RECENT_CATEGORIES} units={EXPENSE_UNITS} defaultUnitId={DEFAULT_EXPENSE_UNIT.id} />
  );
}
