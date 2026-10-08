import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FeedbackLink } from "./feedback-button";
import { cn } from "@/lib/utils";

/**
 * The line at the top of every `/demo` screen, with the "رأيك؟" feedback
 * link beside it once a WhatsApp number is set.
 *
 * - "sample": "بيانات تجريبية" — for visitors, and on every screen that
 *   shows sample data (BUILD_PLAN.md Phase P).
 * - "account": "شققك محفوظة في حسابك" — a signed-in person's own apartments
 *   are real data and are never labelled as sample (Batch 3 PR B).
 * - "pending": the same height, empty, while it isn't known yet whether the
 *   person is signed in, so neither label is shown wrongly.
 */
export type BannerMode = "sample" | "account" | "pending";

export function DemoBanner({ onHero, mode = "sample", trailing }: { onHero?: boolean; mode?: BannerMode; trailing?: ReactNode }) {
  const t = useTranslations("common");
  const tAccount = useTranslations("account");

  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1 pt-[calc(0.375rem+env(safe-area-inset-top))] pb-1 text-[0.6875rem] tracking-wide",
        onHero ? "text-white/65" : "text-muted",
      )}
    >
      {mode === "sample" && <span data-testid="demo-banner">{t("sampleDataBanner")}</span>}
      {mode === "account" && <span data-testid="account-banner">{tAccount("bannerAccount")}</span>}
      {mode === "pending" && (
        <span className="invisible" aria-hidden="true">
          {t("sampleDataBanner")}
        </span>
      )}
      {trailing}
      <FeedbackLink onHero={onHero} />
    </p>
  );
}
