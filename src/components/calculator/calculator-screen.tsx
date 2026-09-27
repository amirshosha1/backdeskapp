import type { ReactNode } from "react";
import { Info, Pencil, TrendingDown, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { HeroFigure } from "@/components/common/hero-figure";
import { LockedTeaser } from "@/components/common/locked-teaser";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";
import { SampleBadge } from "@/components/common/sample-badge";
import { ToastButton } from "@/components/common/toast";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { formatNumber } from "@/lib/format/money";
import { formatPercent } from "@/lib/format/percent";
import type { AppLocale } from "@/i18n/routing";
import type { CALCULATOR_RESULTS, WalkthroughRow, WalkthroughStep } from "@/demo/fixtures/calculator";
import { cn } from "@/lib/utils";

export interface CalculatorScreenProps {
  steps: WalkthroughStep[];
  results: typeof CALCULATOR_RESULTS;
}

const DECORATIVE_BAR_HEIGHTS = [40, 65, 50, 80, 55, 70, 45, 60, 75, 50, 65, 55];

/**
 * Read-only walkthrough of one sample scenario (BUILD_PLAN.md Phase P) —
 * Example B from §4.6. The result leads in the hero; the four input steps
 * follow; the result card is step 5. Every input row explains, on tap,
 * that editing arrives with the live calculator (Phase 1).
 */
export function CalculatorScreen({ steps, results }: CalculatorScreenProps) {
  const t = useTranslations("calculator");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  const locale = useLocale() as AppLocale;
  const total = steps.length + 1;
  const verdictArgs = {
    occupancy: formatPercent(results.occupancy, { locale, decimals: 0, isolate: true }),
    breakEven: formatPercent(results.breakEvenOccupancy, { locale, decimals: 1, isolate: true }),
  };
  const VerdictIcon = results.isProfitable ? TrendingUp : TrendingDown;

  return (
    <div>
      <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>}>
        <p className="mt-8 text-center text-[0.9375rem] text-white/80">{t("heroLabel")}</p>
        <HeroFigure amount={results.noi} className="mt-3" />
        <div className="mt-4 flex justify-center px-2">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-center text-[0.8125rem] leading-snug">
            <VerdictIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {results.isProfitable ? t("verdictProfitable", verdictArgs) : t("verdictNotProfitable", verdictArgs)}
          </span>
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-2">
          <HeroTile label={t("tileBreakEvenOccupancy")} value={<Percent ratio={results.breakEvenOccupancy} />} />
          <HeroTile
            label={t("tileBreakEvenNights")}
            value={<bdi dir="ltr">{formatNumber(results.breakEvenNights, { locale })}</bdi>}
          />
          <HeroTile label={t("tileAdr")} value={<Money amount={results.adr} decimals={0} hideCurrency />} />
        </dl>
      </RoyalHero>

      <div className="flex flex-col gap-4 px-4 pt-6">
        <p className="flex items-start gap-2 rounded-card bg-brand-soft p-4 text-sm leading-relaxed text-brand">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t("readOnlyNote")}
        </p>

        {steps.map((step, i) => (
          <section key={step.id} className="rounded-card bg-fill p-4">
            <p className="text-xs text-muted">{t("stepLabel", { step: i + 1, total })}</p>
            <h2 className="mt-0.5 text-base font-semibold">{step.title[locale]}</h2>
            <div className="mt-2 divide-y divide-line">
              {step.rows.map((row) => (
                <ToastButton
                  key={row.label.en}
                  message={tToast("editAssumption")}
                  className="flex w-full items-center gap-2 py-3 text-start text-sm"
                >
                  <span className="min-w-0 flex-1 text-ink-2">{row.label[locale]}</span>
                  {row.isSample && <SampleBadge />}
                  <span className="font-semibold">
                    <RowValue row={row} locale={locale} />
                  </span>
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                </ToastButton>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-card bg-fill p-4">
          <p className="text-xs text-muted">{t("stepLabel", { step: total, total })}</p>
          <h2 className="mt-0.5 text-base font-semibold">{t("resultsTitle")}</h2>
          <dl className="mt-2 divide-y divide-line text-sm">
            <ResultRow label={t("grossRevenueLabel")} value={<Money amount={results.grossRevenue} />} />
            <ResultRow label={t("platformFeesLabel")} value={<Money amount={results.platformFees} />} />
            <ResultRow label={t("netPayoutLabel")} value={<Money amount={results.netPayout} />} />
            <ResultRow label={t("opexLabel")} value={<Money amount={results.opex} />} />
            <ResultRow label={t("rentLabel")} value={<Money amount={results.rent} />} />
            <ResultRow
              strong
              label={t("noiLabel")}
              value={<Money amount={results.noi} colorBySign signDisplay="always" />}
            />
            <ResultRow
              label={t("contributionPerNightLabel")}
              value={<Money amount={results.contributionPerNight} />}
            />
          </dl>
          <p className="mt-3 text-xs text-muted">{t("depreciationExcludedNote")}</p>
        </section>

        <LockedTeaser title={t("projectionTeaserTitle")} body={tCommon("lockedTeaserBody")}>
          <div className="flex h-40 items-end gap-1.5 p-5">
            {DECORATIVE_BAR_HEIGHTS.map((height, index) => (
              <div key={index} className="flex-1 rounded-t-md bg-royal-500" style={{ height: `${height}%` }} />
            ))}
          </div>
        </LockedTeaser>
      </div>
    </div>
  );
}

function HeroTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="glass flex flex-col justify-between rounded-tile px-3 py-3.5">
      <dt className="line-clamp-2 text-[0.6875rem] leading-snug text-white/70">{label}</dt>
      <dd className="mt-1.5 text-xl font-semibold">{value}</dd>
    </div>
  );
}

function ResultRow({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-2 py-3", strong && "font-semibold")}>
      <dt className={strong ? "text-ink" : "text-ink-2"}>{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function RowValue({ row, locale }: { row: WalkthroughRow; locale: AppLocale }) {
  if (row.kind === "money") return <Money amount={row.amount} />;
  if (row.kind === "percent") return <Percent ratio={row.ratio} />;
  return <bdi>{row.value[locale]}</bdi>;
}
