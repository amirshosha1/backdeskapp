"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { feedbackWhatsAppUrl } from "@/lib/whatsapp";

/**
 * "رأيك؟" — opens WhatsApp with the current screen prefilled. It sits in
 * the sample-data banner of every `/demo` screen, so it never covers
 * content. Hidden until `NEXT_PUBLIC_FEEDBACK_WHATSAPP` is set.
 */
export function FeedbackLink({ onHero }: { onHero?: boolean }) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const href = feedbackWhatsAppUrl(t("feedbackPrefill", { path: pathname }));

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="feedback-link"
      className={cn(
        "tap ms-2 rounded-full px-2 py-0.5 font-semibold underline-offset-2",
        onHero ? "bg-white/15 text-white" : "bg-brand-soft text-brand",
      )}
    >
      {t("feedbackCta")}
    </a>
  );
}
