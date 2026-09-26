import { ChevronRight, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export function MoreScreen() {
  const tNav = useTranslations("nav");
  const tPricing = useTranslations("pricing");

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      <h1 className="text-xl font-semibold">{tNav("more")}</h1>
      <Link href="/demo/pricing">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Tag className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="flex-1 font-medium">{tPricing("title")}</span>
            <ChevronRight className="h-5 w-5 text-foreground-muted rtl:rotate-180" aria-hidden="true" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
