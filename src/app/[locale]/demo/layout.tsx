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
      {/* Desktop: the mobile-first shell stays ~480px wide, centred, with a
          neutral background outside it (BUILD_PLAN.md Phase P.1.1). Below
          480px (the mobile-first baseline) this has no visible effect.
          `translateZ(0)` gives the shell its own containing block, so the
          floating bottom nav's `fixed` positioning tracks the shell's
          width instead of the full viewport. */}
      <div className="flex min-h-dvh justify-center bg-fill-strong">
        <div
          data-testid="app-shell"
          className="relative min-h-dvh w-full max-w-[30rem] bg-page [transform:translateZ(0)]"
        >
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
