import { useTranslations } from "next-intl";
import { FeedbackLink } from "./feedback-button";
import { cn } from "@/lib/utils";

/**
 * Shown at the top of every `/demo` screen (BUILD_PLAN.md Phase P), with
 * the "رأيك؟" feedback link beside it once a WhatsApp number is set.
 */
export function DemoBanner({ onHero }: { onHero?: boolean }) {
  const t = useTranslations("common");

  return (
    <p
      className={cn(
        "flex items-center justify-center pt-[calc(0.375rem+env(safe-area-inset-top))] pb-1 text-[0.6875rem] tracking-wide",
        onHero ? "text-white/65" : "text-muted",
      )}
    >
      <span data-testid="demo-banner">{t("sampleDataBanner")}</span>
      <FeedbackLink onHero={onHero} />
    </p>
  );
}
