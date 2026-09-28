"use client";

import { useRef, useState } from "react";
import Decimal from "decimal.js";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Money } from "@/components/common/money";
import { UnitGlyph } from "@/components/common/icons";
import type { AppLocale } from "@/i18n/routing";
import type { UnitFixture } from "@/demo/fixtures/types";
import { cn } from "@/lib/utils";

/**
 * The units as a swipeable row of frosted-glass cards at the bottom of the
 * royal hero — one unit per card: name, operating model, and its profit
 * (net profit for owner-run units, manager profit for managed ones).
 * Tapping a card opens Units.
 */
export function UnitCarousel({ units, label }: { units: UnitFixture[]; label: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("home");
  const tModel = useTranslations("units.operatingModel");
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = scroller.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    // scrollLeft is negative in right-to-left layouts; the magnitude is what matters.
    const step = first.offsetWidth + 12;
    setActive(Math.min(units.length - 1, Math.round(Math.abs(el.scrollLeft) / step)));
  }

  return (
    <section aria-label={label} className="mt-6">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="snap-row -mx-4 flex gap-3 overflow-x-auto scroll-px-4 px-4 pb-1"
      >
        {units.map((unit) => {
          const isManaged = unit.operatingModel === "managed_for_owner";
          const amount = (isManaged ? unit.managerProfit : unit.netProfit)!;
          return (
            <Link
              key={unit.id}
              href="/demo/units"
              data-testid="unit-card"
              className="glass tap flex w-[calc(100%-3rem)] shrink-0 flex-col rounded-card p-4"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/18">
                  <UnitGlyph model={unit.operatingModel} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[0.9375rem] leading-snug font-semibold">{unit.name[locale]}</span>
                  <span className="block truncate text-xs text-white/70">{tModel(unit.operatingModel)}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-white/70 rtl:rotate-180" aria-hidden="true" />
              </span>
              <span className="mt-auto flex items-baseline justify-between gap-2 pt-4">
                <span className="text-xs text-white/70">{isManaged ? t("managerProfit") : t("netProfit")}</span>
                <Money
                  amount={amount}
                  signDisplay="always"
                  className={cn("text-xl font-semibold", new Decimal(amount).isNegative() && "text-[#ffc9c3]")}
                />
              </span>
            </Link>
          );
        })}
      </div>
      {units.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          {units.map((unit, i) => (
            <span
              key={unit.id}
              className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-white" : "w-1.5 bg-white/40")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
