"use client";

import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/common/toast";
import { Link } from "@/i18n/navigation";
import { signInWithGoogle } from "@/lib/account/store";
import { detectInAppBrowser, type Platform } from "@/lib/browser/in-app";
import { InAppSheet } from "./in-app-sheet";

const ROW = "flex w-full items-center gap-3 py-4 text-start";

function inAppHere(): { inApp: boolean; platform: Platform } {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches === true || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return detectInAppBrowser(navigator.userAgent, { standalone });
}

/**
 * Every Google sign-in button. Inside an in-app browser (Facebook,
 * Messenger, Instagram…) it opens the "open in your browser" sheet instead
 * of starting a sign-in Google would refuse. Otherwise it leaves for Google
 * and comes back to this page (src/lib/account/store.ts).
 */
export function SignInButton({ variant, title }: { variant: "row" | "primary"; title?: string }) {
  const t = useTranslations("account");
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [inApp, setInApp] = useState<Platform | null>(null);

  // Coming back with the browser's back button restores this page from memory: un-stick the button.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && setBusy(false);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  async function start() {
    const here = inAppHere();
    if (here.inApp) return setInApp(here.platform);
    setBusy(true);
    const result = await signInWithGoogle(window.location.pathname);
    if (!result.ok) {
      setBusy(false);
      show(t(`errors.${result.error}`));
    }
  }

  const label = busy ? t("signingIn") : (title ?? t("signIn"));

  return (
    <>
      {variant === "row" ? (
        <button type="button" onClick={start} aria-busy={busy} className={`tap ${ROW}`} data-testid="sign-in">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <LogIn className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[0.9375rem] font-medium">{label}</span>
            <span className="text-xs text-muted">{t("signInSub")}</span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          aria-busy={busy}
          className="tap flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white"
          data-testid="sign-in"
        >
          <LogIn className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {label}
        </button>
      )}
      <InAppSheet open={inApp !== null} onOpenChange={(open) => !open && setInApp(null)} platform={inApp ?? "other"} />
    </>
  );
}

/** "By continuing you agree to the privacy policy", under a sign-in button. */
export function PrivacyNote({ className }: { className?: string }) {
  const t = useTranslations("account");
  return (
    <p className={className ?? "text-center text-xs leading-relaxed text-muted"}>
      {t.rich("privacyNote", {
        link: (chunks) => (
          <Link href="/privacy" className="font-medium text-brand underline underline-offset-2">
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
