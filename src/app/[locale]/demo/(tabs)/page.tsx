import { setRequestLocale } from "next-intl/server";
import { FirstRunGate } from "@/components/first-run/first-run-gate";
import { FirstRunRedirectScript } from "@/components/first-run/first-run-redirect-script";
import { HomeScreen } from "@/components/home/home-screen";
import { HOME_COHOST_VIEW, HOME_OWNER_VIEW, HOME_PERIOD } from "@/demo/fixtures/home";

export default async function DemoHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <FirstRunRedirectScript />
      <FirstRunGate />
      <HomeScreen period={HOME_PERIOD} ownerView={HOME_OWNER_VIEW} coHostView={HOME_COHOST_VIEW} />
    </>
  );
}
