"use client";

import Decimal from "decimal.js";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { UnitGlyph } from "@/components/common/icons";
import { HeroFigure } from "@/components/common/hero-figure";
import { Money } from "@/components/common/money";
import { SectionHeader } from "@/components/common/section-header";
import { LogoMark, RoyalHero } from "@/components/layout/royal-hero";
import { apartmentNet, apartmentsTotal, useMyApartments, type MyApartment } from "@/components/units/my-apartments";
import { Link } from "@/i18n/navigation";
import { toMoneyString } from "@/lib/finance";
import { cn } from "@/lib/utils";

/**
 * Home shows only the person's own apartments (hotfix, 2026-10-09): their
 * total monthly net in whole pounds, then each apartment with its net and
 * whether it makes a profit. No sample data. With no apartment yet, one
 * call to action into the first-run flow. Every figure is the engine's,
 * the same as on the apartment's Units card.
 */
export function HomeScreen() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const apartments = useMyApartments();

  const rows = (apartments ?? []).map((a) => ({ ...a, net: a.inputs ? apartmentNet(a.inputs.form) : null }));
  const counted = rows.flatMap((r) => (r.net ? [{ operatingModel: r.operatingModel, net: r.net }] : []));
  const total = apartmentsTotal(counted);

  return (
    <div>
      <RoyalHero leading={<LogoMark label={tCommon("brandName")} />}>
        {apartments === null ? (
          <div className="mt-8 h-[7.5rem]" aria-hidden="true" />
        ) : rows.length === 0 ? (
          <div className="mt-8 flex min-h-[7.5rem] flex-col items-center justify-center gap-2 text-center">
            <h1 className="text-2xl font-semibold">{t("emptyTitle")}</h1>
            <p className="text-[0.8125rem] leading-relaxed text-white/80">{t("emptyBody")}</p>
          </div>
        ) : (
          <div className="mt-8 flex min-h-[7.5rem] flex-col items-center">
            <h1 className="text-center text-[0.9375rem] font-normal text-white/80">{t("totalTitle")}</h1>
            <HeroFigure amount={toMoneyString(total ?? 0)} decimals={0} className="mt-3" />
            <p className="mt-3 text-center text-xs text-white/65">{t("totalNote")}</p>
          </div>
        )}
      </RoyalHero>

      <div className="flex flex-col gap-3 px-4 pt-6">
        {apartments === null ? (
          <div className="h-[10rem]" aria-hidden="true" />
        ) : rows.length === 0 ? (
          <Link
            href="/demo/start"
            className="tap flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white"
            data-testid="home-start"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("emptyCta")}
          </Link>
        ) : (
          <section data-testid="home-apartments">
            <SectionHeader title={t("listTitle")} action={{ label: t("listAll"), href: "/demo/units" }} />
            <ul className="mt-2 flex flex-col gap-2">
              {rows.map((row) => (
                <li key={row.key}>
                  <ApartmentRow apartment={row} net={row.net} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function ApartmentRow({ apartment, net }: { apartment: MyApartment; net: ReturnType<typeof apartmentNet> }) {
  const t = useTranslations("home");
  const tUnits = useTranslations("units");
  const tModel = useTranslations("units.operatingModel");
  const name = apartment.name ?? tUnits("ownTitle");
  const shown = net === null ? null : toMoneyString(net);
  // The status follows the figure as shown, in whole pounds.
  const loss = net !== null && net.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).lessThan(0);

  return (
    <Link href={apartment.href} className="tap flex items-center gap-3 rounded-card bg-fill px-4 py-3" data-testid="home-apartment">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-page text-ink-2">
        <UnitGlyph model={apartment.operatingModel} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[0.9375rem] font-semibold">{name}</span>
        <span className="truncate text-xs text-muted">{tModel(apartment.operatingModel)}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {shown === null ? (
          <span className="text-xs text-muted">{t("unreadable")}</span>
        ) : (
          <>
            <Money amount={shown} decimals={0} colorBySign signDisplay="always" className="text-[0.9375rem] font-semibold" />
            <span
              className={cn("rounded-full px-2 py-0.5 text-[0.6875rem] font-medium", loss ? "bg-loss-soft text-loss" : "bg-profit-soft text-profit")}
              data-testid="home-apartment-status"
            >
              {t("status", { outcome: loss ? "loss" : "profit" })}
            </span>
          </>
        )}
      </span>
    </Link>
  );
}
