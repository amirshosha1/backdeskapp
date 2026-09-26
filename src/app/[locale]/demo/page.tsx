import { setRequestLocale } from "next-intl/server";
import { HomeScreen } from "@/components/home/home-screen";
import { HOME_COHOST_VIEW, HOME_OWNER_VIEW } from "@/demo/fixtures/home";

export default async function DemoHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeScreen ownerView={HOME_OWNER_VIEW} coHostView={HOME_COHOST_VIEW} />;
}
