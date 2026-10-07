"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { RangeSlider, trackPosition, trackSpanStyle } from "@/components/common/range-slider";
import { cn } from "@/lib/utils";

/** A labelled value with − and + buttons (44px each). Limits are the caller's: a tap at a limit says so in a toast. */
export function Stepper({
  label,
  value,
  onDec,
  onInc,
  decLabel,
  incLabel,
  testId,
}: {
  label: string;
  value: ReactNode;
  onDec: () => void;
  onInc: () => void;
  decLabel: string;
  incLabel: string;
  testId?: string;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3" data-testid={testId}>
      <span className="min-w-0 text-[0.9375rem] text-ink-2">{label}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onDec}
          aria-label={decLabel}
          className="tap flex h-11 w-11 items-center justify-center rounded-full bg-page text-ink"
        >
          <Minus className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </button>
        <span className="min-w-[5.25rem] text-center text-[0.9375rem] font-semibold tabular-nums-money" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={onInc}
          aria-label={incLabel}
          className="tap flex h-11 w-11 items-center justify-center rounded-full bg-page text-ink"
        >
          <Plus className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** One section of "كل الأرقام": a header button with the section's total, and its fields when open. */
export function CollapsibleSection({
  title,
  total,
  open,
  onToggle,
  children,
  testId,
}: {
  title: string;
  total?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  testId?: string;
}) {
  const panelId = useId();
  return (
    <section className="rounded-tile bg-fill" data-testid={testId}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="tap flex min-h-14 w-full items-center justify-between gap-3 px-4 text-start"
      >
        <span className="text-[0.9375rem] font-semibold">{title}</span>
        <span className="flex items-center gap-2.5">
          {total && <span className="text-[0.9375rem] font-semibold">{total}</span>}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-page text-ink-2">
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </span>
        </span>
      </button>
      {open && (
        <div id={panelId} className="divide-y divide-line px-4 pb-2">
          {children}
        </div>
      )}
    </section>
  );
}

/**
 * Booked nights on a slider from 0 to the available nights, with the
 * after-depreciation break-even marked on the track: the gap still to cover
 * in amber, the surplus past it in mint. When the break-even is beyond the
 * month or doesn't exist, a text pill says so instead of a marker.
 *
 * Booked nights above the available nights (typed in "كل الأرقام") pin the
 * thumb at the end; the value is never rewritten until the visitor drags.
 */
export function NightsSlider({
  booked,
  available,
  breakEven,
  offPill,
  pill,
  onChange,
  label,
  valueText,
}: {
  booked: number;
  available: number;
  /** Exact break-even nights inside the month, or null. */
  breakEven: number | null;
  /** Shown when there is no in-month marker. */
  offPill: string;
  /** "التعادل عند X ليلة". */
  pill: string;
  onChange: (nights: number) => void;
  label: string;
  valueText: string;
}) {
  const b = available > 0 ? Math.min(booked / available, 1) : 0;
  const e = breakEven !== null && available > 0 ? breakEven / available : null;
  return (
    <div>
      <RangeSlider label={label} valueText={valueText} value={Math.min(booked, available)} min={0} max={available} step={1} onChange={onChange} testId="nights-slider">
        <span aria-hidden="true" className="absolute inset-x-0 top-[19px] h-1.5 rounded-full bg-white/28" />
        <span aria-hidden="true" className="absolute top-[19px] h-1.5 rounded-full bg-white" style={{ insetInlineStart: 0, width: trackPosition(b) }} />
        {e !== null && b < e && <span aria-hidden="true" className="absolute top-[19px] h-1.5 bg-amber-bright" style={trackSpanStyle(b, e)} />}
        {e !== null && b > e && <span aria-hidden="true" className="absolute top-[19px] h-1.5 bg-mint" style={trackSpanStyle(e, b)} />}
        {e !== null && (
          <span
            aria-hidden="true"
            className="absolute top-[11px] -ms-0.5 h-[22px] w-1 rounded-sm bg-amber-soft"
            style={{ insetInlineStart: trackPosition(e) }}
          />
        )}
      </RangeSlider>
      <div className="relative h-6" data-testid="break-even-pill-row">
        {e !== null ? (
          <span
            className="absolute top-0 flex w-0 justify-center"
            style={{ insetInlineStart: `clamp(4.75rem, ${trackPosition(e)}, calc(100% - 4.75rem))` }}
          >
            <span className="rounded-full bg-amber-soft px-2.5 text-xs leading-6 font-semibold whitespace-nowrap text-amber" data-testid="break-even-pill">
              {pill}
            </span>
          </span>
        ) : (
          <span className="absolute start-0 top-0 rounded-full bg-amber-soft px-2.5 text-xs leading-6 font-semibold text-amber" data-testid="break-even-pill">
            {offPill}
          </span>
        )}
      </div>
    </div>
  );
}

/** The three operating-model chips (a radio group: the checked chip is a no-op by design). */
export function ModelChips<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  const t = useTranslations("calculator");
  return (
    <div role="radiogroup" aria-label={t("modelsLabel")} className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.value)}
            className={cn(
              "tap h-11 rounded-full px-1 text-[0.8125rem] font-medium",
              checked ? "bg-royal-600 text-white" : "bg-fill text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
