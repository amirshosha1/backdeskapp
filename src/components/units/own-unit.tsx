"use client";

import { useState } from "react";
import Decimal from "decimal.js";
import { ChevronLeft, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DataWarning } from "@/components/common/data-warning";
import { UnitGlyph } from "@/components/common/icons";
import { Money } from "@/components/common/money";
import { Percent } from "@/components/common/percent";
import { SampleBadge } from "@/components/common/sample-badge";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { parseCalculatorForm, type CalculatorForm } from "@/lib/calculator/form";
import { breakEvenProgress, computeScenario, displayOccupancy, scenarioView, toMoneyString } from "@/lib/finance";
import { formatTypedAmount } from "@/lib/format/amount";
import { formatMoney } from "@/lib/format/money";
import { formatNights } from "@/lib/format/nights";
import { PrivacyNote, SignInButton } from "@/components/account/sign-in-button";
import { useAccount } from "@/lib/account/store";
import type { AssumedField } from "@/lib/calculator/stored-inputs";
import { ownUnit, useGuest, visibleAssumed, type OwnUnit } from "@/lib/guest/store";
import { cn } from "@/lib/utils";

/**
 * The visitor's own unit on the Units screen (P.2 slice 1), read from this
 * browser. Until the browser's state is read (the page is static), these
 * render fixed-size placeholders so nothing jumps.
 */

/** The hero line: how many units the visitor has, and that the first is free. */
export function OwnUnitsCount() {
  const t = useTranslations("units");
  const guest = useGuest();
  if (guest === null) return <div className="mt-6 h-[4.25rem]" aria-hidden="true" />;
  const count = guest.units.length;
  return (
    <div className="mt-6 flex min-h-[4.25rem] flex-col items-center gap-1 text-center" data-testid="units-hero-count">
      <p className="text-3xl font-semibold tracking-tight">{count === 0 ? t("ownHeroNone") : t("count", { count })}</p>
      {count > 0 && <p className="text-[0.8125rem] text-white/85">{t("firstFree")}</p>}
    </div>
  );
}

export function OwnUnitSection() {
  const guest = useGuest();
  if (guest === null) return <div className="h-[16rem]" aria-hidden="true" />;
  const unit = ownUnit(guest);
  return (
    <div className="flex flex-col gap-3">
      {unit ? <OwnUnitCard unit={unit} /> : <AddFirstUnit />}
      {unit && <AddAnotherUnit />}
    </div>
  );
}

function AddFirstUnit() {
  const t = useTranslations("units");
  return (
    <Link href="/demo/start" className="tap flex min-h-[4.5rem] items-center gap-3 rounded-card bg-fill px-4 py-3 text-start" data-testid="add-first-unit">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-page">
        <Plus className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[0.9375rem] font-semibold">{t("addFirst")}</span>
        <span className="text-xs text-muted">{t("addFirstSub")}</span>
      </span>
    </Link>
  );
}

function AddAnotherUnit() {
  const t = useTranslations("units");
  const account = useAccount();
  const [open, setOpen] = useState(false);
  // With accounts on, a second apartment means signing in (Batch 3); without them, the plans card as before.
  const offerSignIn = account?.status === "guest";
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="add-unit-gate"
        onClick={() => setOpen((v) => !v)}
        className="tap flex min-h-[4.5rem] items-center gap-3 rounded-card bg-fill px-4 py-3 text-start"
        data-testid="add-another-unit"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-page">
          <Plus className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[0.9375rem] font-semibold">{t("addAnother")}</span>
          <span className="text-xs text-muted">{t("addAnotherSub")}</span>
        </span>
      </button>
      {open && offerSignIn && (
        <div id="add-unit-gate" className="flex flex-col gap-3 rounded-card bg-brand-soft p-4" data-testid="add-unit-gate">
          <div className="flex flex-col gap-1">
            <p className="text-[0.9375rem] font-semibold text-navy-900">{t("gateSignInTitle")}</p>
            <p className="text-[0.8125rem] leading-relaxed text-ink-2">{t("gateSignInBody")}</p>
          </div>
          <SignInButton variant="primary" />
          <PrivacyNote />
          <button type="button" onClick={() => setOpen(false)} className="tap h-12 rounded-full bg-page text-sm font-medium text-ink">
            {t("gateLater")}
          </button>
        </div>
      )}
      {open && !offerSignIn && (
        <div id="add-unit-gate" className="flex flex-col gap-3 rounded-card bg-brand-soft p-4" data-testid="add-unit-gate">
          <div className="flex flex-col gap-1">
            <p className="text-[0.9375rem] font-semibold text-navy-900">{t("gateTitle")}</p>
            <p className="text-[0.8125rem] leading-relaxed text-ink-2">{t("gateBody")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/demo/pricing" className="tap flex h-12 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
              {t("gatePlans")}
            </Link>
            <button type="button" onClick={() => setOpen(false)} className="tap h-12 rounded-full bg-page text-sm font-medium text-ink">
              {t("gateLater")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** "العمولة: 20% من صافي المحوّل" from the unit's own commission terms. */
function useCommissionTerms() {
  const t = useTranslations("units");
  const locale = useLocale() as AppLocale;
  return (form: CalculatorForm) =>
    t("commissionTerms", {
      basis: form.commission.basis,
      mode: form.commission.hybridMode,
      hybridBasis: form.commission.hybridBasis,
      rate: `${formatTypedAmount(form.values.commissionPercent, locale)}%`,
      fee: formatMoney(form.values.fixedFee, { locale, decimals: 0 }),
    });
}

function OwnUnitCard({ unit }: { unit: OwnUnit }) {
  const t = useTranslations("units");
  return <UnitSummaryCard title={t("ownTitle")} form={unit.form} assumed={unit.assumed} href="/demo/calculator" testId="own-unit-card" />;
}

export interface UnitSummaryCardProps {
  title: string;
  form: CalculatorForm;
  assumed: readonly AssumedField[];
  href: string;
  testId: string;
  /** Room at the end of the header for a sibling control laid over the card (the account's "تعديل"). */
  reserveEnd?: boolean;
}

/**
 * An apartment's own numbers: the visitor's browser apartment, or one saved
 * to the account. Every figure comes from the engine.
 */
export function UnitSummaryCard({ title, form, assumed, href, testId, reserveEnd }: UnitSummaryCardProps) {
  const t = useTranslations("units");
  const tModel = useTranslations("units.operatingModel");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const commissionTerms = useCommissionTerms();
  const parsed = parseCalculatorForm(form);
  // Stored forms are only kept when they parse; this guards a hand-edited payload.
  if (!parsed.ok) return null;
  const result = computeScenario(parsed.input);
  const view = scenarioView(parsed.input, result);
  const isManaged = form.operatingModel === "managed_for_owner";
  const usesExamples = visibleAssumed(form, [...assumed]).length > 0;
  const booked = new Decimal(parsed.input.bookedNights).toNumber();
  const be = view.breakEven;
  const progress = breakEvenProgress(booked, result.breakEven.includingDepreciation);

  return (
    <Link
      href={href}
      aria-label={t("ownOpen", { name: title, model: tModel(form.operatingModel) })}
      className="tap flex flex-col gap-3 rounded-card bg-fill p-4"
      data-testid={testId}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-page text-ink-2">
          <UnitGlyph model={form.operatingModel} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-base font-semibold">{title}</span>
            {usesExamples && <SampleBadge />}
          </span>
          <span className="text-xs text-muted">{tModel(form.operatingModel)}</span>
        </span>
        {reserveEnd ? (
          <span className="w-16 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronLeft className="h-[1.125rem] w-[1.125rem] shrink-0 text-ink-2 rtl:rotate-180" aria-hidden="true" />
        )}
      </span>

      <span className="grid grid-cols-3 gap-2 rounded-tile bg-page p-3 text-center">
        <span className="flex flex-col gap-1">
          <span className="text-[0.6875rem] text-muted">{t("occupancyLabel")}</span>
          <span className="text-[0.9375rem] font-semibold">
            <Percent ratio={displayOccupancy(result.kpis.occupancy)?.toNumber() ?? 0} decimals={0} />
          </span>
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-[0.6875rem] text-muted">{t("adrLabel")}</span>
          <span className="text-[0.9375rem] font-semibold">
            <Money amount={toMoneyString(result.kpis.adr ?? parsed.input.adr)} decimals={0} hideCurrency />
          </span>
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-[0.6875rem] text-muted">{isManaged ? t("managerProfitLabel") : t("ownNetLabel")}</span>
          <span className="text-[0.9375rem] font-semibold" data-testid="own-unit-profit">
            <Money amount={toMoneyString((isManaged ? view.managerProfit : view.netAfterDepreciation) ?? 0)} decimals={0} hideCurrency colorBySign signDisplay="always" />
          </span>
        </span>
      </span>
      {result.kpis.warnings.length > 0 && <DataWarning message={tCommon("dataWarningOccupancy")} />}

      {isManaged ? (
        <span className="text-xs leading-snug text-muted" data-testid="own-unit-commission">
          {t("commissionBasisLabel", { basis: commissionTerms(form) })}
        </span>
      ) : be.status === "within_month" && progress ? (
        <span className="flex flex-col gap-1.5">
          <span
            role="meter"
            aria-label={t("barLabel")}
            aria-valuemin={0}
            aria-valuemax={be.nights.toNumber()}
            aria-valuenow={Math.min(booked, be.nights.toNumber())}
            aria-valuetext={`${t("nightsBooked", { booked })} · ${t("barBreakEven", { nights: formatNights(be.nights, locale) })}`}
            className="relative h-2 overflow-hidden rounded-full bg-amber-track"
            data-testid="own-unit-bar"
          >
            <span
              className={cn("absolute inset-y-0 start-0 rounded-full", progress.reached ? "bg-profit" : "bg-amber")}
              style={{ width: `${progress.progress.times(100).toNumber()}%` }}
            />
          </span>
          <span className="flex justify-between gap-2 text-xs text-muted">
            <span>{t("nightsBooked", { booked })}</span>
            <span>{t("barBreakEven", { nights: formatNights(be.nights, locale) })}</span>
          </span>
        </span>
      ) : (
        <span className="text-xs text-muted" data-testid="own-unit-bar-text">
          {result.nightsAvailable.lessThanOrEqualTo(0)
            ? t("barNoNights")
            : be.status === "beyond_available_nights"
              ? t("barBeyond", { nights: formatNights(be.nights, locale) })
              : t("barNone")}
        </span>
      )}
    </Link>
  );
}
