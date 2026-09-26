import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * BUILD_PLAN.md §6, question 2: destination supplied by Amir via
 * `NEXT_PUBLIC_PREORDER_URL`. Until it is set, the button is a clearly
 * marked, disabled placeholder rather than a dead or misleading link.
 */
export function PreorderButton() {
  const t = useTranslations("pricing");
  const url = process.env.NEXT_PUBLIC_PREORDER_URL;

  if (!url) {
    return (
      <div className="flex flex-col gap-1">
        <Button size="lg" disabled className="w-full">
          {t("preorderCta")}
        </Button>
        <p className="text-center text-xs text-foreground-subtle">
          {t("preorderPlaceholderNote")}
        </p>
      </div>
    );
  }

  return (
    <Button asChild size="lg" className="w-full">
      <a href={url} target="_blank" rel="noopener noreferrer">
        {t("preorderCta")}
      </a>
    </Button>
  );
}
