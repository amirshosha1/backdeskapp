import type { ReactNode } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ToastProvider } from "@/components/common/toast";

// BUILD_PLAN.md Phase P: every /demo screen stays out of search results
// until docs/LAUNCH.md's checklist removes this. next.config.ts also sets
// the X-Robots-Tag response header for the same paths.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DemoLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-page">{children}</div>
    </ToastProvider>
  );
}
