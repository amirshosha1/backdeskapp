import { useLocale } from "next-intl";
import { ExpenseGlyph } from "@/components/common/icons";
import { Percent } from "@/components/common/percent";
import type { AppLocale } from "@/i18n/routing";
import type { ExpenseShare } from "@/demo/fixtures/types";

/**
 * Glass bubbles sized by share, with the percentage inside each (Amir's
 * request, after the reference). Area tracks share (diameter ∝ √share),
 * with a floor so the smallest label stays legible; the exact figures are
 * in the list under the chart, so nothing depends on judging areas.
 *
 * Up to four bubbles in fixed slots (the fixture pre-groups the tail into
 * "other"): the largest on the start side, the rest stacked on the end.
 * Slots are logical (inline-start), so the layout mirrors in English.
 */
const MAX_D = 196;
const MIN_D = 80;
const SLOTS = [
  { x: 108, y: 150 },
  { x: 266, y: 58 },
  { x: 270, y: 156 },
  { x: 262, y: 252 },
] as const;

export function ExpenseBubbles({ bubbles, label }: { bubbles: ExpenseShare[]; label: string }) {
  const locale = useLocale() as AppLocale;
  const largest = Math.max(...bubbles.map((b) => b.share));

  return (
    <ul aria-label={label} className="relative mx-auto mt-6 h-[19rem] w-[20.5rem] max-w-full">
      {bubbles.slice(0, SLOTS.length).map((bubble, i) => {
        const slot = SLOTS[i]!;
        const d = Math.max(MIN_D, Math.round(Math.sqrt(bubble.share / largest) * MAX_D));
        const big = d >= 120;
        return (
          <li
            key={bubble.id}
            data-testid="expense-bubble"
            className="glass absolute flex flex-col items-center justify-center rounded-full text-center"
            style={{ width: d, height: d, insetInlineStart: slot.x - d / 2, top: slot.y - d / 2 }}
          >
            <ExpenseGlyph icon={bubble.icon} className={big ? "h-6 w-6" : "h-4 w-4"} />
            <span className={big ? "mt-1.5 max-w-[80%] text-sm" : "mt-1 max-w-[86%] truncate text-[0.625rem]"}>
              {bubble.name[locale]}
            </span>
            <span className={big ? "text-2xl font-semibold" : "text-sm font-semibold"}>
              <Percent ratio={bubble.share} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
