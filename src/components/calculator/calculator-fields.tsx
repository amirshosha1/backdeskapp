"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { formatTypedAmount } from "@/lib/format/amount";
import type { AppLocale } from "@/i18n/routing";
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
  onCommit,
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
  /**
   * The visitor committed the field — focused it, then left it or pressed
   * Enter — even without changing the value. Clears its تجريبي tag.
   */
  onCommit?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  hint?: ReactNode;
  error?: string;
  sample?: boolean;
}) {
  const locale = useLocale() as AppLocale;
  // Raw digits while typing; thousands separators once the field loses focus.
  const [focused, setFocused] = useState(false);
  // Tab focus selects the whole formatted value; swapping in the raw digits
  // drops that selection, so typing would append ("2,450" + "3000" →
  // "24503000"). Re-select the raw value before the next keystroke.
  const inputRef = useRef<HTMLInputElement>(null);
  const reselect = useRef(false);
  useLayoutEffect(() => {
    if (focused && reselect.current) inputRef.current?.select();
    reselect.current = false;
  }, [focused]);
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
            value={focused ? value : formatTypedAmount(value, locale)}
            ref={inputRef}
            onFocus={(event) => {
              const input = event.currentTarget;
              reselect.current = input.value !== "" && input.selectionStart === 0 && input.selectionEnd === input.value.length;
              setFocused(true);
            }}
            onBlur={() => {
              setFocused(false);
              onCommit?.();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
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
  onCommit,
  sample,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** Leaving the select counts as committing its value (see NumberFieldRow). */
  onCommit?: () => void;
  sample?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-3">
      <label htmlFor={id} className="min-w-0 flex-1 text-sm leading-snug text-ink-2">
        {label}
      </label>
      {sample && <SampleBadge />}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        onBlur={() => onCommit?.()}
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
  onPage,
  className,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** On the white page (not inside a grey card): unselected chips take the grey fill so they read as buttons. */
  onPage?: boolean;
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
              "tap min-h-11 rounded-full px-4 py-2 text-sm font-medium",
              checked ? "bg-brand text-white" : onPage ? "bg-fill text-ink" : "bg-page text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
