import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PreorderButton } from "./preorder-button";
import type { AppLocale } from "@/i18n/routing";
import type { FOUNDING_OFFER } from "@/demo/fixtures/pricing";

export function FoundingOffer({ offer }: { offer: typeof FOUNDING_OFFER }) {
  const locale = useLocale() as AppLocale;

  return (
    <Card className="border-primary bg-primary/5">
      <CardHeader>
        <CardTitle>{offer.title[locale]}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">{offer.description[locale]}</p>
        <PreorderButton />
      </CardContent>
    </Card>
  );
}
