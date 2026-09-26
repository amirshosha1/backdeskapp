import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function StepIndicator({ total }: { total: number }) {
  const t = useTranslations("calculator");

  return (
    <div className="flex items-center gap-1.5" role="list" aria-label={t("title")}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          role="listitem"
          aria-label={t("stepLabel", { step: index + 1, total })}
          className={cn("h-1.5 flex-1 rounded-full bg-primary")}
        />
      ))}
    </div>
  );
}
