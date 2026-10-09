import { setRequestLocale } from "next-intl/server";
import { FirstRunGate } from "@/components/first-run/first-run-gate";
import { FirstRunRedirectScript } from "@/components/first-run/first-run-redirect-script";
import { HomeScreen } from "@/components/home/home-screen";

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
      <HomeScreen />
    </>
  );
}
