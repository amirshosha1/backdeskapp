"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { needsFirstRun, useGuest } from "@/lib/guest/store";

/**
 * On the app entry (Home): a visitor who has not seen the first-run flow,
 * and has no unit yet, is sent to it. Returning visitors never see it again.
 * A first full page load is redirected earlier, by the inline script.
 */
export function FirstRunGate() {
  const guest = useGuest();
  const router = useRouter();
  useEffect(() => {
    if (guest && needsFirstRun(guest)) router.replace("/demo/start");
  }, [guest, router]);
  return null;
}
