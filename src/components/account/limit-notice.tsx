"use client";

import { useTranslations } from "next-intl";
import { supportMailto } from "@/lib/contact";
import { feedbackWhatsAppUrl } from "@/lib/whatsapp";

/**
 * The 6th apartment: the database refused it (P0001 unit_limit_reached),
 * and this says why and offers the custom plan by contact — WhatsApp when a
 * number is set, otherwise the support email, so the contact is always there.
 */
export function LimitNotice() {
  const t = useTranslations("account.limit");
  const href = feedbackWhatsAppUrl(t("prefill")) ?? supportMailto(t("emailSubject"));
  const external = href.startsWith("https:");
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-card bg-amber-soft p-4" data-testid="limit-notice">
      <div className="flex flex-col gap-1">
        <p className="text-[0.9375rem] font-semibold text-ink">{t("title")}</p>
        <p className="text-[0.8125rem] leading-relaxed text-ink-2">{t("body")}</p>
      </div>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="tap flex h-12 items-center justify-center rounded-full bg-ink text-sm font-medium text-white"
        data-testid="limit-contact"
      >
        {t("contact")}
      </a>
    </div>
  );
}
