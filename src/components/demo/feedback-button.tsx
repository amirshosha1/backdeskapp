"use client";

import { useTranslations } from "next-intl";
import { MailLink } from "@/components/common/mail-link";
import { usePathname } from "@/i18n/navigation";
import { FEEDBACK_SUBJECT, supportMailto } from "@/lib/contact";
import { cn } from "@/lib/utils";

/**
 * "رأيك؟" — opens an email to support with the current screen path
 * prefilled (nothing else about the visitor). It sits in the top line of
 * every `/demo` screen, so it never covers content. If no mail app opens,
 * a sheet shows the address with a copy button (MailLink).
 */
export function FeedbackLink({ onHero }: { onHero?: boolean }) {
  const t = useTranslations("common");
  const pathname = usePathname();

  return (
    <MailLink
      href={supportMailto(FEEDBACK_SUBJECT, t("feedbackPrefill", { path: pathname }))}
      testId="feedback-link"
      className={cn(
        "tap ms-2 rounded-full px-2 py-0.5 font-semibold underline-offset-2",
        onHero ? "bg-white/15 text-white" : "bg-brand-soft text-brand",
      )}
    >
      {t("feedbackCta")}
    </MailLink>
  );
}
