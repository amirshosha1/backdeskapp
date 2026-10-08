"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/sheet";
import { useToast } from "@/components/common/toast";
import { deleteAccount } from "@/lib/account/store";
import type { AccountError } from "@/lib/account/errors";

/** "احذف حسابي وبياناتي": one confirmation, then delete_my_account and sign-out. */
export function DeleteAccountSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AccountError | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const result = await deleteAccount();
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onOpenChange(false);
    show(t("deleted"));
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        if (!next) setError(null);
        onOpenChange(next);
      }}
      title={t("deleteTitle")}
      description={t("deleteBody")}
    >
      {error && (
        <p role="alert" className="mb-3 rounded-tile bg-loss-soft px-3 py-2 text-[0.8125rem] leading-relaxed text-loss">
          {t(`errors.${error}`)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={confirm} aria-busy={busy} className="tap h-12 rounded-full bg-loss text-sm font-medium text-white" data-testid="delete-account-confirm">
          {busy ? t("deleting") : t("deleteConfirm")}
        </button>
        <button type="button" onClick={() => !busy && onOpenChange(false)} className="tap h-12 rounded-full bg-fill text-sm font-medium">
          {tCommon("cancel")}
        </button>
      </div>
    </Sheet>
  );
}
