import { setRequestLocale } from "next-intl/server";
import { MoreScreen } from "@/components/more/more-screen";

export default async function MorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MoreScreen />;
}
