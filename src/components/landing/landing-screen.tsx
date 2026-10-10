import type { ReactNode } from "react";
import { Calculator, CalendarDays, CircleHelp, House } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { BrandMark } from "@/components/common/brand-mark";
import { ExampleChip } from "@/components/common/example-chip";
import { HeroFigure } from "@/components/common/hero-figure";
import type { AppLocale } from "@/i18n/routing";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/contact";
import { flowSentence } from "@/lib/first-run/sentence";
import { formatMoney } from "@/lib/format/money";
import type { LandingExample } from "@/lib/landing/example";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: "1", Icon: CircleHelp },
  { number: "2", Icon: House },
  { number: "3", Icon: CalendarDays },
  { number: "4", Icon: Calculator },
] as const;

/** Paths for this page's language: Arabic has no prefix, English lives under /en. */
export function landingPaths(locale: AppLocale) {
  const prefix = locale === "en" ? "/en" : "";
  return {
    start: `${prefix}/demo/start?from=landing`,
    privacy: `${prefix}/privacy`,
    otherLanguage: locale === "en" ? "/" : "/en",
  };
}

/**
 * The public landing page (/, /en; Batch 4): one phone screen that asks
 * the verdict's question, shows the engine's answer for a named example
 * and starts the first-run flow; below it, how it works and a footer with
 * the privacy policy and the support address. It sells only what works
 * today: the free verdict, no account needed.
 *
 * A server component with no client code at all: every link is a plain
 * <a> (it works in any in-app browser, even if JavaScript fails), the
 * figures are computed at build time, and the two analytics events are a
 * small inline script (src/lib/analytics/landing-events-script.ts). No top
 * line (that is for /demo screens); the example carries the standard
 * "مثال · أرقام توضيحية" chip. `tnum` on the root keeps every number on
 * the page tabular.
 */
export function LandingScreen({ example }: { example: LandingExample }) {
  const t = useTranslations("landing");
  const tFirstRun = useTranslations("firstRun");
  const tCalc = useTranslations("calculator");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const paths = landingPaths(locale);
  const other: AppLocale = locale === "ar" ? "en" : "ar";
  const money = (raw: string) => formatMoney(raw, { locale, decimals: 0 });
  const sentence = flowSentence(example.sentence, example.bookedNights, example.availableNights, locale);
  const wordmark = t.rich("wordmark", {
    latin: (chunks: ReactNode) => (
      <span lang="en" dir="ltr">
        {chunks}
      </span>
    ),
    arabic: (chunks: ReactNode) => (
      <span lang="ar" dir="rtl">
        {chunks}
      </span>
    ),
  });

  return (
    <div className="tnum flex min-h-dvh justify-center bg-fill-strong" data-testid="landing">
      <div className="flex min-h-dvh w-full max-w-[30rem] flex-col bg-page">
        <main className="flex flex-col">
          <div className="royal-hero flex flex-col gap-4 rounded-b-[var(--radius-hero)] px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-5 text-white">
            <header className="flex min-h-11 items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-[0.9375rem] font-semibold" data-testid="landing-wordmark">
                <span className="glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full" aria-hidden="true">
                  <BrandMark />
                </span>
                <span className="truncate">{wordmark}</span>
              </p>
              <a
                href={paths.otherLanguage}
                hrefLang={other}
                lang={other}
                aria-label={tCommon("switchLanguage")}
                className="tap glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                data-testid="landing-language"
              >
                {other === "en" ? "EN" : "ع"}
              </a>
            </header>

            <div className="flex flex-col gap-1.5 text-center">
              <h1 className="text-[1.875rem] leading-tight font-bold">{t("headline")}</h1>
              <p className="text-[0.8125rem] leading-relaxed text-white/80">{t("subline")}</p>
            </div>

            <section aria-label={tCommon("exampleChip")} className="glass flex flex-col items-center gap-0.5 rounded-card px-4 pt-3 pb-3.5 text-center" data-testid="landing-example">
              <ExampleChip onDark compact />
              <p className="mt-1.5 text-[0.8125rem] font-semibold">{t("cardTitle", { model: example.model, area: example.area[locale] })}</p>
              <p className="text-xs text-white/75" data-testid="landing-inputs">
                {t("cardInputs", { adr: money(example.adr), booked: example.bookedNights, available: example.availableNights, rent: money(example.rent) })}
              </p>
              <p className="mt-2 text-xs text-white/80">{tCalc("heroLabel", { owner: "no" })}</p>
              <p className={cn("text-[1.625rem] leading-snug font-bold", example.outcome === "profit" ? "text-hero-profit" : "text-hero-loss")} data-testid="landing-verdict">
                {tFirstRun("verdictWord", { outcome: example.outcome, owner: "no" })}
              </p>
              <HeroFigure amount={example.net} decimals={0} size="sm" />
              <p className="text-xs text-white/75">{tFirstRun("perMonth")}</p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed font-semibold" data-testid="landing-sentence">
                {tFirstRun(sentence.key, sentence.values)}
              </p>
            </section>

            <div className="flex flex-col items-center gap-1.5">
              <a
                href={paths.start}
                data-cta=""
                className="tap flex min-h-13 w-full items-center justify-center rounded-full bg-white px-5 text-base font-semibold text-royal-700 shadow-[0_12px_28px_-14px_rgb(1_8_36/0.7)]"
                data-testid="landing-cta"
              >
                {t("cta")}
              </a>
              <p className="text-xs text-white/80">{t("ctaNote")}</p>
            </div>
          </div>

          <section aria-labelledby="landing-how" className="flex flex-col gap-3 px-4 pt-7" data-testid="landing-how">
            <h2 id="landing-how" className="text-lg font-semibold">
              {t("howTitle")}
            </h2>
            <ol className="flex flex-col gap-3">
              {STEPS.map(({ number, Icon }) => (
                <li key={number} className="landing-step-card flex min-h-28 items-center gap-4 rounded-card p-4">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs font-medium text-white/50">
                      {t("station", { number })}
                    </p>
                    <h3 className="text-base font-semibold text-white">{t(`steps.${number}.title`)}</h3>
                    <p className="mt-1 text-sm leading-relaxed font-normal text-white/70">{t(`steps.${number}.description`)}</p>
                  </div>
                  <Icon className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
                </li>
              ))}
            </ol>
            <p className="text-[0.8125rem] leading-relaxed text-white/50">{t("ownerNote")}</p>
          </section>
        </main>

        <footer className="mt-auto flex flex-col items-center gap-1 px-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center text-sm text-ink-2" data-testid="landing-footer">
          <p className="font-semibold text-ink">{wordmark}</p>
          <a href={paths.privacy} className="tap inline-flex min-h-11 items-center font-medium text-brand underline underline-offset-2" data-testid="landing-privacy">
            {t("privacy")}
          </a>
          <p className="flex flex-wrap items-center justify-center gap-x-1.5">
            <span>{t("contact")}</span>
            <a href={supportMailto()} className="tap inline-flex min-h-11 items-center font-medium text-brand underline underline-offset-2" data-testid="landing-contact">
              <span lang="en" dir="ltr">
                {SUPPORT_EMAIL}
              </span>
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
