import { setRequestLocale } from "next-intl/server";
import { StageList } from "@/components/guide/stage-list";
import { GUIDE_STAGES } from "@/demo/fixtures/guide";

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StageList stages={GUIDE_STAGES} />;
}
