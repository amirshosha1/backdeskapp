"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "No silent taps" (Phase P.1): anything a user can tap either works or
 * says, in a short message, that it arrives in the full version. The
 * message is announced to screen readers through a polite live region.
 */

const TOAST_MS = 2800;

type ToastContextValue = { show: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [seq, setSeq] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((next: string) => {
    setMessage(next);
    setSeq((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!message) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), TOAST_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [message, seq]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-50 flex justify-center"
      >
        {message && (
          <p
            key={seq}
            data-testid="toast"
            className="flex max-w-full items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
          >
            <Info className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
            <span>{message}</span>
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // Outside a provider (isolated component tests) a toast is a no-op.
  return ctx ?? { show: () => {} };
}

export interface ToastButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  message: string;
}

/** A button whose only job, for now, is to explain what it will do later. */
export function ToastButton({ message, className, type = "button", ...props }: ToastButtonProps) {
  const { show } = useToast();
  return (
    <button
      type={type}
      data-coming-soon=""
      onClick={() => show(message)}
      className={cn("tap", className)}
      {...props}
    />
  );
}
