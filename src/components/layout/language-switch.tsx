"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Switches between Arabic and English and stays on the same screen. The
 * URL is the only source of the language (src/i18n/routing.ts), so this is
 * a plain navigation between `/demo/...` and `/en/demo/...`.
 */
export function LanguageSwitch({ tone = "glass", className }: { tone?: "glass" | "soft"; className?: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const next: AppLocale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      lang={next}
      aria-label={t("switchLanguage")}
      data-testid="language-switch"
      disabled={pending}
      onClick={() => startTransition(() => router.replace(pathname, { locale: next }))}
      className={cn(
        "tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        tone === "glass" ? "glass text-white" : "bg-fill text-ink",
        className,
      )}
    >
      {next === "en" ? "EN" : "ع"}
    </button>
  );
}
