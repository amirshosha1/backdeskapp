import { setRequestLocale } from "next-intl/server";
import { ExpensesScreen } from "@/components/expenses/expenses-screen";
import { EXPENSE_BREAKDOWN } from "@/demo/fixtures/expense";
import { HOME_PERIOD } from "@/demo/fixtures/home";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ExpensesScreen period={HOME_PERIOD} breakdown={EXPENSE_BREAKDOWN} />;
}
