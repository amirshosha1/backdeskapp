"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-surface-muted", className)}
    {...props}
  >
    {/*
      A plain block-level width fill, not the common `translateX` hack:
      `transform` moves along the physical X axis regardless of `dir`, but a
      block box's own width naturally grows from its inline-start edge —
      the right in RTL, the left in LTR — so this stays correct in both
      directions without any manual flipping (CLAUDE.md §7).
    */}
    <ProgressPrimitive.Indicator
      className="h-full bg-primary transition-[width]"
      style={{ width: `${value ?? 0}%` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
