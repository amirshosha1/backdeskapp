"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
}

/** A bottom sheet (Radix Dialog: focus trap, Escape and backdrop close it). */
export function Sheet({ open, onOpenChange, title, description, children }: SheetProps) {
  const t = useTranslations("common");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-navy-950/40" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-[var(--radius-hero)] bg-page px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl focus:outline-none"
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-fill-strong" aria-hidden="true" />
          <div className="mb-4 flex items-center justify-between gap-2">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            <Dialog.Close
              aria-label={t("close")}
              className="tap flex h-10 w-10 items-center justify-center rounded-full bg-fill text-ink-2"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description className="mb-4 text-sm leading-relaxed text-muted">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
