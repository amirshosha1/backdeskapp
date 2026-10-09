import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { MailLink } from "@/components/common/mail-link";
import { Money } from "@/components/common/money";
import type { ApartmentTotal } from "@/lib/pricing/apartment-price";
import { supportMailto } from "@/lib/contact";

/**
 * Pro's monthly totals for 2 to `maxApartments` apartments (computed from
 * the one plan price), then custom plans above that. The contact action
 * is an email to the support address.
 */
export function ApartmentTotals({ totals, maxApartments }: { totals: ApartmentTotal[]; maxApartments: number }) {
  const t = useTranslations("pricing");
  const contactUrl = supportMailto(t("customPlans", { count: maxApartments }), t("customPlansPrefill", { count: maxApartments }));

  return (
    <section className="mt-4 rounded-tile bg-fill px-4 pt-3 pb-1" data-testid="apartment-totals">
      <h3 className="text-xs font-medium text-muted">{t("totalsTitle")}</h3>
      <dl className="mt-1 divide-y divide-line text-sm">
        {totals.map(({ apartments, total }) => (
          <div key={apartments} className="flex items-center justify-between gap-3 py-2.5">
            <dt>{t("apartmentCount", { count: apartments })}</dt>
            <dd>
              <Money amount={total} decimals={0} className="font-semibold" />
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex min-h-14 items-center justify-between gap-3 border-t border-line py-2 text-sm">
        <p className="min-w-0">{t("customPlans", { count: maxApartments })}</p>
        <MailLink
          href={contactUrl}
          testId="custom-plans-contact"
          className="tap flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-page px-4 text-sm font-medium text-brand"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {t("contactUs")}
        </MailLink>
      </div>
    </section>
  );
}
