"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useGoogleSignIn } from "@/components/account/sign-in-button";
import { useAccount } from "@/lib/account/store";
import { FeedbackLink } from "./feedback-button";
import { cn } from "@/lib/utils";

/**
 * The line at the top of every `/demo` screen, with the "رأيك؟" feedback
 * link beside it. One rule everywhere (hotfix, 2026-10-09):
 *
 * - a visitor: "محفوظ على هذا الجهاز · سجّل الدخول لتحفظه في حسابك",
 *   tappable to sign in (without accounts configured, only the first half);
 * - signed in: no text;
 * - until it is known whether the person is signed in: the same height,
 *   empty, so nothing is shown wrongly.
 */
export function DemoBanner({ onHero, trailing }: { onHero?: boolean; trailing?: ReactNode }) {
  const t = useTranslations("common");
  const account = useAccount();

  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1 pt-[calc(0.375rem+env(safe-area-inset-top))] pb-1 text-[0.6875rem] tracking-wide",
        onHero ? "text-white/65" : "text-muted",
      )}
    >
      {account?.status === "guest" ? (
        <GuestSignIn onHero={onHero} />
      ) : account?.status === "off" ? (
        <span data-testid="device-banner">{t("bannerDevice")}</span>
      ) : account === null || account.status === "loading" ? (
        <span className="invisible" aria-hidden="true">
          {t("bannerDevice")}
        </span>
      ) : null}
      {trailing}
      <FeedbackLink onHero={onHero} />
    </p>
  );
}

function GuestSignIn({ onHero }: { onHero?: boolean }) {
  const t = useTranslations("common");
  const tAccount = useTranslations("account");
  const { busy, start, sheet } = useGoogleSignIn();
  return (
    <>
      <button
        type="button"
        onClick={start}
        aria-busy={busy}
        className={cn("tap min-h-6 underline-offset-2 hover:underline", onHero ? "text-white/80" : "text-ink-2")}
        data-testid="guest-banner"
      >
        {busy ? tAccount("signingIn") : t("bannerGuest")}
      </button>
      {sheet}
    </>
  );
}
