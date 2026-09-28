import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

/** A calm, centred "nothing here yet" state with an optional next step. */
export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {body && <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}
