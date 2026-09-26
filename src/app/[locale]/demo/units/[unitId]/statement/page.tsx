import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { OwnerStatement } from "@/components/statement/owner-statement";
import { STATEMENT } from "@/demo/fixtures/statement";
import { routing } from "@/i18n/routing";

// Only the Downtown Cairo unit has a built statement in Phase P
// (BUILD_PLAN.md Phase P scope: "one" owner statement screen).
const UNIT_ID_WITH_STATEMENT = "downtown-cairo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale, unitId: UNIT_ID_WITH_STATEMENT }));
}

export default async function UnitStatementPage({
  params,
}: {
  params: Promise<{ locale: string; unitId: string }>;
}) {
  const { locale, unitId } = await params;
  setRequestLocale(locale);

  if (unitId !== UNIT_ID_WITH_STATEMENT) {
    notFound();
  }

  return <OwnerStatement statement={STATEMENT} />;
}
