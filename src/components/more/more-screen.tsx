"use client";

import { useState } from "react";
import { Info, Languages, LogOut, MessageCircle, RotateCcw, ShieldCheck, Tag, Trash2, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DeleteAccountSheet } from "@/components/account/delete-account-sheet";
import { SignInButton } from "@/components/account/sign-in-button";
import { MailLink } from "@/components/common/mail-link";
import { ListRow } from "@/components/common/list-row";
import { Sheet } from "@/components/common/sheet";
import { useToast } from "@/components/common/toast";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { signOut, useAccount } from "@/lib/account/store";
import { writeFirstRunAnswers } from "@/lib/guest/first-run-answers";
import { ownUnit, useGuest } from "@/lib/guest/store";
import { FEEDBACK_SUBJECT, SUPPORT_EMAIL, supportMailto } from "@/lib/contact";

const ROW = "flex w-full items-center gap-3 py-4 text-start";

export function MoreScreen() {
  const t = useTranslations("more");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const tCommon = useTranslations("common");
  const tAccount = useTranslations("account");
  const { show } = useToast();
  const guest = useGuest();
  const account = useAccount();
  const signedIn = account?.status === "signed_in" ? account : null;
  const [aboutOpen, setAboutOpen] = useState(false);
  const [rerunOpen, setRerunOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function startFirstRun() {
    writeFirstRunAnswers(null);
    router.push("/demo/start");
  }
  const feedbackUrl = supportMailto(FEEDBACK_SUBJECT, tCommon("feedbackPrefill", { path: pathname }));

  return (
    <div>
      <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>} />

      <div className="divide-y divide-line px-4 pt-2">
        {account?.status === "guest" && <SignInButton variant="row" />}
        {signedIn && (
          <ListRow
            tone="brand"
            icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
            title={tAccount("signedIn")}
            subtitle={signedIn.email ? <bdi dir="ltr">{signedIn.email}</bdi> : undefined}
            className="py-4"
          />
        )}

        <ListRow
          href="/demo/pricing"
          tone="brand"
          icon={<Tag className="h-5 w-5" aria-hidden="true" />}
          title={t("pricing")}
          className="py-4"
        />

        <button
          type="button"
          data-testid="more-language"
          onClick={() => {
            const search = typeof window !== "undefined" ? window.location.search : "";
            router.replace(`${pathname}${search}`, { locale: locale === "ar" ? "en" : "ar" });
          }}
          className={`tap ${ROW}`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2">
            <Languages className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{t("language")}</span>
          <span className="text-sm text-brand">{t("languageValue")}</span>
        </button>

        <button
          type="button"
          data-testid="more-rerun"
          // With a saved unit (or an account), ask first: say what happens to the numbers.
          onClick={() => (ownUnit(guest) || signedIn ? setRerunOpen(true) : startFirstRun())}
          className={`tap ${ROW}`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2">
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{t("rerun")}</span>
        </button>

        <button type="button" onClick={() => setAboutOpen(true)} className={`tap ${ROW}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2">
            <Info className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{t("about")}</span>
        </button>

        <MailLink href={feedbackUrl} testId="more-feedback" className={`tap ${ROW}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-profit-soft text-profit">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[0.9375rem] font-medium">{t("feedback")}</span>
            <span className="text-xs text-muted" dir="ltr">
              {SUPPORT_EMAIL}
            </span>
          </span>
        </MailLink>

        <ListRow href="/privacy" icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />} title={tAccount("privacy")} className="py-4" />

        {signedIn && (
          <>
            <button
              type="button"
              data-testid="sign-out"
              onClick={async () => {
                await signOut();
                show(tAccount("signedOut"));
              }}
              className={`tap ${ROW}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2">
                <LogOut className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{tAccount("signOut")}</span>
            </button>
            <button type="button" data-testid="delete-account" onClick={() => setDeleteOpen(true)} className={`tap ${ROW}`}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-loss-soft text-loss">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-[0.9375rem] font-medium text-loss">{tAccount("deleteAccount")}</span>
            </button>
          </>
        )}
      </div>

      <Sheet open={aboutOpen} onOpenChange={setAboutOpen} title={t("about")} description={t("aboutBody")} />
      <Sheet open={rerunOpen} onOpenChange={setRerunOpen} title={t("rerunTitle")} description={signedIn ? t("rerunBodyAccount") : t("rerunBody")}>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={startFirstRun} className="tap h-12 rounded-full bg-ink text-sm font-medium text-white">
            {t("rerunConfirm")}
          </button>
          <button type="button" onClick={() => setRerunOpen(false)} className="tap h-12 rounded-full bg-fill text-sm font-medium">
            {tCommon("cancel")}
          </button>
        </div>
      </Sheet>
      <DeleteAccountSheet open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
