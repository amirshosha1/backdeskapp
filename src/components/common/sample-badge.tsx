import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

/** Marks any figure without a real source (CLAUDE.md §2). */
export function SampleBadge() {
  const t = useTranslations("common");
  return <Badge variant="sample">{t("sampleBadge")}</Badge>;
}
