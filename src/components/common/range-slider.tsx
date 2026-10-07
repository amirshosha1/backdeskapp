"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Where a ratio (0..1) of the range sits on the track, as a CSS length from
 * the reading start. The native thumb is 30px wide and travels between
 * 15px and (100% − 15px), so fills and markers line up with its centre.
 */
export function trackPosition(ratio: number): string {
  const r = Math.min(1, Math.max(0, ratio));
  return `calc(15px + (100% - 30px) * ${r})`;
}

/** A span of the track between two ratios, from the reading start (`inset-inline-start`). */
export function trackSpanStyle(from: number, to: number): CSSProperties {
  const a = Math.min(1, Math.max(0, Math.min(from, to)));
  const b = Math.min(1, Math.max(0, Math.max(from, to)));
  return { insetInlineStart: trackPosition(a), width: `calc((100% - 30px) * ${b - a})` };
}

export interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Read aloud instead of the bare number (e.g. "18 nights"). */
  valueText?: string;
  /** Track, fill and markers drawn under the input (absolutely positioned within the 44px row). */
  children?: ReactNode;
  className?: string;
  testId?: string;
}

/**
 * A native `<input type="range">`, so it is keyboard- and screen-reader-
 * operable and follows the page direction (in Arabic the minimum sits on
 * the right). It is transparent apart from its white thumb; the caller
 * draws the track and fill with `trackSpanStyle`. No physical left/right.
 */
export function RangeSlider({ label, value, min, max, step, onChange, valueText, children, className, testId }: RangeSliderProps) {
  return (
    <div className={cn("relative h-11", className)}>
      {children}
      <input
        type="range"
        className="range-input"
        aria-label={label}
        aria-valuetext={valueText}
        min={min}
        max={max}
        step={step}
        value={value}
        data-testid={testId}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

/** The plain track with a white fill from the reading start to the value. */
export function SliderTrack({ ratio }: { ratio: number }) {
  return (
    <>
      <span aria-hidden="true" className="absolute inset-x-0 top-[19px] h-1.5 rounded-full bg-white/28" />
      <span aria-hidden="true" className="absolute top-[19px] h-1.5 rounded-full bg-white" style={{ insetInlineStart: 0, width: trackPosition(ratio) }} />
    </>
  );
}
