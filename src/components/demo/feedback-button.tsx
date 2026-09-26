"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

/**
 * Opens WhatsApp with the current screen name prefilled. Hidden until
 * `NEXT_PUBLIC_FEEDBACK_WHATSAPP` is set — added at Amir's request when
 * approving the Phase P plan.
 */
export function FeedbackButton() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const number = process.env.NEXT_PUBLIC_FEEDBACK_WHATSAPP;

  if (!number) return null;

  const text = t("feedbackPrefill", { path: pathname });
  const href = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[5.5rem] end-4 z-20 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md"
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {t("feedbackCta")}
    </a>
  );
}
