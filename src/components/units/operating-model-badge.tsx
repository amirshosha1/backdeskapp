import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { OperatingModel } from "@/demo/fixtures/types";

export function OperatingModelBadge({ model }: { model: OperatingModel }) {
  const t = useTranslations("units.operatingModel");
  return <Badge variant="outline">{t(model)}</Badge>;
}
