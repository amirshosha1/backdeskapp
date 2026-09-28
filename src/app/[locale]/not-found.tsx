import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";

/** Localised 404 for every locale route (and unknown demo units). */
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="min-h-dvh bg-page">
      <PageHeader title={t("title")} />
      <EmptyState
        icon={<Compass className="h-7 w-7" aria-hidden="true" />}
        title={t("heading")}
        body={t("body")}
        action={
          <Link
            href="/demo"
            className="tap flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-white"
          >
            {t("backHome")}
          </Link>
        }
      />
    </div>
  );
}
