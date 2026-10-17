"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/sheet";
import { useToast } from "@/components/common/toast";
import { usePathname } from "@/i18n/navigation";
import type { AccountError } from "@/lib/account/errors";
import { addUnit, adoptBrowserUnit, readAccount, saveCount, takeFlash, useAccount } from "@/lib/account/store";
import { clearOwnUnit, ownUnit, readGuest, useGuest } from "@/lib/guest/store";
import { LimitNotice } from "./limit-notice";

/**
 * Runs on every /demo screen once someone is signed in:
 *   - the one-shot "sign-in didn't complete" notice from the callback;
 *   - moving this browser's apartment into the account (decided
 *     2026-10-08): added automatically to an empty account, cleared when the
 *     account already has the same numbers, otherwise one sheet asks;
 *   - copying the browser's apartment-count answer when the profile has none.
 * Not during the first-run flow: the browser copy is only complete when the
 * flow ends.
 */

// Per page load: one attempt at a time, and a closed sheet stays closed until Units opens again.
let adopting = false;
let adoptionStartedForUserId: string | null = null;
let dismissedUserId: string | null = null;
let countTriedUserId: string | null = null;

/** Units calls this on mount: a sheet closed earlier asks again there. */
export function resetAdoptionDismissal(): void {
  dismissedUserId = null;
}

/** Serialises the move across this browser's open tabs (they share the browser copy). */
function withTabLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
  return locks?.request ? (locks.request("backdesk-adopt-guest-unit", fn) as Promise<T>) : fn();
}

export function AccountSync() {
  const t = useTranslations("account");
  const { show } = useToast();
  const account = useAccount();
  const guest = useGuest();
  const pathname = usePathname();
  const [askingForUserId, setAskingForUserId] = useState<string | null>(null);
  const [dismissedCurrent, setDismissedCurrent] = useState<string | null>(null);
  const signedIn = account?.status === "signed_in";
  const userId = signedIn ? account.userId : null;
  const hasBrowserUnit = ownUnit(guest) !== null;
  const inFlow = pathname === "/demo/start";
  const mustAskForSwitch = Boolean(userId && adoptionStartedForUserId && adoptionStartedForUserId !== userId);

  useEffect(() => {
    if (takeFlash() === "signin_failed") show(t("signInFailed"));
  }, [show, t]);

  useEffect(() => {
    if (!userId || !hasBrowserUnit || inFlow || dismissedUserId === userId || askingForUserId === userId || mustAskForSwitch) return;
    if (adopting) return;
    adopting = true;
    adoptionStartedForUserId = userId;
    void withTabLock(async () => {
      // Another tab may have moved it while this one waited.
      const unit = ownUnit(readGuest());
      const current = readAccount();
      if (!unit || current.status !== "signed_in" || current.userId !== userId) return;
      const result = await adoptBrowserUnit(t("firstUnitName"), { form: unit.form, assumed: unit.assumed });
      if (!result.ok) return; // Left in the browser; tried again on the next page load.
      if (result.data.outcome === "added") {
        clearOwnUnit();
        show(t("adopt.added"));
      } else if (result.data.outcome === "duplicate") {
        clearOwnUnit();
      } else {
        setAskingForUserId(userId);
      }
    }).finally(() => {
      adopting = false;
    });
  }, [userId, hasBrowserUnit, inFlow, askingForUserId, mustAskForSwitch, show, t]);

  const count = guest?.firstRun.count ?? null;
  const accountCount = signedIn ? account.apartmentCount : undefined;
  useEffect(() => {
    if (!userId || accountCount !== null || !count || countTriedUserId === userId) return;
    countTriedUserId = userId;
    void saveCount(count, true);
  }, [userId, accountCount, count]);

  return (
    <AdoptSheet
      key={userId}
      open={(askingForUserId === userId || mustAskForSwitch) && dismissedCurrent !== userId && signedIn && hasBrowserUnit}
      onClose={() => {
        dismissedUserId = userId;
        setDismissedCurrent(userId);
        setAskingForUserId(null);
      }}
    />
  );
}

function AdoptSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("account");
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AccountError | null>(null);

  async function add() {
    const unit = ownUnit(readGuest());
    const account = readAccount();
    if (!unit || account.status !== "signed_in") return onClose();
    setBusy(true);
    setError(null);
    const result = await addUnit(t("newUnitName", { n: account.units.length + 1 }), { form: unit.form, assumed: unit.assumed });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    clearOwnUnit();
    show(t("adopt.added"));
    onClose();
  }

  function remove() {
    clearOwnUnit();
    show(t("adopt.removed"));
    onClose();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) {
          setError(null);
          onClose();
        }
      }}
      title={t("adopt.title")}
      description={t("adopt.body")}
    >
      <div className="flex flex-col gap-2" data-testid="adopt-sheet">
        {error === "unit_limit_reached" ? (
          <LimitNotice />
        ) : (
          <>
            {error && (
              <p role="alert" className="rounded-tile bg-loss-soft px-3 py-2 text-[0.8125rem] leading-relaxed text-loss">
                {t(`errors.${error}`)}
              </p>
            )}
            <button type="button" onClick={add} aria-busy={busy} className="tap h-12 rounded-full bg-ink text-sm font-medium text-white" data-testid="adopt-add">
              {busy ? t("adopt.adding") : t("adopt.add")}
            </button>
          </>
        )}
        <button type="button" onClick={remove} disabled={busy} className="tap h-12 rounded-full bg-fill text-sm font-medium text-ink" data-testid="adopt-remove">
          {t("adopt.remove")}
        </button>
      </div>
    </Sheet>
  );
}
