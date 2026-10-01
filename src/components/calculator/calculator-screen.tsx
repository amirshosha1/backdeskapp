"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DataWarning } from "@/components/common/data-warning";
import { HeroFigure } from "@/components/common/hero-figure";
import { LockedTeaser } from "@/components/common/locked-teaser";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";
import { SampleBadge } from "@/components/common/sample-badge";
import { ToastButton } from "@/components/common/toast";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { ChoiceGroup, NumberFieldRow, SelectRow, SwitchRow } from "./calculator-fields";
import {
  commissionUsesCleaningToggle,
  commissionUsesFixedFee,
  commissionUsesRate,
  parseCalculatorForm,
  sameForm,
  type CalculatorForm,
  type FieldError,
  type ManagedBasis,
  type NumberField,
} from "@/lib/calculator/form";
import {
  computeScenario,
  displayOccupancy,
  toMoneyString,
  type BreakEvenResult,
  type OperatingModel,
  type PercentBasis,
  type ScenarioInput,
  type Verdict,
} from "@/lib/finance";
import { currencyLabel, formatNumber } from "@/lib/format/money";
import { formatPercent } from "@/lib/format/percent";
import type { AppLocale } from "@/i18n/routing";
import type { CalculatorPreset } from "@/demo/sample-data/calculator-presets";
import { cn } from "@/lib/utils";

export interface CalculatorScreenProps {
  presets: CalculatorPreset[];
}

const DECORATIVE_BAR_HEIGHTS = [40, 65, 50, 80, 55, 70, 45, 60, 75, 50, 65, 55];
const MODELS: OperatingModel[] = ["owner_operated", "rental_arbitrage", "managed_for_owner"];
const MANAGED_BASES: ManagedBasis[] = ["net_payout", "gross_revenue", "noi", "fixed_monthly", "hybrid"];
const PERCENT_BASES: PercentBasis[] = ["gross_revenue", "net_payout", "noi"];
const TOTAL_STEPS = 5;

function initialInput(form: CalculatorForm): ScenarioInput {
  const parsed = parseCalculatorForm(form);
  if (!parsed.ok) throw new Error("A calculator preset does not parse");
  return parsed.input;
}

/**
 * The live feasibility calculator (BUILD_PLAN.md Phase 1): every input is
 * editable and every figure is recomputed in the browser by the finance
 * engine (`computeScenario`) as the host types — nothing is sent anywhere.
 * While a field is invalid the results keep the last valid entry, dimmed,
 * with a notice; they never show a half-parsed number.
 *
 * Cost bases are stated on screen: the headline profit, its break-even and
 * the verdict are before depreciation (repairs included); net profit after
 * depreciation carries its own break-even.
 */
export function CalculatorScreen({ presets }: CalculatorScreenProps) {
  const t = useTranslations("calculator");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  const tModel = useTranslations("units.operatingModel");
  const locale = useLocale() as AppLocale;

  const first = presets[0]!;
  const [form, setForm] = useState<CalculatorForm>(first.form);
  const [lastValid, setLastValid] = useState<ScenarioInput>(() => initialInput(first.form));
  const [unitPresetId, setUnitPresetId] = useState(first.id);

  const parsed = useMemo(() => parseCalculatorForm(form), [form]);
  const result = useMemo(() => computeScenario(lastValid), [lastValid]);
  const errors: Partial<Record<NumberField, FieldError>> = parsed.ok ? {} : parsed.errors;
  const stale = !parsed.ok;

  const activePreset = presets.find((p) => sameForm(p.form, form)) ?? null;
  const unitPreset = presets.find((p) => p.id === unitPresetId) ?? first;

  function update(next: CalculatorForm) {
    setForm(next);
    const p = parseCalculatorForm(next);
    if (p.ok) setLastValid(p.input);
  }
  const setValue = (field: NumberField) => (value: string) => update({ ...form, values: { ...form.values, [field]: value } });
  const setCommission = (patch: Partial<CalculatorForm["commission"]>) =>
    update({ ...form, commission: { ...form.commission, ...patch } });

  function choosePreset(id: string) {
    const preset = presets.find((p) => p.id === id)!;
    setUnitPresetId(preset.id);
    update(preset.form);
  }

  const money = (field: NumberField, extra?: { hint?: ReactNode; label?: string }) => (
    <NumberFieldRow
      key={field}
      id={`calc-${field}`}
      label={extra?.label ?? t(`fields.${field}`)}
      value={form.values[field]}
      onChange={setValue(field)}
      left={currencyLabel("EGP", locale)}
      hint={extra?.hint}
      error={errors[field] && t(`errors.${errors[field]}`)}
      sample={isSample(field)}
    />
  );
  const percent = (field: NumberField) => (
    <NumberFieldRow
      key={field}
      id={`calc-${field}`}
      label={t(`fields.${field}`)}
      value={form.values[field]}
      onChange={setValue(field)}
      right="%"
      error={errors[field] && t(`errors.${errors[field]}`)}
      sample={isSample(field)}
    />
  );
  const count = (field: NumberField, unit: "nights" | "months", hint?: ReactNode) => (
    <NumberFieldRow
      key={field}
      id={`calc-${field}`}
      label={t(`fields.${field}`)}
      value={form.values[field]}
      onChange={setValue(field)}
      {...(locale === "ar" ? { left: t(`units.${unit}`) } : { right: t(`units.${unit}`) })}
      hint={hint}
      error={errors[field] && t(`errors.${errors[field]}`)}
      sample={isSample(field)}
    />
  );
  /** SAMPLE until the host types their own number (CLAUDE.md §2). */
  function isSample(field: NumberField) {
    return unitPreset.sampleFields.includes(field) && form.values[field] === unitPreset.form.values[field];
  }

  const occupancy = displayOccupancy(result.kpis.occupancy);
  const primary = result.breakEven.primary;
  const pct = (ratio: { toNumber(): number }, decimals = 1) =>
    formatPercent(ratio.toNumber(), { locale, decimals, isolate: true });
  const nights = (be: Extract<BreakEvenResult, { kind: "reached" }>) => formatNumber(be.nights, { locale });
  const VerdictIcon = result.verdict.kind === "profitable" || result.verdict.kind === "at_break_even" ? TrendingUp : TrendingDown;
  const isArbitrage = form.operatingModel === "rental_arbitrage";
  const isManaged = form.operatingModel === "managed_for_owner";

  return (
    <div>
      <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>}>
        <div className={cn("transition-opacity", stale && "opacity-50")} aria-live="polite">
          <p className="mt-8 text-center text-[0.9375rem] text-white/80">{t("heroLabel")}</p>
          <HeroFigure amount={toMoneyString(result.profitBeforeDepreciation)} className="mt-3" />
          <div className="mt-4 flex justify-center px-2">
            <span
              className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-center text-[0.8125rem] leading-snug"
              data-testid="verdict"
            >
              <VerdictIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {verdictText(result.verdict, t, locale)}
            </span>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-2">
            <HeroTile
              label={t("tileBreakEvenOccupancy")}
              testId="break-even-occupancy"
              value={primary.kind === "reached" ? <Percent ratio={primary.occupancy.toNumber()} /> : t("tileUnavailable")}
            />
            <HeroTile
              label={t("tileBreakEvenNights")}
              testId="break-even-nights"
              value={primary.kind === "reached" ? <bdi dir="ltr">{nights(primary)}</bdi> : t("tileUnavailable")}
            />
            <HeroTile
              label={t("tileAdr")}
              value={<Money amount={toMoneyString(result.kpis.adr ?? 0)} decimals={0} hideCurrency />}
            />
          </dl>
          <p className="mt-3 text-center text-xs text-white/55" data-testid="break-even-excluding-maintenance">
            {result.breakEven.excludingIrregular.kind === "reached"
              ? t("breakEvenExcludingMaintenance", {
                  nights: nights(result.breakEven.excludingIrregular),
                  occupancy: pct(result.breakEven.excludingIrregular.occupancy),
                })
              : t("breakEvenExcludingMaintenanceUnreachable")}
          </p>
        </div>
      </RoyalHero>

      <div className="flex flex-col gap-4 px-4 pt-6">
        <p className="flex items-start gap-2 rounded-card bg-brand-soft p-4 text-sm leading-relaxed text-brand">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t("introNote")}
        </p>

        <ChoiceGroup
          onPage
          label={t("presetsLabel")}
          value={activePreset?.id ?? null}
          options={presets.map((p) => ({ value: p.id, label: t(`presets.${p.id}`) }))}
          onChange={choosePreset}
        />

        {stale && (
          <p role="status" className="rounded-card bg-loss-soft p-4 text-sm leading-relaxed text-loss" data-testid="stale-notice">
            {t("invalidNotice")}
          </p>
        )}
        {result.kpis.warnings.length > 0 && <DataWarning message={tCommon("dataWarningOccupancy")} />}

        <Step index={1} title={t("steps.unit")}>
          {(["city", "area", "bedrooms", "bathrooms", "maxGuests"] as const).map((key) => {
            const raw = unitPreset.unit[key];
            return (
              <ToastButton
                key={key}
                message={tToast("unitDetails")}
                className="flex w-full items-center gap-2 py-3 text-start text-sm"
              >
                <span className="min-w-0 flex-1 text-ink-2">{t(`unitDetails.${key}`)}</span>
                <SampleBadge />
                <span className="font-semibold">
                  <bdi>{typeof raw === "string" ? raw : raw[locale]}</bdi>
                </span>
              </ToastButton>
            );
          })}
        </Step>

        <Step index={2} title={t("steps.model")}>
          <div className="py-3">
            <ChoiceGroup
              label={t("operatingModelLabel")}
              value={form.operatingModel}
              options={MODELS.map((m) => ({ value: m, label: tModel(m) }))}
              onChange={(operatingModel) => update({ ...form, operatingModel })}
            />
          </div>
          {isArbitrage && [money("rent"), money("deposit")]}
          {isManaged && (
            <>
              <SelectRow
                id="calc-commission-basis"
                label={t("commissionBasisLabel")}
                value={form.commission.basis}
                options={MANAGED_BASES.map((b) => ({ value: b, label: t(`commissionBasis.${b}`) }))}
                onChange={(basis) => setCommission({ basis })}
              />
              {form.commission.basis === "hybrid" && (
                <>
                  <SelectRow
                    id="calc-hybrid-mode"
                    label={t("hybridModeLabel")}
                    value={form.commission.hybridMode}
                    options={(["max", "sum"] as const).map((m) => ({ value: m, label: t(`hybridMode.${m}`) }))}
                    onChange={(hybridMode) => setCommission({ hybridMode })}
                  />
                  <SelectRow
                    id="calc-hybrid-basis"
                    label={t("hybridBasisLabel")}
                    value={form.commission.hybridBasis}
                    options={PERCENT_BASES.map((b) => ({ value: b, label: t(`hybridBasis.${b}`) }))}
                    onChange={(hybridBasis) => setCommission({ hybridBasis })}
                  />
                </>
              )}
              {commissionUsesRate(form.commission.basis) && percent("commissionPercent")}
              {commissionUsesFixedFee(form.commission.basis) &&
                money("fixedFee", {
                  label: t("fields.fixedFee", {
                    mode: form.commission.basis === "hybrid" ? form.commission.hybridMode : "fixed",
                  }),
                })}
              {commissionUsesCleaningToggle(form.commission) && (
                <SwitchRow
                  label={t("includeCleaningFeesLabel")}
                  checked={form.commission.includeCleaningFees}
                  onChange={(includeCleaningFees) => setCommission({ includeCleaningFees })}
                />
              )}
            </>
          )}
        </Step>

        <Step index={3} title={t("steps.revenue")}>
          {money("adr")}
          {count(
            "bookedNights",
            "nights",
            // Only for a valid entry: under an invalid field, the last valid occupancy would mislead.
            !stale &&
              occupancy &&
              t("occupancyHint", {
                occupancy: pct(occupancy),
                available: formatNumber(result.nightsAvailable, { locale, decimals: 0 }),
              }),
          )}
          {count("blockedNights", "nights", t("blockedHint"))}
          {count("avgLengthOfStay", "nights")}
          {money("cleaningFeePerStay")}
          {percent("platformFeePercent")}
        </Step>

        <Step index={4} title={t("steps.costs")}>
          {money("utilities")}
          {money("internet")}
          {money("compoundFees")}
          {money("cleaningCost")}
          {money("consumables")}
          {money("repairs")}
          {money("setupCost")}
          {count("usefulLifeMonths", "months")}
        </Step>

        <section className={cn("rounded-card bg-fill p-4 transition-opacity", stale && "opacity-50")} data-testid="results">
          <p className="text-xs text-muted">{t("stepLabel", { step: TOTAL_STEPS, total: TOTAL_STEPS })}</p>
          <h2 className="mt-0.5 text-base font-semibold">{t("resultsTitle")}</h2>
          <dl className="mt-2 divide-y divide-line text-sm">
            <ResultRow label={t("grossRevenueLabel")} value={<Money amount={toMoneyString(result.pnl.grossRevenue)} />} />
            <ResultRow label={t("platformFeesLabel")} value={<Money amount={toMoneyString(result.pnl.platformFees.negated())} />} />
            <ResultRow label={t("netPayoutLabel")} value={<Money amount={toMoneyString(result.pnl.netPayout)} />} />
            <ResultRow label={t("opexLabel")} value={<Money amount={toMoneyString(result.opexExcludingRent.negated())} />} />
            {isArbitrage && <ResultRow label={t("rentLabel")} value={<Money amount={toMoneyString(result.rent.negated())} />} />}
            <ResultRow label={t("noiLabel")} value={<Money amount={toMoneyString(result.pnl.noi)} colorBySign signDisplay="always" />} />
            {isManaged && (
              <ResultRow label={t("commissionLabel")} value={<Money amount={toMoneyString(result.pnl.commission.negated())} />} />
            )}
            <ResultRow
              strong
              testId="result-profit-before-depreciation"
              label={t("profitBeforeDepreciationLabel")}
              value={<Money amount={toMoneyString(result.profitBeforeDepreciation)} colorBySign signDisplay="always" />}
            />
            <ResultRow label={t("depreciationLabel")} value={<Money amount={toMoneyString(result.depreciation.negated())} />} />
            <ResultRow
              strong
              testId="result-net-profit"
              label={t("netProfitLabel")}
              value={<Money amount={toMoneyString(result.netProfit)} colorBySign signDisplay="always" />}
            />
          </dl>
          <p className="mt-1 text-xs text-muted" data-testid="break-even-with-depreciation">
            {result.breakEven.includingDepreciation.kind === "reached"
              ? t("breakEvenWithDepreciation", {
                  nights: nights(result.breakEven.includingDepreciation),
                  occupancy: pct(result.breakEven.includingDepreciation.occupancy),
                })
              : t("breakEvenWithDepreciationUnreachable")}
          </p>
          <dl className="mt-3 divide-y divide-line border-t border-line text-sm">
            <ResultRow label={t("contributionPerNightLabel")} value={<Money amount={toMoneyString(result.contributionPerNight)} />} />
            <ResultRow label={t("investedLabel")} value={<Money amount={toMoneyString(result.investment.totalCashInvested)} />} />
            <ResultRow
              label={t("paybackLabel")}
              testId="result-payback"
              value={
                result.investment.paybackMonths
                  ? t("paybackValue", { months: formatNumber(result.investment.paybackMonths, { locale, decimals: 1 }) })
                  : result.investment.totalCashInvested.isZero()
                    ? t("paybackNoInvestment")
                    : t("paybackNever")
              }
            />
            {result.investment.cashOnCash && (
              <ResultRow
                label={t("cashOnCashLabel")}
                value={<Percent ratio={result.investment.cashOnCash.toNumber()} capAt100={false} signDisplay="always" />}
              />
            )}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-muted">{t("basisNote")}</p>
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

type Translator = ReturnType<typeof useTranslations<"calculator">>;

/** The verdict's words; the rule itself lives in the engine (verdict.ts). */
function verdictText(verdict: Verdict, t: Translator, locale: AppLocale): string {
  // Occupancy to the whole point, break-even to one decimal (64.6%), as before Phase 1.
  const occupancy = (ratio: { toNumber(): number } | null) =>
    formatPercent(ratio?.toNumber() ?? 0, { locale, decimals: 0, isolate: true });
  const breakEven = (ratio: { toNumber(): number }) => formatPercent(ratio.toNumber(), { locale, decimals: 1, isolate: true });
  switch (verdict.kind) {
    case "profitable":
      return verdict.breakEvenOccupancy
        ? t("verdictProfitable", { occupancy: occupancy(verdict.occupancy), breakEven: breakEven(verdict.breakEvenOccupancy) })
        : t("verdictProfitableNoBreakEven", { occupancy: occupancy(verdict.occupancy) });
    case "loss":
      return t("verdictNotProfitable", { occupancy: occupancy(verdict.occupancy), breakEven: breakEven(verdict.breakEvenOccupancy) });
    case "at_break_even":
      return t("verdictAtBreakEven", { occupancy: occupancy(verdict.occupancy) });
    case "unreachable":
      return verdict.reason === "never_profitable" ? t("verdictNeverProfitable") : t("verdictExceedsAvailable");
    case "no_available_nights":
      return t("verdictNoNights");
  }
}

function Step({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  const t = useTranslations("calculator");
  return (
    <section className="rounded-card bg-fill p-4">
      <p className="text-xs text-muted">{t("stepLabel", { step: index, total: TOTAL_STEPS })}</p>
      <h2 className="mt-0.5 text-base font-semibold">{title}</h2>
      <div className="mt-2 divide-y divide-line">{children}</div>
    </section>
  );
}

function HeroTile({ label, value, testId }: { label: string; value: ReactNode; testId?: string }) {
  return (
    <div className="glass flex flex-col justify-between rounded-tile px-3 py-3.5">
      <dt className="line-clamp-2 text-[0.6875rem] leading-snug text-white/70">{label}</dt>
      <dd className="mt-1.5 text-xl font-semibold" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}

function ResultRow({ label, value, strong, testId }: { label: string; value: ReactNode; strong?: boolean; testId?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-2 py-3", strong && "font-semibold")}>
      <dt className={strong ? "text-ink" : "text-ink-2"}>{label}</dt>
      <dd className="text-end font-semibold" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}
