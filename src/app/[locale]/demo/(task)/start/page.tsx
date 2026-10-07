import { setRequestLocale } from "next-intl/server";
import { FirstRunScreen } from "@/components/first-run/first-run-screen";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";

/** The first-run guided flow; its answers start from the calculator's rental-arbitrage example. */
export default async function FirstRunPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FirstRunScreen example={CALCULATOR_PRESETS[0]!.form} />;
}
