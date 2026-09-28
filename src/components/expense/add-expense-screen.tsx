"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Check, CheckCircle2, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Sheet } from "@/components/common/sheet";
import { UnitGlyph } from "@/components/common/icons";
import { parseAmount } from "@/lib/format/amount";
import { AmountKeypad } from "./amount-keypad";
import { CategoryChips } from "./category-chips";
import type { AppLocale } from "@/i18n/routing";
import type { ExpenseCategory } from "@/demo/fixtures/expense";
import type { UnitFixture } from "@/demo/fixtures/types";
import { cn } from "@/lib/utils";

type FormError = "amount_empty" | "amount_invalid" | "amount_non_positive" | "category" | null;

export interface AddExpenseScreenProps {
  categories: ExpenseCategory[];
  units: UnitFixture[];
  defaultUnitId: string;
}

const CAIRO = "Africa/Cairo";

/** Today's date in Cairo as YYYY-MM-DD (CLAUDE.md §6.11: Africa/Cairo by default). */
function cairoToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CAIRO }).format(new Date());
}

const noopSubscribe = () => () => {};

/**
 * BUILD_PLAN.md Phase P/5: add expense in ≤ 4 taps, not counting the
 * amount digits. The unit is preselected and the date defaults to today, so
 * the flow takes 3: the Home "إضافة مصروف" button, a category, then Save.
 * Unit and date can still be changed (a sheet and the phone's date picker),
 * and Save explains what's missing instead of silently doing nothing.
 */
export function AddExpenseScreen({ categories, units, defaultUnitId }: AddExpenseScreenProps) {
  const t = useTranslations("expense");
  const locale = useLocale() as AppLocale;
  const errorId = useId();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState(defaultUnitId);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [error, setError] = useState<FormError>(null);
  const [saved, setSaved] = useState(false);

  // "Today" is read on the client: this page is statically rendered, so a
  // server-side date would freeze at build time.
  const today = useSyncExternalStore(noopSubscribe, cairoToday, () => null);
  const date = pickedDate ?? today;
  const unit = units.find((u) => u.id === unitId) ?? units[0]!;

  function formatDay(isoDate: string) {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${isoDate}T00:00:00Z`));
  }

  function save() {
    const parsed = parseAmount(amount);
    if (!parsed.ok) return setError(`amount_${parsed.error}`);
    if (!categoryId) return setError("category");
    setError(null);
    setSaved(true);
  }

  function reset() {
    setAmount("");
    setCategoryId(null);
    setPickedDate(null);
    setSaved(false);
  }

  if (saved) {
    return (
      <div>
        <PageHeader title={t("title")} backHref="/demo" />
        <div className="flex flex-col items-center px-6 pt-12 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-profit-soft text-profit">
            <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold">{t("confirmationTitle")}</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{t("confirmationBody")}</p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
            <button
              type="button"
              onClick={reset}
              className="tap h-12 rounded-full bg-ink text-sm font-semibold text-white"
            >
              {t("addAnother")}
            </button>
            <Link
              href="/demo"
              className="tap flex h-12 items-center justify-center rounded-full bg-fill text-sm font-semibold"
            >
              {t("backHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={t("title")} backHref="/demo" />
      <div className="flex flex-1 flex-col gap-6 px-4">
        <AmountKeypad
          value={amount}
          onChange={(next) => {
            setAmount(next);
            if (error?.startsWith("amount_")) setError(null);
          }}
          invalid={error?.startsWith("amount_") ?? false}
          describedBy={error ? errorId : undefined}
        />

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">{t("categoryLabel")}</h2>
          <CategoryChips
            label={t("categoryLabel")}
            categories={categories}
            selectedId={categoryId}
            onSelect={(id) => {
              setCategoryId(id);
              if (error === "category") setError(null);
            }}
          />
        </section>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setUnitSheetOpen(true)}
            aria-label={`${t("unitLabel")}: ${unit.name[locale]}`}
            className="tap flex h-14 items-center gap-3 rounded-tile bg-fill px-4 text-start"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-page text-ink-2">
              <UnitGlyph model={unit.operatingModel} className="h-4 w-4" />
            </span>
            <span className="text-sm text-muted">{t("unitLabel")}</span>
            <span className="min-w-0 flex-1 truncate text-end text-sm font-semibold">{unit.name[locale]}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          </button>

          <label className="tap relative flex h-14 items-center gap-3 rounded-tile bg-fill px-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-page text-ink-2">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm text-muted">{t("dateLabel")}</span>
            <span className="min-w-0 flex-1 truncate text-end text-sm font-semibold" data-testid="expense-date">
              {date && date === today ? `${t("todayLabel")} · ${formatDay(date)}` : date ? formatDay(date) : ""}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            {/* The phone's own date picker, stretched invisibly over the row. */}
            <input
              type="date"
              aria-label={t("dateLabel")}
              value={date ?? ""}
              max={today ?? undefined}
              onChange={(event) => setPickedDate(event.target.value || null)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>

        <div className="mt-auto pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <p id={errorId} role="alert" className="mb-2 min-h-5 text-center text-sm font-medium text-loss">
            {error === "amount_empty"
              ? t("errorAmountEmpty")
              : error === "amount_invalid"
                ? t("errorAmountInvalid")
                : error === "amount_non_positive"
                  ? t("errorAmountNonPositive")
                  : error === "category"
                    ? t("errorCategory")
                    : ""}
          </p>
          <button
            type="button"
            onClick={save}
            className="tap h-14 w-full rounded-full bg-ink text-base font-semibold text-white"
          >
            {t("saveCta")}
          </button>
        </div>
      </div>

      <Sheet open={unitSheetOpen} onOpenChange={setUnitSheetOpen} title={t("unitSheetTitle")}>
        <div role="radiogroup" aria-label={t("unitSheetTitle")} className="flex flex-col gap-2">
          {units.map((option) => {
            const selected = option.id === unitId;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setUnitId(option.id);
                  setUnitSheetOpen(false);
                }}
                className={cn(
                  "tap flex h-14 items-center gap-3 rounded-tile px-4 text-start",
                  selected ? "bg-brand-soft" : "bg-fill",
                )}
              >
                <UnitGlyph model={option.operatingModel} className="h-5 w-5 text-ink-2" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{option.name[locale]}</span>
                {selected && <Check className="h-5 w-5 text-brand" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
