import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Marks any figure without a real source (CLAUDE.md §2). */
export function SampleBadge({ onDark, className }: { onDark?: boolean; className?: string }) {
  const t = useTranslations("common");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
        onDark ? "bg-white/15 text-white/85" : "bg-amber-soft text-amber",
        className,
      )}
    >
      {t("sampleBadge")}
    </span>
  );
}
