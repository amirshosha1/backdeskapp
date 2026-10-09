"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { LimitNotice } from "@/components/account/limit-notice";
import { resetAdoptionDismissal } from "@/components/account/account-sync";
import { Sheet } from "@/components/common/sheet";
import { useToast } from "@/components/common/toast";
import { HeroTitle, RoyalHero } from "@/components/layout/royal-hero";
import { CALCULATOR_PRESETS } from "@/demo/sample-data/calculator-presets";
import { useRouter } from "@/i18n/navigation";
import type { AccountError } from "@/lib/account/errors";
import { addUnit, load, removeUnit, renameUnit, useAccount } from "@/lib/account/store";
import type { AccountUnit } from "@/lib/account/units";
import { ASSUMED_FIELDS, OPERATING_MODELS } from "@/lib/calculator/stored-inputs";
import type { OperatingModel } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { useMyApartments } from "./my-apartments";
import { OwnUnitsCount, OwnUnitSection, UnitSummaryCard } from "./own-unit";

/**
 * Units for a signed-in person: their account's apartments (up to the
 * database's limit), add, rename and delete. A visitor keeps the browser
 * apartment exactly as before (own-unit.tsx). The app never blocks an add:
 * the database refuses the 6th (P0001) and the limit notice says why
 * (Batch 3 PR B, Q3). The hero shows "شققك" and how many.
 */

export function UnitsHero() {
  const t = useTranslations("units");
  return (
    <RoyalHero center={<HeroTitle>{t("title")}</HeroTitle>}>
      <OwnUnitsCount />
    </RoyalHero>
  );
}

/** The sample units under "أمثلة تجريبية", only while the person has no apartment of their own. */
export function UnitsExamples({ children }: { children: ReactNode }) {
  const mine = useMyApartments();
  if (mine === null || mine.length > 0) return null;
  return <>{children}</>;
}

/** The visitor's browser apartment, or the account's apartments. */
export function UnitsOwnArea() {
  const account = useAccount();
  if (account === null || account.status === "loading") return <div className="h-[16rem]" aria-hidden="true" />;
  if (account.status === "signed_in") return <AccountUnitsSection units={account.units} loadError={account.loadError} />;
  return <OwnUnitSection />;
}

function AccountUnitsSection({ units, loadError }: { units: AccountUnit[]; loadError: AccountError | null }) {
  const t = useTranslations("account");
  const [editing, setEditing] = useState<AccountUnit | null>(null);
  const [adding, setAdding] = useState(false);
  // Each opening starts a fresh form (a new key), with no state reset in an effect.
  const [addKey, setAddKey] = useState(0);

  // A browser apartment whose sheet was closed elsewhere asks again here.
  useEffect(() => resetAdoptionDismissal(), []);

  return (
    <div className="flex flex-col gap-3" data-testid="account-units">
      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-card bg-loss-soft p-4">
          <p className="text-[0.8125rem] text-loss">{t("loadFailed")}</p>
          <button type="button" onClick={() => void load()} className="tap h-11 shrink-0 rounded-full bg-page px-4 text-sm font-medium text-ink">
            {t("retry")}
          </button>
        </div>
      )}
      {units.map((unit) => (
        <AccountUnitCard key={unit.id} unit={unit} onEdit={() => setEditing(unit)} />
      ))}
      <button
        type="button"
        onClick={() => {
          setAddKey((k) => k + 1);
          setAdding(true);
        }}
        className="tap flex min-h-[4.5rem] items-center gap-3 rounded-card bg-fill px-4 py-3 text-start"
        data-testid="account-add-unit"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-page">
          <Plus className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[0.9375rem] font-semibold">{t("add.button")}</span>
          <span className="text-xs text-muted">{t("add.sub")}</span>
        </span>
      </button>
      <AddUnitSheet key={addKey} open={adding} onOpenChange={setAdding} nextNumber={units.length + 1} />
      {editing && <UnitEditSheet key={editing.id} unit={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function AccountUnitCard({ unit, onEdit }: { unit: AccountUnit; onEdit: () => void }) {
  const t = useTranslations("account");
  return (
    <div className="relative">
      {unit.inputs ? (
        <UnitSummaryCard
          title={unit.name}
          form={unit.inputs.form}
          assumed={unit.inputs.assumed}
          href={`/demo/calculator?unit=${unit.id}`}
          testId="account-unit-card"
          reserveEnd
        />
      ) : (
        <div className="flex flex-col gap-2 rounded-card bg-fill p-4 pe-24" data-testid="account-unit-card">
          <p className="truncate text-base font-semibold">{unit.name}</p>
          <p className="text-xs leading-relaxed text-muted">{t("unreadable")}</p>
        </div>
      )}
      {/* A sibling of the card's link, laid over its header: never a control inside a link. */}
      <button
        type="button"
        onClick={onEdit}
        aria-label={t("edit.label", { name: unit.name })}
        className="tap absolute end-3 top-3 flex h-11 items-center gap-1.5 rounded-full bg-page px-3 text-xs font-medium text-ink"
        data-testid="account-unit-edit"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        {t("edit.button")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- name

type NameProblem = "missing" | "tooLong" | null;

/** The same rule the server applies (1–60 characters after trimming); the server also refuses control characters. */
function nameProblem(raw: string): NameProblem {
  const name = raw.normalize("NFC").trim();
  if (name.length === 0) return "missing";
  if ([...name].length > 60) return "tooLong";
  return null;
}

function NameField({ value, onChange, inputRef, label }: { value: string; onChange: (v: string) => void; inputRef: RefObject<HTMLInputElement | null>; label: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-2">{label}</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
        autoComplete="off"
        enterKeyHint="done"
        className="h-12 rounded-tile bg-fill px-3 text-start text-[0.9375rem] text-ink"
        data-testid="unit-name-input"
      />
    </label>
  );
}

// ---------------------------------------------------------------- add

function AddUnitSheet({ open, onOpenChange, nextNumber }: { open: boolean; onOpenChange: (open: boolean) => void; nextNumber: number }) {
  const t = useTranslations("account");
  const tModel = useTranslations("units.operatingModel");
  const { show } = useToast();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(() => t("newUnitName", { n: nextNumber }));
  const [model, setModel] = useState<OperatingModel>("rental_arbitrage");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AccountError | null>(null);

  const problem = nameProblem(name);

  async function submit() {
    if (problem) return input.current?.focus();
    setBusy(true);
    setError(null);
    // The example's numbers, every one tagged تجريبي until the host changes it (as the first-run flow does).
    const form = { ...CALCULATOR_PRESETS[0]!.form, operatingModel: model };
    const result = await addUnit(name, { form, assumed: [...ASSUMED_FIELDS] });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onOpenChange(false);
    show(t("add.added", { name: result.data.name }));
    router.push(`/demo/calculator?unit=${result.data.id}`);
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !busy && onOpenChange(next)} title={t("add.title")} description={t("add.note")}>
      <div className="flex flex-col gap-4" data-testid="add-unit-sheet">
        <NameField value={name} onChange={setName} inputRef={input} label={t("add.nameLabel")} />
        <div role="radiogroup" aria-label={t("add.modelLabel")} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-2">{t("add.modelLabel")}</span>
          <div className="flex flex-wrap gap-2">
            {OPERATING_MODELS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={model === m}
                onClick={() => setModel(m)}
                className={cn("tap h-11 rounded-full px-4 text-sm font-medium", model === m ? "bg-ink text-white" : "bg-fill text-ink")}
              >
                {tModel(m)}
              </button>
            ))}
          </div>
        </div>
        {error === "unit_limit_reached" ? (
          <LimitNotice />
        ) : (
          <>
            {error && (
              <p role="alert" className="rounded-tile bg-loss-soft px-3 py-2 text-[0.8125rem] leading-relaxed text-loss">
                {t(`errors.${error}`)}
              </p>
            )}
            <button type="button" onClick={submit} aria-busy={busy} className="tap h-12 rounded-full bg-ink text-sm font-medium text-white" data-testid="add-unit-submit">
              {busy ? t("add.adding") : problem ? t(`name.${problem}`) : t("add.submit")}
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- edit

function UnitEditSheet({ unit, onClose }: { unit: AccountUnit; onClose: () => void }) {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const { show } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(unit.name);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<"rename" | "delete" | null>(null);
  const [error, setError] = useState<AccountError | null>(null);

  const problem = nameProblem(name);
  const unchanged = name.normalize("NFC").trim() === unit.name;

  async function rename() {
    if (problem) return input.current?.focus();
    if (unchanged) return;
    setBusy("rename");
    setError(null);
    const result = await renameUnit(unit.id, name);
    setBusy(null);
    if (!result.ok) return setError(result.error);
    show(t("edit.renamed"));
    onClose();
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    const result = await removeUnit(unit.id);
    setBusy(null);
    if (!result.ok) return setError(result.error);
    show(t("edit.deleted"));
    onClose();
  }

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && !busy && onClose()}
      title={confirming ? t("edit.deleteTitle", { name: unit.name }) : t("edit.title")}
      description={confirming ? t("edit.deleteBody") : undefined}
    >
      <div className="flex flex-col gap-3" data-testid="unit-edit-sheet">
        {error && (
          <p role="alert" className="rounded-tile bg-loss-soft px-3 py-2 text-[0.8125rem] leading-relaxed text-loss">
            {t(`errors.${error}`)}
          </p>
        )}
        {confirming ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={remove} aria-busy={busy === "delete"} className="tap h-12 rounded-full bg-loss text-sm font-medium text-white" data-testid="unit-delete-confirm">
              {busy === "delete" ? t("edit.deleting") : t("edit.deleteConfirm")}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="tap h-12 rounded-full bg-fill text-sm font-medium">
              {tCommon("cancel")}
            </button>
          </div>
        ) : (
          <>
            <NameField value={name} onChange={setName} inputRef={input} label={t("add.nameLabel")} />
            <button type="button" onClick={rename} aria-busy={busy === "rename"} className="tap h-12 rounded-full bg-ink text-sm font-medium text-white" data-testid="unit-rename">
              {busy === "rename" ? t("edit.saving") : problem ? t(`name.${problem}`) : unchanged ? t("edit.unchanged") : t("edit.saveName")}
            </button>
            <button type="button" onClick={() => setConfirming(true)} className="tap h-12 rounded-full bg-loss-soft text-sm font-medium text-loss" data-testid="unit-delete">
              {t("edit.delete")}
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
