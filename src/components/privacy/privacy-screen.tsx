import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { Link } from "@/i18n/navigation";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/contact";

const GOOGLE_CONNECTIONS = "https://myaccount.google.com/connections";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="flex flex-col gap-2 text-[0.9375rem] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

/**
 * The privacy page (/privacy, /en/privacy): what Backdesk keeps, where,
 * who processes it, and how to delete it. Outside /demo, so it carries no
 * sample-data banner and can be indexed (Google's consent screen links to
 * it). Update it before anything new is collected (BUILD_PLAN.md: before
 * PostHog or Resend ship).
 */
export function PrivacyScreen() {
  const t = useTranslations("privacy");
  const tCommon = useTranslations("common");
  const link = (href: string, external = false) =>
    function PrivacyLink(chunks: ReactNode) {
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-medium text-brand underline underline-offset-2">
          {chunks}
        </a>
      );
    };

  return (
    <div className="flex min-h-dvh justify-center bg-fill-strong">
      <div className="min-h-dvh w-full max-w-[30rem] bg-page">
        <header className="flex items-center gap-2 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
          <Link href="/demo/more" aria-label={t("back")} className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink">
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-ink-2">{tCommon("brandName")}</p>
          <LanguageSwitch tone="soft" />
        </header>
        <main className="flex flex-col gap-6 px-4 pt-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))]" data-testid="privacy">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-ink">{t("title")}</h1>
            <p className="text-xs text-muted">{t("updated")}</p>
          </div>
          <p className="text-[0.9375rem] leading-relaxed text-ink-2">{t("intro")}</p>
          <Section title={t("guest.title")}>
            <p>{t("guest.body")}</p>
          </Section>
          <Section title={t("account.title")}>
            <ul className="flex list-disc flex-col gap-2 ps-5">
              <li>{t("account.google")}</li>
              <li>{t("account.entered")}</li>
              <li>{t("account.auth")}</li>
            </ul>
            <p>{t("account.purpose")}</p>
          </Section>
          <Section title={t("requests.title")}>
            <p>{t("requests.body")}</p>
          </Section>
          <Section title={t("analytics.title")}>
            <p>{t("analytics.body")}</p>
          </Section>
          <Section title={t("cookies.title")}>
            <p>{t("cookies.body")}</p>
          </Section>
          <Section title={t("processors.title")}>
            <ul className="flex list-disc flex-col gap-2 ps-5">
              <li>{t("processors.supabase")}</li>
              <li>{t("processors.vercel")}</li>
              <li>{t("processors.google")}</li>
            </ul>
          </Section>
          <Section title={t("delete.title")}>
            <p>{t("delete.body")}</p>
            <p>{t("delete.logs")}</p>
            <p>{t.rich("delete.google", { link: link(GOOGLE_CONNECTIONS, true) })}</p>
          </Section>
          <Section title={t("contact.title")}>
            <p data-testid="privacy-contact">
              {t.rich("contact.body", { email: SUPPORT_EMAIL, mail: link(supportMailto()) })}
            </p>
          </Section>
          <Section title={t("changes.title")}>
            <p>{t("changes.body")}</p>
          </Section>
        </main>
      </div>
    </div>
  );
}
