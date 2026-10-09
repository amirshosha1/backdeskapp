"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Decimal from "decimal.js";
import { useLocale, useTranslations } from "next-intl";
import { DataWarning } from "@/components/common/data-warning";
import { HeroFigure } from "@/components/common/hero-figure";
import { LockedTeaser } from "@/components/common/locked-teaser";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";
import { SampleBadge } from "@/components/common/sample-badge";
import { ToastButton, useToast } from "@/components/common/toast";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { Link } from "@/i18n/navigation";
import { ChoiceGroup, NumberFieldRow, SelectRow, SwitchRow } from "./calculator-fields";
import { CollapsibleSection, ModelChips, NightsSlider, Stepper } from "./calculator-controls";
import { useCalculator, type CalculatorState } from "./use-calculator";
import {
  commissionUsesCleaningToggle,
  commissionUsesFixedFee,
  commissionUsesRate,
  parseField,
  type CalculatorForm,
  type ManagedBasis,
  type NumberField,
} from "@/lib/calculator/form";
import { displayOccupancy, toMoneyString, type OperatingModel, type PercentBasis, type ScenarioSentence } from "@/lib/finance";
import { formatTypedAmount } from "@/lib/format/amount";
import { currencyLabel, formatNumber } from "@/lib/format/money";
import { formatNights } from "@/lib/format/nights";
import { formatPercent } from "@/lib/format/percent";
import { createAutosave, type SaveStatus } from "@/lib/account/autosave";
import { saveUnitInputs, useAccount } from "@/lib/account/store";
import type { AccountUnit } from "@/lib/account/units";
import type { AssumedField, StoredInputs } from "@/lib/calculator/stored-inputs";
import { ownUnit, saveOwnUnit, useGuest } from "@/lib/guest/store";
import { setQueryParam, useQueryParam } from "@/lib/url-state";
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

type Tab = "summary" | "all";
type SectionId = "unitDetails" | "revenue" | "platformFee" | "opex" | "rent" | "commission" | "depreciation" | "other";

const SECTION_OF: Record<NumberField, SectionId> = {
  adr: "revenue",
  bookedNights: "revenue",
  blockedNights: "revenue",
  avgLengthOfStay: "revenue",
  cleaningFeePerStay: "revenue",
  platformFeePercent: "platformFee",
  utilities: "opex",
  internet: "opex",
  compoundFees: "opex",
  cleaningCost: "opex",
  consumables: "opex",
  repairs: "opex",
  rent: "rent",
  deposit: "rent",
  commissionPercent: "commission",
  fixedFee: "commission",
  setupCost: "depreciation",
  usefulLifeMonths: "depreciation",
};

/**
 * The feasibility calculator (P.2 slice 1): "الملخص" answers the question on
 * one screen, "كل الأرقام" holds every input and figure. Both tabs share
 * one state. The headline is the net profit after depreciation, and the
 * break-even beside it is on the same basis. Every figure comes from the
 * engine (`computeScenario`, `scenarioView`); this file only lays them out.
 *
 * A visitor with an apartment saved in this browser edits it and every
 * valid change is saved there. A signed-in person edits one of their
 * account's apartments (`?unit=<id>`, else the first), saved to the account
 * about a second after the last change, with the status in the top line.
 * Without either, the calculator shows the rental-arbitrage example and
 * saves nothing.
 */
export function CalculatorScreen({ presets }: CalculatorScreenProps) {
  const guest = useGuest();
  const account = useAccount();
  const unitId = useQueryParam("unit");
  // The page is static: until the browser's state is read, show the frame
  // without numbers rather than the example's figures for a moment.
  if (guest === null || account === null || account.status === "loading") return <CalculatorFrame />;
  if (account.status === "signed_in") {
    const unit = account.units.find((u) => u.id === unitId) ?? account.units[0] ?? null;
    if (!unit) return <CalculatorBody key="example" presets={presets} own={null} />;
    if (!unit.inputs) return <UnreadableUnit name={unit.name} />;
    return <AccountCalculator key={unit.id} presets={presets} unit={unit} inputs={unit.inputs} />;
  }
  const own = ownUnit(guest);
  return <CalculatorBody key={own ? "own" : "example"} presets={presets} own={own} onSave={own ? saveOwnUnit : undefined} />;
}

function CalculatorFrame() {
  const t = useTranslations("calculator");
  return (
    <div aria-busy="true">
      <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>}>
        <div className="mt-4 h-[18rem]" />
      </RoyalHero>
    </div>
  );
}

function UnreadableUnit({ name }: { name: string }) {
  const t = useTranslations("account");
  const tUnits = useTranslations("units");
  return (
    <div>
      <RoyalHero center={<HeroTitle>{name}</HeroTitle>} />
      <div className="flex flex-col gap-3 px-4 pt-6">
        <p role="alert" className="rounded-card bg-loss-soft p-4 text-[0.8125rem] leading-relaxed text-loss">
          {t("unreadable")}
        </p>
        <Link href="/demo/units" className="tap flex h-12 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
          {tUnits("title")}
        </Link>
      </div>
    </div>
  );
}

/**
 * One account apartment: every valid change is saved about a second after
 * the last one (src/lib/account/autosave.ts). A save still waiting is sent
 * when the screen closes or the tab is hidden.
 */
function AccountCalculator({ presets, unit, inputs }: { presets: CalculatorPreset[]; unit: AccountUnit; inputs: StoredInputs }) {
  const t = useTranslations("account");
  const { show } = useToast();
  const [status, setStatus] = useState<SaveStatus>("idle");
  const autosave = useMemo(
    () =>
      createAutosave<StoredInputs>(async (value) => {
        const result = await saveUnitInputs(unit.id, value);
        if (!result.ok && (result.error === "not_signed_in" || result.error === "session_expired")) show(t(`errors.${result.error}`));
        return result.ok;
      }, setStatus),
    [unit.id, show, t],
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void autosave.flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      void autosave.dispose();
    };
  }, [autosave]);

  return (
    <CalculatorBody
      presets={presets}
      own={inputs}
      onSave={(form, assumed: AssumedField[]) => autosave.schedule({ form, assumed })}
      title={unit.name}
      bannerTrailing={<SaveStatusLine status={status} onRetry={() => void autosave.flush()} />}
    />
  );
}

/** "محفوظ" / "جارٍ الحفظ…" in the top line; a failure is a retry button, never silent. */
function SaveStatusLine({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  const t = useTranslations("account.save");
  if (status === "failed") {
    return (
      <button type="button" onClick={onRetry} className="tap ms-1 min-h-11 rounded-full bg-loss px-3 font-semibold text-white" data-testid="save-status">
        {t("failed")}
      </button>
    );
  }
  return (
    <span aria-live="polite" data-testid="save-status" data-status={status}>
      {status === "pending" || status === "saving" ? t("saving") : status === "saved" ? t("saved") : ""}
    </span>
  );
}

interface CalculatorBodyProps {
  presets: CalculatorPreset[];
  own: StoredInputs | null;
  onSave?: (form: CalculatorForm, assumed: AssumedField[]) => void;
  title?: string;
  bannerTrailing?: ReactNode;
}

function CalculatorBody({ presets, own, onSave, title, bannerTrailing }: CalculatorBodyProps) {
  const t = useTranslations("calculator");
  const s = useCalculator(presets, own, onSave);
  const tab: Tab = useQueryParam("tab") === "all" ? "all" : "summary";
  const [openSection, setOpenSection] = useState<SectionId | null>("revenue");

  function showTab(next: Tab) {
    setQueryParam("tab", next === "all" ? "all" : null);
  }
  function openFirstInvalid() {
    const field = Object.keys(s.errors)[0] as NumberField | undefined;
    if (field) setOpenSection(SECTION_OF[field]);
    showTab("all");
  }

  return (
    <div>
      <CalculatorHero s={s} tab={tab} onTab={showTab} title={title} bannerTrailing={bannerTrailing} />
      <div role="tabpanel" id={`calc-panel-${tab}`} aria-labelledby={`calc-tab-${tab}`} className="flex flex-col gap-2.5 px-4 pt-2">
        {tab === "summary" ? (
          <SummaryTab s={s} onFixStale={openFirstInvalid} />
        ) : (
          <AllNumbersTab s={s} presets={presets} openSection={openSection} onToggle={(id) => setOpenSection((cur) => (cur === id ? null : id))} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- hero

function useSentence() {
  const t = useTranslations("calculator");
  const locale = useLocale() as AppLocale;
  return (sentence: ScenarioSentence, available: number) => {
    switch (sentence.kind) {
      case "no_available_nights":
        return t("sentence.noNights");
      case "no_break_even":
        return t("sentence.noBreakEven");
      case "beyond_month":
        return t("sentence.beyond", { breakEven: formatNights(sentence.nights, locale), available });
      case "short":
        return t("sentence.short", { short: sentence.nightsShort });
      case "at_first_profitable_night":
        return t("sentence.atFirst");
      case "above":
        return t("sentence.above", { above: sentence.nightsAbove });
    }
  };
}

function CalculatorHero({
  s,
  tab,
  onTab,
  title,
  bannerTrailing,
}: {
  s: CalculatorState;
  tab: Tab;
  onTab: (tab: Tab) => void;
  title?: string;
  bannerTrailing?: ReactNode;
}) {
  const t = useTranslations("calculator");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const sentence = useSentence();
  const owner = s.validForm.operatingModel === "managed_for_owner" ? "yes" : "no";
  const available = s.result.nightsAvailable.toNumber();
  const booked = new Decimal(s.input.bookedNights).toNumber();
  const occupancy = displayOccupancy(s.result.kpis.occupancy);
  const be = s.view.breakEven;

  return (
    <RoyalHero center={<HeroTitle>{title ?? t("title")}</HeroTitle>} className="pb-3" bannerTrailing={bannerTrailing}>
      <div role="tablist" aria-label={t("tabsLabel")} className="mt-2 grid grid-cols-2 gap-1 rounded-full border border-white/18 bg-navy-950/35 p-1">
        {(["summary", "all"] as const).map((id) => (
          <button
            key={id}
            id={`calc-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`calc-panel-${id}`}
            onClick={() => onTab(id)}
            className={cn("tap h-11 rounded-full text-[0.8125rem] font-semibold", tab === id ? "bg-white text-navy-900" : "text-white/90")}
          >
            {id === "summary" ? t("tabSummary") : t("tabAll")}
          </button>
        ))}
      </div>

      <div className={cn("mt-2.5 flex flex-col items-center transition-opacity", s.stale && "opacity-50")}>
        <p className="text-[0.9375rem] text-white/80">{t("heroLabel", { owner })}</p>
        <HeroFigure amount={toMoneyString(s.view.netAfterDepreciation)} size={tab === "summary" ? "md" : "sm"} className="mt-1" />
        <p className="glass mt-2 rounded-[1.125rem] px-3.5 py-1.5 text-center text-[0.8125rem] leading-snug font-semibold" data-testid="hero-sentence" aria-live="polite">
          {sentence(s.view.sentence, available)}
        </p>
      </div>

      {tab === "summary" && (
        <div className={cn("mt-2 transition-opacity", s.stale && "opacity-50")}>
          <div className="flex items-center justify-between text-[0.8125rem] font-medium" data-testid="nights-header">
            <span>{t("nightsHeader", { booked, available })}</span>
            {occupancy && <span>{t("occupancyShort", { occupancy: formatPercent(occupancy.toNumber(), { locale, decimals: 0, isolate: true }) })}</span>}
          </div>
          {available > 0 ? (
            <NightsSlider
              booked={booked}
              available={available}
              breakEven={be.status === "within_month" ? be.nights.toNumber() : null}
              pill={be.status === "within_month" ? t("breakEvenPill", { nights: formatNights(be.nights, locale) }) : ""}
              offPill={be.status === "beyond_available_nights" ? t("breakEvenBeyondPill", { nights: formatNights(be.nights, locale) }) : t("breakEvenNonePill")}
              label={t("fields.bookedNights")}
              valueText={t("nightsHeader", { booked, available })}
              onChange={(nights) => s.update({ ...s.form, values: { ...s.form.values, bookedNights: String(nights) } }, ["bookedNights"])}
            />
          ) : (
            <div className="h-[4.25rem]" />
          )}
          {s.result.kpis.warnings.length > 0 && <DataWarning message={tCommon("dataWarningOccupancy")} className="mt-1" />}
        </div>
      )}
    </RoyalHero>
  );
}

// ---------------------------------------------------------------- summary

interface StepperDef {
  field: NumberField;
  labelKey: "adr" | "rent" | "commission" | "platformFee";
  step: string;
  min: string;
  max?: string;
  percent?: boolean;
}

function secondStepper(s: CalculatorState): StepperDef {
  if (s.form.operatingModel === "rental_arbitrage") return { field: "rent", labelKey: "rent", step: "1000", min: "0" };
  if (s.form.operatingModel === "managed_for_owner" && commissionUsesRate(s.form.commission.basis)) {
    return { field: "commissionPercent", labelKey: "commission", step: "1", min: "0", max: "100", percent: true };
  }
  // Owner-operated, or a fixed monthly fee (which a rate stepper would not change).
  return { field: "platformFeePercent", labelKey: "platformFee", step: "0.5", min: "0", max: "100", percent: true };
}

function SummaryTab({ s, onFixStale }: { s: CalculatorState; onFixStale: () => void }) {
  const t = useTranslations("calculator");
  const tModel = useTranslations("calculator.modelChip");
  const locale = useLocale() as AppLocale;
  const { show } = useToast();
  const owner = s.validForm.operatingModel === "managed_for_owner" ? "yes" : "no";
  const steppers: StepperDef[] = [{ field: "adr", labelKey: "adr", step: "100", min: "0" }, secondStepper(s)];
  const amount = (raw: string, percent?: boolean) => `${formatTypedAmount(raw, locale)}${percent ? "%" : ""}`;

  function step(def: StepperDef, direction: 1 | -1) {
    const label = t(`stepper.${def.labelKey}`);
    const current = parseField(def.field, s.form.values[def.field]);
    const fallback = parseField(def.field, s.validForm.values[def.field]);
    const base = current.ok ? current.value : fallback.ok ? fallback.value : new Decimal(0);
    const next = base.plus(new Decimal(def.step).times(direction));
    if (next.lessThan(def.min)) return show(t("stepper.atMin", { label, limit: amount(def.min, def.percent) }));
    if (def.max && next.greaterThan(def.max)) return show(t("stepper.atMax", { label, limit: amount(def.max, def.percent) }));
    s.update({ ...s.form, values: { ...s.form.values, [def.field]: next.toString() } }, [def.field]);
  }

  return (
    <>
      {s.stale && (
        <button type="button" onClick={onFixStale} className="tap rounded-tile bg-loss-soft px-4 py-2.5 text-start text-xs leading-relaxed text-loss" data-testid="stale-summary">
          {t("staleSummary")}
        </button>
      )}
      <ModelChips value={s.form.operatingModel} options={MODELS.map((m) => ({ value: m, label: tModel(m) }))} onChange={(operatingModel) => s.update({ ...s.form, operatingModel })} />
      <div className="divide-y divide-line rounded-card bg-fill px-4 py-1" data-testid="summary-steppers">
        {steppers.map((def) => {
          const label = t(`stepper.${def.labelKey}`);
          return (
            <Stepper
              key={def.field}
              label={label}
              value={<bdi dir="ltr">{amount(s.form.values[def.field], def.percent)}</bdi>}
              decLabel={t("stepper.dec", { label, step: amount(def.step, def.percent) })}
              incLabel={t("stepper.inc", { label, step: amount(def.step, def.percent) })}
              onDec={() => step(def, -1)}
              onInc={() => step(def, 1)}
              testId={`stepper-${def.field}`}
            />
          );
        })}
      </div>
      <dl className={cn("divide-y divide-line rounded-card bg-fill px-4 py-1 transition-opacity", s.stale && "opacity-50")}>
        <SummaryRow label={t("rows.revenue")} testId="summary-revenue" value={<Money amount={toMoneyString(s.view.revenue)} hideCurrency />} />
        <SummaryRow label={t("rows.costs")} testId="summary-costs" value={<Money amount={toMoneyString(s.view.totalCostsWithDepreciation.negated())} hideCurrency />} />
        <SummaryRow
          strong
          label={t("rows.net", { owner })}
          testId="summary-net"
          value={<Money amount={toMoneyString(s.view.netAfterDepreciation)} colorBySign signDisplay="always" hideCurrency />}
        />
      </dl>
    </>
  );
}

function SummaryRow({ label, value, strong, testId }: { label: string; value: ReactNode; strong?: boolean; testId: string }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3" data-testid={testId}>
      <dt className={cn(strong ? "text-[0.9375rem] font-semibold text-ink" : "text-sm text-ink-2")}>{label}</dt>
      <dd className="text-[0.9375rem] font-semibold">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------- all numbers

function AllNumbersTab({
  s,
  presets,
  openSection,
  onToggle,
}: {
  s: CalculatorState;
  presets: CalculatorPreset[];
  openSection: SectionId | null;
  onToggle: (id: SectionId) => void;
}) {
  const t = useTranslations("calculator");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  const tModel = useTranslations("calculator.modelChip");
  const locale = useLocale() as AppLocale;
  const form = s.form;
  const isArbitrage = form.operatingModel === "rental_arbitrage";
  const isManaged = form.operatingModel === "managed_for_owner";
  const owner = s.validForm.operatingModel === "managed_for_owner" ? "yes" : "no";
  const sections = s.view.sections;
  const negative = (d: Decimal | null) => <Money amount={toMoneyString((d ?? new Decimal(0)).negated())} hideCurrency />;

  const field = (name: NumberField, kind: "money" | "percent" | "nights" | "months", extra?: { hint?: ReactNode; label?: string }) => (
    <NumberFieldRow
      key={name}
      id={`calc-${name}`}
      label={extra?.label ?? t(`fields.${name}`)}
      value={form.values[name]}
      onChange={(value) => s.setValue(name, value)}
      onCommit={() => s.commit(name)}
      {...(kind === "money"
        ? { left: currencyLabel("EGP", locale) }
        : kind === "percent"
          ? { right: "%" }
          : locale === "ar"
            ? { left: t(`units.${kind}`) }
            : { right: t(`units.${kind}`) })}
      hint={extra?.hint}
      error={s.errors[name] && t(`errors.${s.errors[name]}`)}
      sample={s.assumed.has(name)}
    />
  );
  const setCommission = (patch: Partial<typeof form.commission>) => s.update({ ...form, commission: { ...form.commission, ...patch } }, ["commissionBasis"]);
  const occupancy = displayOccupancy(s.result.kpis.occupancy);
  const pct = (ratio: Decimal, decimals = 1) => formatPercent(ratio.toNumber(), { locale, decimals, isolate: true });

  return (
    <>
      {s.mode === "own" ? (
        <p className="text-xs leading-relaxed text-muted" data-testid="storage-note">
          {t("ownNote")}
        </p>
      ) : (
        <>
          {/* Only for the example: above the visitor's own numbers, a loader looked like the model chips below it. */}
          <ChoiceGroup onPage label={t("presetsLabel")} value={s.activePresetId} options={presets.map((p) => ({ value: p.id, label: t(`presets.${p.id}`) }))} onChange={s.loadPreset} />
          <p className="flex flex-wrap items-center gap-x-2 text-xs leading-relaxed text-muted" data-testid="storage-note">
            <span>{t("exampleNote")}</span>
            <Link href="/demo/start" className="inline-flex min-h-11 items-center font-semibold text-brand">
              {t("exampleAdd")}
            </Link>
          </p>
        </>
      )}

      {s.stale && (
        <p role="status" className="rounded-card bg-loss-soft p-4 text-sm leading-relaxed text-loss" data-testid="stale-notice">
          {t("invalidNotice")}
        </p>
      )}
      {s.result.kpis.warnings.length > 0 && <DataWarning message={tCommon("dataWarningOccupancy")} />}

      <ModelChips value={form.operatingModel} options={MODELS.map((m) => ({ value: m, label: tModel(m) }))} onChange={(operatingModel) => s.update({ ...form, operatingModel })} />

      {s.mode === "example" && (
        <CollapsibleSection title={t("sections.unitDetails")} open={openSection === "unitDetails"} onToggle={() => onToggle("unitDetails")} testId="section-unitDetails">
          {(["city", "area", "bedrooms", "bathrooms", "maxGuests"] as const).map((key) => {
            const raw = s.unitPreset.unit[key];
            return (
              <ToastButton key={key} message={tToast("unitDetails")} className="flex min-h-11 w-full items-center gap-2 py-3 text-start text-sm">
                <span className="min-w-0 flex-1 text-ink-2">{t(`unitDetails.${key}`)}</span>
                <SampleBadge />
                <span className="font-semibold">
                  <bdi>{typeof raw === "string" ? raw : raw[locale]}</bdi>
                </span>
              </ToastButton>
            );
          })}
        </CollapsibleSection>
      )}

      <div className={cn("flex flex-col gap-2 transition-opacity", s.stale && "[&_[data-total]]:opacity-50")}>
        <CollapsibleSection
          title={t("sections.revenue")}
          total={<span data-total="">{<Money amount={toMoneyString(sections.revenue)} hideCurrency />}</span>}
          open={openSection === "revenue"}
          onToggle={() => onToggle("revenue")}
          testId="section-revenue"
        >
          {field("adr", "money")}
          {field("bookedNights", "nights", {
            hint:
              !s.stale &&
              occupancy &&
              t("occupancyHint", { occupancy: pct(occupancy), available: formatNumber(s.result.nightsAvailable, { locale, decimals: 0 }) }),
          })}
          {field("blockedNights", "nights", { hint: t("blockedHint") })}
          {field("avgLengthOfStay", "nights")}
          {field("cleaningFeePerStay", "money")}
        </CollapsibleSection>

        <CollapsibleSection
          title={t("sections.platformFee")}
          total={<span data-total="">{negative(sections.platformFees)}</span>}
          open={openSection === "platformFee"}
          onToggle={() => onToggle("platformFee")}
          testId="section-platformFee"
        >
          {field("platformFeePercent", "percent")}
        </CollapsibleSection>

        <CollapsibleSection
          title={t("sections.opex")}
          total={<span data-total="">{negative(sections.operatingExpenses)}</span>}
          open={openSection === "opex"}
          onToggle={() => onToggle("opex")}
          testId="section-opex"
        >
          {field("utilities", "money")}
          {field("internet", "money")}
          {field("compoundFees", "money")}
          {field("cleaningCost", "money")}
          {field("consumables", "money")}
          {field("repairs", "money")}
        </CollapsibleSection>

        {isArbitrage && (
          <CollapsibleSection
            title={t("sections.rent")}
            total={<span data-total="">{negative(sections.rent)}</span>}
            open={openSection === "rent"}
            onToggle={() => onToggle("rent")}
            testId="section-rent"
          >
            {field("rent", "money")}
            {field("deposit", "money", { hint: t("depositHint") })}
          </CollapsibleSection>
        )}

        {isManaged && (
          <CollapsibleSection
            title={t("sections.commission")}
            total={<span data-total="">{negative(sections.managementCommission)}</span>}
            open={openSection === "commission"}
            onToggle={() => onToggle("commission")}
            testId="section-commission"
          >
            <SelectRow
              id="calc-commission-basis"
              label={t("commissionBasisLabel")}
              value={form.commission.basis}
              options={MANAGED_BASES.map((b) => ({ value: b, label: t(`commissionBasis.${b}`) }))}
              onChange={(basis) => setCommission({ basis })}
              onCommit={() => s.commit("commissionBasis")}
              sample={s.assumed.has("commissionBasis")}
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
            {commissionUsesRate(form.commission.basis) && field("commissionPercent", "percent")}
            {commissionUsesFixedFee(form.commission.basis) &&
              field("fixedFee", "money", { label: t("fields.fixedFee", { mode: form.commission.basis === "hybrid" ? form.commission.hybridMode : "fixed" }) })}
            {commissionUsesCleaningToggle(form.commission) && (
              <SwitchRow
                label={t("includeCleaningFeesLabel")}
                checked={form.commission.includeCleaningFees}
                onChange={(includeCleaningFees) => setCommission({ includeCleaningFees })}
              />
            )}
          </CollapsibleSection>
        )}

        <LedgerTotal label={t("sections.beforeDepreciation", { owner })} amount={sections.profitBeforeDepreciation} testId="subtotal-before-depreciation" />

        <CollapsibleSection
          title={t("sections.depreciation")}
          total={<span data-total="">{negative(sections.depreciation)}</span>}
          open={openSection === "depreciation"}
          onToggle={() => onToggle("depreciation")}
          testId="section-depreciation"
        >
          {field("setupCost", "money")}
          {field("usefulLifeMonths", "months")}
        </CollapsibleSection>

        <LedgerTotal double label={t("rows.net", { owner })} amount={s.view.netAfterDepreciation} testId="total-net" />

        <CollapsibleSection title={t("sections.other")} open={openSection === "other"} onToggle={() => onToggle("other")} testId="section-other">
          <OtherIndicators s={s} />
        </CollapsibleSection>
      </div>

      <p className="text-xs leading-relaxed text-muted">{t("basisNote")}</p>

      <LockedTeaser title={t("projectionTeaserTitle")} body={tCommon("lockedTeaserBody")}>
        <div className="flex h-40 items-end gap-1.5 p-5">
          {DECORATIVE_BAR_HEIGHTS.map((height, index) => (
            <div key={index} className="flex-1 rounded-t-md bg-royal-500" style={{ height: `${height}%` }} />
          ))}
        </div>
      </LockedTeaser>

    </>
  );
}

/**
 * A subtotal or total between the sections: no card and no chevron, a rule
 * above it like a ledger's sum line (two rules for the final total), so it
 * reads as the result of the lines above rather than as another section.
 */
function LedgerTotal({ label, amount, double, testId }: { label: string; amount: Decimal; double?: boolean; testId: string }) {
  return (
    <div
      className={cn("mx-4 flex min-h-12 items-center justify-between gap-3 border-t-2 border-ink/70 pt-1", double && "border-double border-t-4")}
      data-testid={testId}
    >
      <span className="text-[0.9375rem] font-semibold">{label}</span>
      <span className="text-[0.9375rem] font-semibold" data-total="">
        <Money amount={toMoneyString(amount)} colorBySign signDisplay="always" hideCurrency />
      </span>
    </div>
  );
}

function OtherIndicators({ s }: { s: CalculatorState }) {
  const t = useTranslations("calculator");
  const tUnits = useTranslations("units");
  const locale = useLocale() as AppLocale;
  const isManaged = s.validForm.operatingModel === "managed_for_owner";
  const hasDeposit = s.validForm.operatingModel === "rental_arbitrage" && !new Decimal(s.input.deposit).isZero() ? "yes" : "no";
  const { result, view } = s;
  const incDep = result.breakEven.includingDepreciation;
  const pct = (ratio: Decimal) => formatPercent(ratio.toNumber(), { locale, decimals: 1, isolate: true });
  const money = (d: Decimal.Value) => <Money amount={toMoneyString(d)} />;
  const beValue = (be: typeof result.breakEven.primary) =>
    be.kind === "reached" ? t("breakEvenValue", { nights: formatNights(be.nights, locale), occupancy: pct(be.occupancy) }) : t("breakEvenUnreachableValue");

  return (
    <>
    <dl className="divide-y divide-line text-sm">
      <Row label={t("netPayoutLabel")} value={money(result.pnl.netPayout)} />
      <Row label={t("noiLabel")} value={<Money amount={toMoneyString(result.pnl.noi)} colorBySign signDisplay="always" />} />
      {isManaged && view.managerProfit && <Row label={tUnits("managerProfitLabel")} testId="result-manager-profit" value={money(view.managerProfit)} />}
      <Row
        label={t("breakEvenAfterLabel")}
        testId="result-break-even-after"
        value={
          view.breakEven.status === "within_month" && incDep.kind === "reached"
            ? t("breakEvenValue", { nights: formatNights(incDep.nights, locale), occupancy: pct(incDep.occupancy) })
            : view.breakEven.status === "beyond_available_nights"
              ? t("breakEvenBeyondValue", { nights: formatNights(view.breakEven.nights, locale) })
              : t("breakEvenNoneValue")
        }
      />
      {view.breakEven.status !== "no_break_even" && (
        <Row label={t("firstProfitableNightLabel")} testId="result-first-profitable-night" value={t("firstProfitableNightValue", { night: view.breakEven.wholeNights })} />
      )}
      {/* The after-depreciation break-even's own terms: fixed costs ÷ contribution = nights. */}
      {isManaged && <Row label={t("contributionBeforeCommissionLabel")} testId="result-contribution-before-commission" value={money(result.contributionPerNight)} />}
      {incDep.kind === "reached" ? (
        <>
          <Row
            label={isManaged ? t("contributionAfterCommissionLabel") : t("contributionPerNightLabel")}
            testId="result-contribution"
            value={money(incDep.contributionPerNight)}
          />
          <Row label={t("breakEvenFixedCostsLabel")} testId="result-break-even-fixed-costs" value={money(incDep.fixedCosts)} />
        </>
      ) : (
        !isManaged && <Row label={t("contributionPerNightLabel")} testId="result-contribution" value={money(result.contributionPerNight)} />
      )}
      <Row label={t("breakEvenBeforeLabel")} testId="result-break-even-before" value={beValue(result.breakEven.primary)} />
      <Row label={t("breakEvenBeforeNoMaintenanceLabel")} testId="result-break-even-before-no-maintenance" value={beValue(result.breakEven.excludingIrregular)} />
      <Row label={t("investedLabel", { deposit: hasDeposit })} value={money(result.investment.totalCashInvested)} />
      <Row
        label={t("paybackLabel", { deposit: hasDeposit })}
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
        <Row
          label={t("cashOnCashLabel", { deposit: hasDeposit })}
          testId="result-cash-on-cash"
          value={<Percent ratio={result.investment.cashOnCash.toNumber()} capAt100={false} signDisplay="always" />}
        />
      )}
    </dl>
    <p className="py-3 text-xs leading-relaxed text-muted" data-testid="return-note">
      {t("returnNote")}
    </p>
    </>
  );
}

function Row({ label, value, testId }: { label: string; value: ReactNode; testId?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3" data-testid={testId}>
      <dt className="min-w-0 text-ink-2">{label}</dt>
      <dd className="shrink-0 text-end font-semibold">{value}</dd>
    </div>
  );
}
