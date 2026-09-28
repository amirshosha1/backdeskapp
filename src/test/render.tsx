import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";
import type { AppLocale } from "@/i18n/routing";
import { ToastProvider } from "@/components/common/toast";

const MESSAGES: Record<AppLocale, typeof arMessages> = {
  ar: arMessages,
  en: enMessages as unknown as typeof arMessages,
};

function Providers({ locale, children }: { locale: AppLocale; children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="Africa/Cairo"
      now={new Date("2026-09-26T12:00:00+02:00")}
    >
      <ToastProvider>
        <div dir={locale === "ar" ? "rtl" : "ltr"}>{children}</div>
      </ToastProvider>
    </NextIntlClientProvider>
  );
}

/** Renders a component wrapped in the same intl context the app provides. */
export function renderWithIntl(
  ui: ReactElement,
  { locale = "ar" as AppLocale, ...options }: { locale?: AppLocale } & RenderOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => <Providers locale={locale}>{children}</Providers>,
    ...options,
  });
}
