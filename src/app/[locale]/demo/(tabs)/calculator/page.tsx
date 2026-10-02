import { setRequestLocale } from "next-intl/server";
import { CalculatorScreen } from "@/components/calculator/calculator-screen";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CalculatorScreen presets={CALCULATOR_PRESETS} />;
}
