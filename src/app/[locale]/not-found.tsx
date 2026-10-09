import { Compass } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/empty-state";

/**
 * Localised 404 for every locale route (and unknown demo units).
 *
 * Server-only on purpose: this file is the [locale] segment's not-found
 * boundary, and Next.js ships its client code with every page under
 * [locale], the public pages included. It once rendered PageHeader → the
 * top line, which put the account and guest stores, the finance engine
 * and a dialog (~45–55 KB gzip) on /privacy and "/" although neither uses
 * them. So: a plain header, no top line, no language switch, and a plain
 * link home. scripts/check-public-bundle.mjs fails CI if that code comes
 * back.
 */
export default function NotFound() {
  const t = useTranslations("notFound");
  const home = useLocale() === "en" ? "/en/demo" : "/demo";

  return (
    <div className="min-h-dvh bg-page">
      <header className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-2">
        <h1 className="text-center text-base font-semibold">{t("title")}</h1>
      </header>
      <EmptyState
        icon={<Compass className="h-7 w-7" aria-hidden="true" />}
        title={t("heading")}
        body={t("body")}
        action={
          <a
            href={home}
            className="tap flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-white"
          >
            {t("backHome")}
          </a>
        }
      />
    </div>
  );
}
