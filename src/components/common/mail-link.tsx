"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/sheet";
import { SUPPORT_EMAIL } from "@/lib/contact";

/** How long to wait for a mail app to take over before showing the address instead. */
export const MAIL_FALLBACK_MS = 1500;

/**
 * A mailto: link. Inside in-app browsers (and on devices with no mail app)
 * a mailto: link often does nothing; when the page is still in front after
 * a moment, a small sheet shows the address with a copy button instead, so
 * a tap is never silent. If a mail app does open, the page loses focus or
 * is hidden and nothing extra appears.
 */
export function MailLink({ href, className, children, testId }: { href: string; className?: string; children: ReactNode; testId?: string }) {
  const [fallback, setFallback] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const left = useRef(false);

  useEffect(() => {
    const away = () => {
      left.current = true;
    };
    const hidden = () => document.visibilityState === "hidden" && away();
    window.addEventListener("blur", away);
    window.addEventListener("pagehide", away);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", away);
      window.removeEventListener("pagehide", away);
      document.removeEventListener("visibilitychange", hidden);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onClick() {
    left.current = false;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!left.current) setFallback(true);
    }, MAIL_FALLBACK_MS);
  }

  return (
    <>
      <a href={href} onClick={onClick} className={className} data-testid={testId}>
        {children}
      </a>
      <MailFallbackSheet open={fallback} onOpenChange={setFallback} />
    </>
  );
}

function MailFallbackSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("contact");
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const field = useRef<HTMLInputElement>(null);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      return setCopy("copied");
    } catch {
      // Clipboard API blocked (some in-app browsers): fall back to the selected field.
    }
    try {
      field.current?.select();
      setCopy(document.execCommand("copy") ? "copied" : "failed");
    } catch {
      setCopy("failed");
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setCopy("idle");
        onOpenChange(next);
      }}
      title={t("fallbackTitle")}
      description={t("fallbackBody")}
    >
      <div className="flex flex-col gap-3" data-testid="mail-fallback">
        <input
          ref={field}
          readOnly
          dir="ltr"
          value={SUPPORT_EMAIL}
          aria-label={t("addressLabel")}
          onFocus={(e) => e.currentTarget.select()}
          className="h-12 rounded-tile bg-fill px-3 text-start text-[0.9375rem] text-ink"
        />
        <button type="button" onClick={copyAddress} className="tap flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-white" data-testid="mail-copy">
          <Copy className="h-4 w-4" aria-hidden="true" />
          {t("copy")}
        </button>
        <p aria-live="polite" className="min-h-5 text-center text-sm text-ink-2" data-testid="mail-copy-status">
          {copy === "copied" ? t("copied") : copy === "failed" ? t("copyFailed") : ""}
        </p>
      </div>
    </Sheet>
  );
}
