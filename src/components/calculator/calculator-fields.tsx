"use client";

import type { ReactNode } from "react";
import { SampleBadge } from "@/components/common/sample-badge";
import { cn } from "@/lib/utils";

/**
 * Inputs for the live calculator. Numbers are typed into plain text inputs
 * with the phone's decimal keypad (`inputMode="decimal"`, CLAUDE.md §7) and
 * parsed by `parseAmount` (src/lib/format/amount.ts), so Arabic-Indic
 * digits and Arabic separators work.
 *
 * The box is laid out left-to-right in both languages so the number itself
 * never reorders; `left`/`right` adornments carry the unit: the currency on
 * the left (as <Money /> shows it), "%" on the right, and a word such as
 * "ليلة" on whichever side the language reads it.
 */
export function NumberFieldRow({
  id,
  label,
  value,
  onChange,
  left,
  right,
  hint,
  error,
  sample,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  left?: ReactNode;
  right?: ReactNode;
  hint?: ReactNode;
  error?: string;
  sample?: boolean;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="py-3">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="min-w-0 flex-1 text-sm leading-snug text-ink-2">
          {label}
        </label>
        {sample && <SampleBadge />}
        <div
          dir="ltr"
          className={cn(
            "flex h-11 w-[8.5rem] shrink-0 items-center gap-1.5 rounded-xl bg-page px-3 text-sm",
            error && "ring-2 ring-loss",
          )}
        >
          {left && <span className="shrink-0 text-xs text-muted">{left}</span>}
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
            // Permissive on purpose: `parseAmount` is the one place that
            // normalizes and validates what was typed.
            onChange={(event) => onChange(event.target.value.replace(/[^0-9٠-٩۰-۹.,٫٬-]/g, ""))}
            className="tabular-nums-money min-w-0 flex-1 bg-transparent text-end font-semibold outline-none"
          />
          {right && <span className="shrink-0 text-xs text-muted">{right}</span>}
        </div>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-loss">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SelectRow<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-3">
      <label htmlFor={id} className="min-w-0 flex-1 text-sm leading-snug text-ink-2">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-11 max-w-[60%] shrink-0 rounded-xl bg-page px-3 text-sm font-medium"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-2 py-3 text-start text-sm"
    >
      <span className="min-w-0 flex-1 leading-snug text-ink-2">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-fill-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start]",
            checked ? "start-6" : "start-1",
          )}
        />
      </span>
    </button>
  );
}

/** A row of mutually exclusive choices (WAI-ARIA radio group); the checked one is a no-op by design. */
export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
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
              "tap min-h-10 rounded-full px-4 py-2 text-sm font-medium",
              checked ? "bg-brand text-white" : "bg-page text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
