import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataWarningProps {
  message: string;
  className?: string;
}

/** A visible data warning — used when occupancy exceeds 100% (never a silent clamp). */
export function DataWarning({ message, className }: DataWarningProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md bg-warning-foreground p-3 text-sm text-warning",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
