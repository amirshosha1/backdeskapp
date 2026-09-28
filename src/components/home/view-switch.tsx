"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type HomeView = "owner" | "cohost";

export interface ViewSwitchProps {
  value: HomeView;
  onChange: (view: HomeView) => void;
  label: string;
  options: { value: HomeView; label: string }[];
}

/**
 * Owner / co-host switch on the royal hero: a frosted segmented control,
 * exposed as a radio group (arrow keys move between the two options).
 */
export function ViewSwitch({ value, onChange, label, options }: ViewSwitchProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const next = options[(index + 1) % options.length]!;
    onChange(next.value);
    refs.current[options.indexOf(next)]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="glass flex h-11 rounded-full p-1"
    >
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "tap flex-1 truncate rounded-full px-2 text-[0.8125rem]",
              selected
                ? "bg-white font-semibold text-navy-900 shadow-[0_4px_12px_-6px_rgb(1_8_36/0.6)]"
                : "text-white/75",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
