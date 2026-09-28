import { setRequestLocale } from "next-intl/server";
import { CalculatorScreen } from "@/components/calculator/calculator-screen";
import { CALCULATOR_RESULTS, CALCULATOR_STEPS } from "@/demo/fixtures/calculator";

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CalculatorScreen steps={CALCULATOR_STEPS} results={CALCULATOR_RESULTS} />;
}
