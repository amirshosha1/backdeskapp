"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowDownRight, ArrowUpRight, Landmark } from "lucide-react";
import { DataWarning } from "@/components/common/data-warning";
import { useLocale, useTranslations } from "next-intl";
import { HeroFigure } from "@/components/common/hero-figure";
import { ListRow } from "@/components/common/list-row";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";
import { SectionHeader } from "@/components/common/section-header";
import { LogoMark, RoyalHero } from "@/components/layout/royal-hero";
import { BreakEvenProgress } from "./break-even-progress";
import { QuickActions } from "./quick-actions";
import { TopExpenses } from "./top-expenses";
import { UnitCarousel } from "./unit-carousel";
import { ViewSwitch, type HomeView } from "./view-switch";
import type { AppLocale } from "@/i18n/routing";
import type { HOME_COHOST_VIEW, HOME_OWNER_VIEW } from "@/demo/fixtures/home";
import type { Localized } from "@/demo/fixtures/types";

export interface HomeScreenProps {
  period: Localized;
  ownerView: typeof HOME_OWNER_VIEW;
  coHostView: typeof HOME_COHOST_VIEW;
}

const VIEW_PARAM = "view";
const noopSubscribe = () => () => {};

/**
 * Reads the owner/co-host mode from the URL, not component state, so the
 * language switch's full navigation (a different locale segment) doesn't
 * reset it back to owner. A plain reload of the bare "/demo" URL (no query)
 * still starts from "owner" — e.g. the tap-audit crawler's per-element
 * reload, which relies on every reload starting from the same state.
 */
function readViewFromUrl(): HomeView {
  try {
    return new URLSearchParams(window.location.search).get(VIEW_PARAM) === "cohost" ? "cohost" : "owner";
  } catch {
    return "owner";
  }
}

/**
 * Home (direction A2): the royal hero answers "كم ربحت فعلاً هذا الشهر؟",
 * the units swipe as glass cards at its bottom, quick actions sit under it,
 * then the one insight that explains the number. The owner/co-host switch
 * is a prototype affordance; the product shows one view per org mix.
 */
export function HomeScreen({ period, ownerView, coHostView }: HomeScreenProps) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  // The server (and the pre-hydration client) always render "owner"; once
  // hydrated, this switches synchronously to whatever the URL says.
  const urlView = useSyncExternalStore(noopSubscribe, readViewFromUrl, () => "owner" as HomeView);
  const [manualView, setManualView] = useState<HomeView | null>(null);
  const view = manualView ?? urlView;

  function setView(next: HomeView) {
    setManualView(next);
    try {
      const url = new URL(window.location.href);
      if (next === "owner") url.searchParams.delete(VIEW_PARAM);
      else url.searchParams.set(VIEW_PARAM, next);
      // A query-string tweak, not a route change: history.replaceState keeps
      // this off the Next.js router (no re-render of server data, no entry
      // in back/forward for every toggle) while still being what the
      // language switch's real navigation carries over.
      window.history.replaceState(null, "", url);
    } catch {
      // Private browsing or a restricted context: the mode just won't persist.
    }
  }

  const data = view === "owner" ? ownerView : coHostView;

  return (
    <div>
      <RoyalHero
        leading={<LogoMark label={tCommon("brandName")} />}
        center={
          <ViewSwitch
            value={view}
            onChange={setView}
            label={t("viewSwitchLabel")}
            options={[
              { value: "owner", label: t("viewOwner") },
              { value: "cohost", label: t("viewCoHost") },
            ]}
          />
        }
      >
        <p className="mt-8 text-center text-xs text-white/55">{period[locale]}</p>
        <h1 className="mt-1 text-center text-[0.9375rem] font-normal text-white/80">{t("heroQuestion")}</h1>
        <HeroFigure amount={data.heroTotal} className="mt-3" />
        {/* Computed by the engine from last month's sample data; null (hidden)
            when last month was zero or a loss, where a percentage misleads. */}
        {data.change !== null && (
          <div className="mt-4 flex justify-center">
            <span
              className="glass inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.8125rem]"
              data-testid="change-chip"
            >
              {data.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              )}
              <Percent ratio={data.change} signDisplay="always" capAt100={false} className="font-semibold" />
              {t("changeVsLastMonth")}
            </span>
          </div>
        )}

        <dl className="mt-6 grid grid-cols-3 gap-2">
          {[
            { label: t("kpiOccupancy"), value: <Percent ratio={data.occupancy} decimals={0} /> },
            { label: t("kpiAdr"), value: <Money amount={data.adr} decimals={0} hideCurrency /> },
            { label: t("kpiRevpar"), value: <Money amount={data.revpar} decimals={0} hideCurrency /> },
          ].map((tile) => (
            <div key={tile.label} className="glass flex flex-col justify-between rounded-tile px-3 py-3.5">
              <dt className="line-clamp-2 text-[0.6875rem] leading-snug text-white/70">{tile.label}</dt>
              <dd className="mt-1.5 text-xl font-semibold">{tile.value}</dd>
            </div>
          ))}
        </dl>

        <UnitCarousel units={data.units} label={t("unitsCarouselLabel")} />
      </RoyalHero>

      <div className="flex flex-col gap-8 px-4 pt-6">
        {data.availabilityConflict && <DataWarning message={tCommon("dataWarningOccupancy")} />}
        <QuickActions view={view} />

        {view === "owner" ? (
          <>
            <BreakEvenProgress
              unitName={ownerView.breakEven.unitName}
              bookedNights={ownerView.breakEven.bookedNights}
              targetNights={ownerView.breakEven.targetNights}
              nightsShort={ownerView.breakEven.nightsShort}
              progress={ownerView.breakEven.progress}
              reached={ownerView.breakEven.reached}
              basis={ownerView.breakEven.basis}
            />
            <TopExpenses items={ownerView.topExpenses} />
          </>
        ) : (
          <section>
            <SectionHeader title={t("overheadTitle")} />
            <ListRow
              icon={<Landmark className="h-5 w-5" aria-hidden="true" />}
              title={t("overheadLabel")}
              subtitle={t("overheadNote")}
              trailing={<Money amount={coHostView.overhead} className="text-[0.9375rem] font-semibold" colorBySign />}
            />
          </section>
        )}
      </div>
    </div>
  );
}
