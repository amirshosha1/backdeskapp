import Decimal from "decimal.js";
import { modelPnl, type PerNightModel, type ProfitBasis } from "./model";
import { ONE, roundMoney, ZERO } from "./money";

/**
 * Break-even (BUILD_PLAN.md §4.3). profit(n) is continuous and piecewise
 * linear in booked nights (and in ADR), with kinks only where NOI = 0 or
 * where c × base = F. The solver collects those kinks, walks the linear
 * segments in order and returns the smallest root inside its own segment
 * and inside [0, nights_available] — never a negative or infinite number.
 *
 * Profit is evaluated with `modelPnl` on the caller's `ProfitBasis`, the
 * same function and basis the displayed profit uses: a break-even shown
 * next to a profit figure always covers the same costs (Phase 1 review,
 * 2026-10-01). The basis travels with the result so the UI can label it.
 */

export type BreakEvenResult =
  | {
      kind: "reached";
      /** Exact break-even nights (pre-tax: tax is zero at break-even). */
      nights: Decimal;
      /**
       * A night is not divisible: the first whole night at which the
       * displayed (piastre-rounded) profit is ≥ 0 — ceil(nights), except in
       * a sub-half-piastre tie.
       */
      wholeNights: number;
      occupancy: Decimal;
      wholeOccupancy: Decimal;
      basis: ProfitBasis;
    }
  | {
      kind: "unreachable";
      reason: "no_available_nights" | "never_profitable" | "exceeds_available_nights";
      basis: ProfitBasis;
    };

export type BreakEvenAdrResult =
  | { kind: "reached"; adr: Decimal; basis: ProfitBasis }
  | { kind: "unreachable"; reason: "no_booked_nights" | "never_profitable"; basis: ProfitBasis };

/** Roots closer than this to a whole night are snapped to it, so exact cases stay exact. */
const SNAP = new Decimal("1e-9");

/** x where a linear g (known at 0 and 1) reaches `target`; null when g is flat. */
function linearRoot(at0: Decimal, at1: Decimal, target: Decimal.Value): Decimal | null {
  const slope = at1.minus(at0);
  if (slope.isZero()) return null;
  return new Decimal(target).minus(at0).dividedBy(slope);
}

/**
 * Every x where the model's piecewise terms can kink, given profit as a
 * function of one variable. `evaluate(x)` returns the model P&L at x.
 */
function kinks(evaluate: (x: Decimal.Value) => ReturnType<typeof modelPnl>, model: PerNightModel): Decimal[] {
  const a = evaluate(0);
  const b = evaluate(1);
  const rate = new Decimal(model.commission.rate);
  const fixed = model.commission.fixedFee;
  const inc = model.commission.includeCleaningFees;
  const grossBase = (p: typeof a) => (inc ? p.grossRevenue : p.grossRevenue.minus(p.cleaningFees));
  const payoutBase = (p: typeof a) =>
    inc ? p.netPayout : p.netPayout.minus(p.cleaningFees.minus(p.platformFeesOnCleaning));
  return [
    linearRoot(a.noi, b.noi, 0),
    linearRoot(rate.times(a.noi), rate.times(b.noi), fixed),
    linearRoot(rate.times(grossBase(a)), rate.times(grossBase(b)), fixed),
    linearRoot(rate.times(payoutBase(a)), rate.times(payoutBase(b)), fixed),
  ].filter((x): x is Decimal => x !== null);
}

/**
 * The smallest x in [lo, hi] (hi = null: unbounded) with f(x) = 0, given
 * that f is linear between consecutive breakpoints. Null when there is none.
 */
function firstRoot(f: (x: Decimal) => Decimal, breakpoints: Decimal[], lo: Decimal, hi: Decimal | null): Decimal | null {
  const inner = breakpoints.filter((x) => x.greaterThan(lo) && (hi === null || x.lessThan(hi)));
  const points = [lo, ...inner.sort((x, y) => x.comparedTo(y))];
  if (hi !== null) points.push(hi);

  const atLo = f(lo);
  if (atLo.greaterThanOrEqualTo(0)) return lo;
  let prev = lo;
  let fPrev = atLo;
  for (const x of points.slice(1)) {
    const fx = f(x);
    if (fx.greaterThanOrEqualTo(0)) {
      return prev.plus(x.minus(prev).times(fPrev.negated()).dividedBy(fx.minus(fPrev)));
    }
    prev = x;
    fPrev = fx;
  }
  if (hi !== null) return null;
  // Past the last kink f is linear: follow it if it rises.
  const slope = f(prev.plus(ONE)).minus(fPrev);
  return slope.greaterThan(0) ? prev.minus(fPrev.dividedBy(slope)) : null;
}

function snapToWhole(x: Decimal): Decimal {
  const whole = x.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  return x.minus(whole).abs().lessThan(SNAP) ? whole : x;
}

/** The smallest n in [0, nights_available] where profit(n) = 0, or a typed `unreachable`. */
export function breakEvenNights(model: PerNightModel, nightsAvailable: Decimal.Value, basis: ProfitBasis): BreakEvenResult {
  const available = new Decimal(nightsAvailable);
  if (available.lessThanOrEqualTo(0)) return { kind: "unreachable", reason: "no_available_nights", basis };

  const evaluate = (n: Decimal.Value) => modelPnl(model, n, basis);
  const profit = (n: Decimal) => evaluate(n).profit;
  const breakpoints = kinks(evaluate, model);
  const root = firstRoot(profit, breakpoints, ZERO, available);

  if (root === null) {
    const beyond = Decimal.max(available, ...breakpoints);
    const rising = profit(beyond.plus(ONE)).greaterThan(profit(beyond));
    return { kind: "unreachable", reason: rising ? "exceeds_available_nights" : "never_profitable", basis };
  }
  const nights = snapToWhole(root);
  // A night is not divisible: hosts need the ceiling. The one exception is
  // a sub-half-piastre tie, where profit one night earlier already displays
  // as 0.00 — then that night is the first whole night at break-even as
  // shown, so the target never contradicts the profit on screen.
  let wholeNights = nights.toDecimalPlaces(0, Decimal.ROUND_UP).toNumber();
  while (wholeNights > 0 && roundMoney(profit(new Decimal(wholeNights - 1))).greaterThanOrEqualTo(0)) wholeNights -= 1;
  return {
    kind: "reached",
    nights,
    wholeNights,
    occupancy: nights.dividedBy(available),
    wholeOccupancy: new Decimal(wholeNights).dividedBy(available),
    basis,
  };
}

/** The ADR at which profit is zero for a fixed number of booked nights (`break_even_ADR`). */
export function breakEvenAdr(model: PerNightModel, bookedNights: Decimal.Value, basis: ProfitBasis): BreakEvenAdrResult {
  const nights = new Decimal(bookedNights);
  if (nights.lessThanOrEqualTo(0)) return { kind: "unreachable", reason: "no_booked_nights", basis };
  const evaluate = (adr: Decimal.Value) => modelPnl({ ...model, adr }, nights, basis);
  const root = firstRoot((adr) => evaluate(adr).profit, kinks(evaluate, model), ZERO, null);
  return root === null ? { kind: "unreachable", reason: "never_profitable", basis } : { kind: "reached", adr: root, basis };
}

export interface BreakEvenProgress {
  /** Whole nights needed (break-even rounded up). */
  targetNights: number;
  nightsShort: number;
  /** Booked ÷ exact break-even nights, capped at 1. */
  progress: Decimal;
  reached: boolean;
}

/** Display values for a "booked vs break-even" meter; null when break-even is unreachable. */
export function breakEvenProgress(bookedNights: number, result: BreakEvenResult): BreakEvenProgress | null {
  if (result.kind === "unreachable") return null;
  const reached = new Decimal(bookedNights).greaterThanOrEqualTo(result.nights);
  return {
    targetNights: result.wholeNights,
    nightsShort: Math.max(result.wholeNights - bookedNights, 0),
    progress: result.nights.isZero() ? ONE : Decimal.min(new Decimal(bookedNights).dividedBy(result.nights), ONE),
    reached,
  };
}
