import { setRequestLocale } from "next-intl/server";
import { StageDetailScreen } from "@/components/guide/stage-detail-screen";
import { GUIDE_STAGES, STAGE_3_CHECKLIST } from "@/demo/fixtures/guide";

const stage = GUIDE_STAGES.find((s) => s.id === "3")!;

export default async function GuideStage3Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StageDetailScreen stage={stage} checklist={STAGE_3_CHECKLIST} />;
}
