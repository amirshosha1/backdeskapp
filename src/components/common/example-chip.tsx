import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * "مثال · أرقام توضيحية": the label at the top of every screen that shows
 * sample data (sample units, the sample statement, the guide, the example
 * calculator, the add-expense screen), independent of the top line. Never
 * shown on a screen with the person's own data.
 */
/** `compact` fits under a title inside the hero's 44 px top bar (the calculator, which must fit one screen). */
export function ExampleChip({ onDark, compact, className }: { onDark?: boolean; compact?: boolean; className?: string }) {
  const t = useTranslations("common");
  return (
    <div className={cn("flex justify-center", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-full font-semibold",
          compact ? "px-2 text-[0.6875rem] leading-[1.125rem]" : "px-3 py-1 text-xs",
          onDark ? "glass text-white" : "bg-amber-soft text-amber",
        )}
        data-testid="example-chip"
      >
        {t("exampleChip")}
      </span>
    </div>
  );
}
