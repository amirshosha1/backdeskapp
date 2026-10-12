"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, ChevronLeft, House, KeyRound, Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { BrandMark } from "@/components/common/brand-mark";
import { HeroFigure } from "@/components/common/hero-figure";
import { RangeSlider, SliderTrack } from "@/components/common/range-slider";
import { SampleBadge } from "@/components/common/sample-badge";
import { useToast } from "@/components/common/toast";
import { DemoBanner } from "@/components/demo/demo-banner";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { parseCalculatorForm, type CalculatorForm } from "@/lib/calculator/form";
import { computeKpis, computeScenario, displayOccupancy, scenarioView, toMoneyString, type OperatingModel, type ScenarioSentence } from "@/lib/finance";
import {
  assumedAfterFlow,
  clampToRange,
  COMMISSION_RANGE,
  formFromAnswers,
  NIGHTS_RANGE,
  nextStep,
  previousStep,
  PRICE_RANGE,
  questionCount,
  RENT_RANGE,
  resolveStep,
  startingAnswers,
  stepsFor,
  type DialRange,
  type FirstRunAnswers,
  type FirstRunStep,
} from "@/lib/first-run/flow";
import { formatTypedAmount, parseAmount } from "@/lib/format/amount";
import { currencyLabel, formatMoney } from "@/lib/format/money";
import { formatPercent } from "@/lib/format/percent";
import { readFirstRunAnswers, useFirstRunAnswers, writeFirstRunAnswers } from "@/lib/guest/first-run-answers";
import { flowSentence } from "@/lib/first-run/sentence";
import { firstRunEntry, trackFirstRunStarted, trackVerdictShown } from "@/lib/analytics/flow-events";
import { readAccount, saveCount } from "@/lib/account/store";
import { APARTMENT_COUNTS, saveOwnUnit, setApartmentCount, setFirstRunSeen, useGuest, type ApartmentCount } from "@/lib/guest/store";
import { setQueryParam, useQueryParam } from "@/lib/url-state";
import { cn } from "@/lib/utils";

const MODELS: OperatingModel[] = ["owner_operated", "rental_arbitrage", "managed_for_owner"];
const MODEL_ICONS: Record<OperatingModel, typeof House> = {
  owner_operated: House,
  rental_arbitrage: KeyRound,
  managed_for_owner: Building2,
};

/**
 * The first-run guided flow (P.2 slice 1): model → price → nights → cost
 * (rent or commission; owner-operated skips it) → verdict → how many
 * apartments. The step is in the URL (`?step=`), the answers in
 * sessionStorage (never the URL: the visitor's numbers stay in the
 * browser). Reaching the verdict saves the unit in this browser; "تخطَّ"
 * and "ادخل التطبيق" end the flow and mark it as seen.
 */
export function FirstRunScreen({ example }: { example: CalculatorForm }) {
  const stored = useFirstRunAnswers();
  const answers = useMemo(() => stored ?? startingAnswers(example), [stored, example]);
  const step = resolveStep(useQueryParam("step"), answers.model);

  const setStep = (next: FirstRunStep) => setQueryParam("step", next === "model" ? null : next);
  const setAnswers = (patch: Partial<FirstRunAnswers>) => writeFirstRunAnswers({ ...answers, ...patch });
  const goNext = () => setStep(nextStep(step, answers.model));
  const goBack = () => setStep(previousStep(step, answers.model));

  // Anonymous counting (docs/ANALYTICS.md): the flow has started when its
  // first question is on screen with nothing answered yet. Read straight
  // from storage: the hook reports null until hydration ends.
  useEffect(() => {
    if (step === "model" && readFirstRunAnswers() === null) trackFirstRunStarted();
    else firstRunEntry();
  }, [step]);

  if (step === "verdict" && answers.model) {
    return <VerdictStep example={example} answers={{ ...answers, model: answers.model }} onBack={goBack} onNext={goNext} onRestart={() => {
      writeFirstRunAnswers(startingAnswers(example));
      setStep("model");
    }} />;
  }

  return (
    <div className="royal-hero flex min-h-dvh flex-col px-4 pb-7 text-white">
      <DemoBanner onHero />
      <TopBar step={step} model={answers.model} onBack={goBack} />
      {step === "model" && (
        <ModelStep
          value={answers.model}
          onPick={(model) => {
            setAnswers({ model });
            setStep("price");
          }}
        />
      )}
      {step === "price" && <DialStep kind="price" range={PRICE_RANGE} value={answers.adr} onChange={(adr) => setAnswers({ adr })} onNext={goNext} last={false} />}
      {step === "nights" && (
        <DialStep
          kind="nights"
          range={NIGHTS_RANGE}
          value={answers.nights}
          onChange={(nights) => setAnswers({ nights })}
          onNext={goNext}
          last={answers.model === "owner_operated"}
        />
      )}
      {step === "cost" && answers.model === "rental_arbitrage" && (
        <DialStep kind="rent" range={RENT_RANGE} value={answers.rent} onChange={(rent) => setAnswers({ rent })} onNext={goNext} last />
      )}
      {step === "cost" && answers.model === "managed_for_owner" && (
        <DialStep kind="commission" range={COMMISSION_RANGE} value={answers.commission} onChange={(commission) => setAnswers({ commission })} onNext={goNext} last />
      )}
      {step === "count" && <CountStep />}
    </div>
  );
}

function GlassButton({ onClick, label, children, className }: { onClick: () => void; label: string; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cn("glass tap flex shrink-0 items-center justify-center rounded-full", className)}>
      {children}
    </button>
  );
}

/** Logo (first question) or back, one progress segment per question, skip, language. */
function TopBar({ step, model, onBack }: { step: FirstRunStep; model: OperatingModel | null; onBack: () => void }) {
  const t = useTranslations("firstRun");
  const tCommon = useTranslations("common");
  const total = questionCount(model);
  const index = stepsFor(model).indexOf(step);
  return (
    <div className="mt-2 flex min-h-11 items-center gap-2">
      {step === "model" ? (
        <span role="img" aria-label={tCommon("brandName")} className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
          <BrandMark />
        </span>
      ) : (
        <GlassButton onClick={onBack} label={tCommon("back")} className="h-11 w-11">
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </GlassButton>
      )}
      {step === "count" ? (
        <div className="flex-1" />
      ) : (
        <div
          role="progressbar"
          aria-label={t("progressLabel", { current: index + 1, total })}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          className="flex flex-1 gap-1.5"
          data-testid="first-run-progress"
        >
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-white" : "bg-white/28")} data-filled={i <= index} />
          ))}
        </div>
      )}
      <SkipLink />
      <LanguageSwitch />
    </div>
  );
}

function SkipLink() {
  const t = useTranslations("firstRun");
  return (
    <Link
      href="/demo/units"
      replace
      onClick={() => {
        setFirstRunSeen();
        writeFirstRunAnswers(null);
      }}
      className="tap flex h-11 min-w-11 shrink-0 items-center justify-center px-1.5 text-[0.8125rem] font-medium text-white/85"
    >
      {t("skip")}
    </Link>
  );
}

function ModelStep({ value, onPick }: { value: OperatingModel | null; onPick: (model: OperatingModel) => void }) {
  const t = useTranslations("firstRun");
  return (
    <div className="flex flex-1 flex-col gap-6 pt-9">
      <div className="flex flex-col gap-2">
        <p className="text-[0.9375rem] text-white/80">{t("welcome")}</p>
        <h1 className="text-[1.875rem] leading-snug font-semibold">{t("modelTitle")}</h1>
      </div>
      <div role="radiogroup" aria-label={t("modelsLabel")} className="flex flex-col gap-3">
        {MODELS.map((model) => {
          const Icon = MODEL_ICONS[model];
          const checked = value === model;
          return (
            <button
              key={model}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onPick(model)}
              className={cn("glass tap flex min-h-20 items-center gap-3 rounded-tile px-4 py-3.5 text-start", checked && "ring-2 ring-white/90")}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/18">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-[0.9375rem] font-semibold">{t(`models.${model}.title`)}</span>
                <span className="text-xs text-white/80">{t(`models.${model}.sub`)}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-auto text-center text-[0.8125rem] leading-relaxed">{t("modelHint")}</p>
    </div>
  );
}

type DialKind = "price" | "nights" | "rent" | "commission";

function DialStep({ kind, range, value, onChange, onNext, last }: { kind: DialKind; range: DialRange; value: number; onChange: (value: number) => void; onNext: () => void; last: boolean }) {
  const t = useTranslations("firstRun");
  const tCalc = useTranslations("calculator");
  const locale = useLocale() as AppLocale;
  const { show } = useToast();
  const [draft, setDraft] = useState<string | null>(null);
  const label = kind === "price" ? tCalc("stepper.adr") : kind === "nights" ? tCalc("fields.bookedNights") : kind === "rent" ? tCalc("stepper.rent") : tCalc("stepper.commission");
  const shown = (n: number) => `${formatTypedAmount(String(n), locale)}${kind === "commission" ? "%" : ""}`;
  const step = shown(range.button);

  function nudge(direction: 1 | -1) {
    const next = value + direction * range.button;
    if (next < range.min) return show(tCalc("stepper.atMin", { label, limit: shown(range.min) }));
    if (next > range.max) return show(tCalc("stepper.atMax", { label, limit: shown(range.max) }));
    setDraft(null);
    onChange(clampToRange(next, range));
  }

  function commitDraft(): boolean {
    if (draft === null) return true;
    const parsed = parseAmount(draft, { allowZero: true, maxDecimals: 0 });
    if (!parsed.ok || parsed.value.lessThan(range.min) || parsed.value.greaterThan(range.max)) {
      show(t("directInputError", { min: shown(range.min), max: shown(range.max) }));
      return false;
    }
    onChange(parsed.value.toNumber());
    setDraft(null);
    return true;
  }

  const unit = kind === "nights" ? t("nights.unit", { count: value }) : kind === "commission" ? null : currencyLabel("EGP", locale);
  // The flow's month has no blocked nights (the example's 0), so all 30 nights are available.
  const occupancy =
    kind === "nights" ? displayOccupancy(computeKpis({ nightsAvailable: NIGHTS_RANGE.max, bookedNights: value, accommodationRevenue: 0 }).occupancy) : null;
  const caption =
    kind === "nights"
      ? t("nights.caption", { occupancy: formatPercent(occupancy?.toNumber() ?? 0, { locale, decimals: 0, isolate: true }), available: NIGHTS_RANGE.max })
      : t(`${kind}.caption`);

  return (
    <div className="flex flex-1 flex-col pt-9">
      <h1 className="text-[1.875rem] leading-snug font-semibold">{t(`${kind}.title`)}</h1>
      <div className="flex flex-1 flex-col justify-center gap-5">
        <p className="flex items-baseline justify-center gap-2.5">
          <bdi dir="ltr" className="text-[4rem] leading-none font-semibold tracking-[-0.04em] tabular-nums-money" data-testid="dial-value">
            {shown(value)}
          </bdi>
          {unit && <span className="text-[0.9375rem] text-white/80">{unit}</span>}
        </p>
        <p className="min-h-[1.375rem] text-center text-sm text-white/85">{caption}</p>
        <label className="mx-auto flex w-full max-w-56 flex-col gap-1.5 text-sm text-white/90">
          <span>{t("directInputLabel", { label })}</span>
          <input
            type="text"
            inputMode="numeric"
            value={draft ?? String(value)}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            className="h-11 w-full rounded-xl bg-white px-3 text-center text-base font-semibold text-navy-900 tabular-nums-money"
            data-testid="dial-direct-input"
          />
        </label>
        <div className="flex items-center gap-3.5">
          <GlassButton onClick={() => nudge(-1)} label={t(`${kind}.dec`, { step })} className="h-[3.25rem] w-[3.25rem]">
            <Minus className="h-5 w-5" aria-hidden="true" />
          </GlassButton>
          <RangeSlider label={t(`${kind}.title`)} value={value} min={range.min} max={range.max} step={range.step} onChange={(next) => { setDraft(null); onChange(next); }} className="min-w-0 flex-1" testId="dial-slider">
            <SliderTrack ratio={(value - range.min) / (range.max - range.min)} />
          </RangeSlider>
          <GlassButton onClick={() => nudge(1)} label={t(`${kind}.inc`, { step })} className="h-[3.25rem] w-[3.25rem]">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </GlassButton>
        </div>
      </div>
      <button type="button" onClick={() => { if (commitDraft()) onNext(); }} className="tap h-[3.25rem] rounded-full bg-white text-[0.9375rem] font-semibold text-navy-900">
        {last ? t("showResult") : t("next")}
      </button>
    </div>
  );
}

function useFlowSentence() {
  const t = useTranslations("firstRun");
  const locale = useLocale() as AppLocale;
  return (sentence: ScenarioSentence, booked: number, available: number) => {
    const { key, values } = flowSentence(sentence, booked, available, locale);
    return t(key, values);
  };
}

function VerdictStep({
  example,
  answers,
  onBack,
  onNext,
  onRestart,
}: {
  example: CalculatorForm;
  answers: FirstRunAnswers & { model: OperatingModel };
  onBack: () => void;
  onNext: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations("firstRun");
  const tCalc = useTranslations("calculator");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const sentence = useFlowSentence();
  const form = useMemo(() => formFromAnswers(example, answers), [example, answers]);
  const parsed = parseCalculatorForm(form);
  const model = answers.model;

  // "تُحفظ هذه الشقة كأول وحدة لك على هذا الجهاز": reaching the verdict saves it.
  useEffect(() => {
    if (parseCalculatorForm(form).ok) saveOwnUnit(form, assumedAfterFlow(model));
  }, [form, model]);

  const result = parsed.ok ? computeScenario(parsed.input) : null;
  const view = parsed.ok && result ? scenarioView(parsed.input, result) : null;
  const outcome = view?.outcome ?? null;
  // Counted once per page view: profit or loss only, never the amount.
  useEffect(() => {
    if (outcome) trackVerdictShown(outcome);
  }, [outcome]);

  if (!parsed.ok || !result || !view) return null;
  const owner = model === "managed_for_owner" ? "yes" : "no";
  const v = example.values;
  const money = (raw: string) => formatMoney(raw, { locale, decimals: 0 });
  const rows: { key: string; label: string; value: string }[] = [
    { key: "platformFee", label: t("assumed.platformFee"), value: `${formatTypedAmount(v.platformFeePercent, locale)}%` },
    { key: "opex", label: t("assumed.opex"), value: formatMoney(view.sections.operatingExpenses, { locale }) },
    { key: "setup", label: t("assumed.setup"), value: t("assumed.setupValue", { amount: money(v.setupCost), months: Number(v.usefulLifeMonths) }) },
    { key: "cleaningFee", label: t("assumed.cleaningFee"), value: money(v.cleaningFeePerStay) },
    { key: "stay", label: t("assumed.stay"), value: t("assumed.stayValue", { nights: formatTypedAmount(v.avgLengthOfStay, locale), count: Number(v.avgLengthOfStay) }) },
    ...(model === "rental_arbitrage" ? [{ key: "deposit", label: t("assumed.deposit"), value: money(v.deposit) }] : []),
    ...(model === "managed_for_owner" ? [{ key: "basis", label: t("assumed.commissionBasis"), value: tCalc(`commissionBasis.${example.commission.basis}`) }] : []),
    { key: "blocked", label: t("assumed.blocked"), value: formatTypedAmount(v.blockedNights, locale) },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <section className="royal-hero flex flex-col gap-3.5 rounded-b-[var(--radius-hero)] px-4 pb-7 text-white">
        <DemoBanner onHero />
        <div className="mt-2 flex min-h-11 items-center justify-between">
          <GlassButton onClick={onBack} label={tCommon("back")} className="h-11 w-11">
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          </GlassButton>
          <LanguageSwitch />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-[0.9375rem] text-white/80">{tCalc("heroLabel", { owner })}</p>
          <h1 className={cn("text-[2.75rem] leading-snug font-bold", view.outcome === "profit" ? "text-hero-profit" : "text-hero-loss")} data-testid="verdict-word">
            {t("verdictWord", { outcome: view.outcome, owner })}
          </h1>
          <HeroFigure amount={toMoneyString(view.netAfterDepreciation)} />
          <p className="text-[0.8125rem] text-white/75">{t("perMonth")}</p>
        </div>
        <p className="glass self-center rounded-[1.125rem] px-3.5 py-2 text-center text-[0.8125rem] leading-relaxed font-semibold" data-testid="verdict-sentence">
          {sentence(view.sentence, answers.nights, result.nightsAvailable.toNumber())}
        </p>
      </section>

      <div className="flex flex-1 flex-col gap-4 px-4 pt-5">
        <div className="rounded-card bg-fill px-4 pt-3.5 pb-1.5" data-testid="assumed-values">
          <h2 className="pb-1.5 text-[0.9375rem] font-semibold">{t("assumedTitle")}</h2>
          <dl className="divide-y divide-line border-t border-line">
            {rows.map((row) => (
              <div key={row.key} className="flex min-h-11 items-center justify-between gap-3">
                <dt className="text-sm text-ink-2">{row.label}</dt>
                <dd className="flex items-center gap-2">
                  <SampleBadge />
                  <span className="text-sm font-semibold">
                    <bdi>{row.value}</bdi>
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        {/* The actions stay in reach while the assumed values scroll under them. */}
        <div className="sticky bottom-0 mt-auto -mx-4 flex flex-col gap-2 bg-page px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <p className="mb-1 text-center text-[0.8125rem] leading-relaxed text-muted">{t("savedNote")}</p>
          <button type="button" onClick={onNext} className="tap h-[3.25rem] rounded-full bg-ink text-[0.9375rem] font-medium text-white">
            {t("continue")}
          </button>
          <button type="button" onClick={onRestart} className="tap h-12 rounded-full bg-fill text-sm font-medium text-ink">
            {t("restart")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CountStep() {
  const t = useTranslations("firstRun");
  const guest = useGuest();
  const router = useRouter();
  const count = guest?.firstRun.count ?? null;
  return (
    <div className="flex flex-1 flex-col gap-5 pt-9">
      <div className="flex flex-col gap-2">
        <p className="text-[0.9375rem] text-white/80">{t("countKicker")}</p>
        <h1 className="text-[1.875rem] leading-snug font-semibold">{t("countTitle")}</h1>
      </div>
      <div role="radiogroup" aria-label={t("countTitle")} className="flex flex-col gap-2.5">
        {APARTMENT_COUNTS.map((c: ApartmentCount) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={count === c}
            onClick={() => {
              setApartmentCount(c);
              // Signed in: the answer also goes to the account's profile (the browser keeps its copy).
              if (readAccount().status === "signed_in") void saveCount(c);
            }}
            className={cn("glass tap min-h-14 rounded-[1.25rem] px-[1.125rem] text-start text-[0.9375rem] font-semibold", count === c && "ring-2 ring-white/90")}
          >
            {t(`counts.${c}`)}
          </button>
        ))}
      </div>
      {count && (
        <div className="mt-auto flex flex-col gap-3.5" data-testid="plan-line">
          <div className="flex flex-col gap-1 text-center">
            <p className="text-base leading-normal font-semibold">{t("planHead")}</p>
            <p className="text-[0.8125rem] leading-relaxed">{count === "1" ? t("planOne") : t("planMore")}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFirstRunSeen();
              writeFirstRunAnswers(null);
              router.replace("/demo/units");
            }}
            className="tap h-[3.25rem] rounded-full bg-white text-[0.9375rem] font-semibold text-navy-900"
          >
            {t("enter")}
          </button>
        </div>
      )}
    </div>
  );
}
