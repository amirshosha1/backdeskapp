import { useTranslations } from "next-intl";

/** Shown on every `/demo` screen (BUILD_PLAN.md Phase P acceptance). */
export function DemoBanner() {
  const t = useTranslations("common");

  return (
    <div className="bg-sample-foreground px-4 py-1.5 text-center text-xs font-medium text-sample">
      {t("sampleDataBanner")}
    </div>
  );
}
