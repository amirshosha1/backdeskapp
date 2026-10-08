"use client";

import { useRef, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/sheet";
import { chromeIntentUrl, type Platform } from "@/lib/browser/in-app";

/**
 * Sign-in inside Facebook's, Messenger's or Instagram's browser: Google
 * refuses it (403 disallowed_useragent), so instead of trying, this sheet
 * explains why and helps open the same page in the phone's real browser.
 * Android gets a Chrome intent link; iOS can't be opened programmatically,
 * so it gets the steps. Copy-link works on both. Using Backdesk without an
 * account keeps working where they are.
 */
export function InAppSheet({ open, onOpenChange, platform }: { open: boolean; onOpenChange: (open: boolean) => void; platform: Platform }) {
  const t = useTranslations("account.inApp");
  const tCommon = useTranslations("common");
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const input = useRef<HTMLInputElement>(null);
  const url = typeof window === "undefined" ? "" : window.location.href;
  const intent = platform === "android" ? chromeIntentUrl(url) : null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopy("copied");
      return;
    } catch {
      // Some in-app browsers block the clipboard API; fall back to the selected field.
    }
    try {
      input.current?.select();
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
      title={t("title")}
      description={t("body")}
    >
      <div className="flex flex-col gap-3" data-testid="in-app-sheet">
        {intent && (
          <a href={intent} className="tap flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-white" data-testid="in-app-open-chrome">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {t("openChrome")}
          </a>
        )}
        <p className="text-[0.8125rem] leading-relaxed text-ink-2">{platform === "android" ? t("androidSteps") : t("iosSteps")}</p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">{t("linkLabel")}</span>
          <input
            ref={input}
            readOnly
            dir="ltr"
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 rounded-tile bg-fill px-3 text-start text-sm text-ink"
          />
        </label>
        <button type="button" onClick={copyLink} className="tap flex h-12 items-center justify-center gap-2 rounded-full bg-fill text-sm font-medium text-ink" data-testid="in-app-copy">
          <Copy className="h-4 w-4" aria-hidden="true" />
          {t("copy")}
        </button>
        <p aria-live="polite" className="min-h-5 text-center text-xs text-ink-2">
          {copy === "copied" ? t("copied") : copy === "failed" ? t("copyFailed") : ""}
        </p>
        <p className="text-center text-xs text-muted">{t("guestNote")}</p>
        <button type="button" onClick={() => onOpenChange(false)} className="tap h-12 rounded-full bg-page text-sm font-medium text-ink">
          {tCommon("close")}
        </button>
      </div>
    </Sheet>
  );
}
