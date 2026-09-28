import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ToastButton } from "@/components/common/toast";
import { cn } from "@/lib/utils";

/**
 * Every "buy" action in the prototype goes to the pre-order destination
 * Amir supplies (`NEXT_PUBLIC_PREORDER_URL`, BUILD_PLAN.md §6 question 2).
 * Until it is set, the button explains that pre-orders open soon — never a
 * disabled, silent button.
 */
export function PreorderAction({ children, className }: { children: ReactNode; className?: string }) {
  const tToast = useTranslations("toast");
  const url = process.env.NEXT_PUBLIC_PREORDER_URL;
  const classes = cn("tap flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold", className);

  if (!url) {
    return (
      <ToastButton message={tToast("preorderSoon")} className={classes}>
        {children}
      </ToastButton>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={classes}>
      {children}
    </a>
  );
}
