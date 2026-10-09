"use client";

import { useTranslations } from "next-intl";
import { MailLink } from "@/components/common/mail-link";
import { supportMailto } from "@/lib/contact";

/**
 * The 6th apartment: the database refused it (P0001 unit_limit_reached),
 * and this says why and offers the custom plan by contact — by email to
 * the support address, so the contact is always there.
 */
export function LimitNotice() {
  const t = useTranslations("account.limit");
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-card bg-amber-soft p-4" data-testid="limit-notice">
      <div className="flex flex-col gap-1">
        <p className="text-[0.9375rem] font-semibold text-ink">{t("title")}</p>
        <p className="text-[0.8125rem] leading-relaxed text-ink-2">{t("body")}</p>
      </div>
      <MailLink
        href={supportMailto(t("emailSubject"), t("prefill"))}
        className="tap flex h-12 items-center justify-center rounded-full bg-ink text-sm font-medium text-white"
        testId="limit-contact"
      >
        {t("contact")}
      </MailLink>
    </div>
  );
}
