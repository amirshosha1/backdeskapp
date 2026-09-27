import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { BOTTOM_NAV_CLEARANCE } from "@/components/layout/constants";

/**
 * Tab screens: content plus the floating navigation pill. The bottom
 * padding reserves the pill's full height and offset (and the iPhone home
 * bar), so the last content is never hidden when scrolled to the end.
 */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}>{children}</main>
      <BottomNav />
    </>
  );
}
