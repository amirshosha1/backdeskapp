import { setRequestLocale } from "next-intl/server";
import { UnitsScreen } from "@/components/units/units-screen";
import { UNITS } from "@/demo/fixtures/units";

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UnitsScreen units={UNITS} />;
}
