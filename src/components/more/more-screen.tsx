"use client";

import { useState } from "react";
import { Info, Languages, MessageCircle, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ListRow } from "@/components/common/list-row";
import { Sheet } from "@/components/common/sheet";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

const ROW = "flex w-full items-center gap-3 py-4 text-start";

export function MoreScreen() {
  const t = useTranslations("more");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [aboutOpen, setAboutOpen] = useState(false);
  const feedbackNumber = process.env.NEXT_PUBLIC_FEEDBACK_WHATSAPP;

  return (
    <div>
      <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>} />

      <div className="divide-y divide-line px-4 pt-2">
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
          onClick={() => router.replace(pathname, { locale: locale === "ar" ? "en" : "ar" })}
          className={`tap ${ROW}`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2">
            <Languages className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{t("language")}</span>
          <span className="text-sm text-brand">{t("languageValue")}</span>
        </button>

        <button type="button" onClick={() => setAboutOpen(true)} className={`tap ${ROW}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2">
            <Info className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{t("about")}</span>
        </button>

        {feedbackNumber && (
          <a href={`https://wa.me/${feedbackNumber}`} target="_blank" rel="noopener noreferrer" className={`tap ${ROW}`}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-profit-soft text-profit">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{t("feedback")}</span>
          </a>
        )}
      </div>

      <Sheet open={aboutOpen} onOpenChange={setAboutOpen} title={t("about")} description={t("aboutBody")} />
    </div>
  );
}
