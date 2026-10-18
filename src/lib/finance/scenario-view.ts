import Decimal from "decimal.js";
import { breakEvenNights } from "./breakeven";
import { roundMoney, ZERO } from "./money";
import { BASIS_AFTER_DEPRECIATION, computeScenario, scenarioModel, type ScenarioInput, type ScenarioResult } from "./scenario";

/**
 * What the calculator screens show, derived from `computeScenario` (P.2
 * slice 1, "UI batch 2"). The headline is the net profit **after
 * depreciation**; every break-even here is on that same basis. Nothing in
 * this module changes a formula: it rounds, reconciles and classifies the
 * engine's own results so no component has to do arithmetic on money.
 *
 * Rounding follows the engine's convention (money.ts): figures are exact
 * `Decimal`s and are rounded half-up to piastres only here, at the output.
 * Where rounded parts must add up to a rounded total, the leftover piastre
 * goes to a *computed* line — operating expenses, then platform fees, then
 * commission, the first that was itself rounded — never to a line that
 * equals a single input (rent, a fixed fee): a rent typed as 35,000 always
 * shows 35,000.00. In a half-piastre tie of opposite sign, a tied derived
 * figure (profit before depreciation, or revenue) takes the other half of
 * its tie instead (DECISIONS.md D-24).
 */

export type BreakEvenStatus = "within_month" | "beyond_available_nights" | "no_break_even";

/**
 * Break-even on the after-depreciation basis, **not capped** at the
 * month's available nights: a unit that needs 33.55 nights in a 30-night
 * month says so instead of only "unreachable".
 */
export type AfterDepreciationBreakEven =
  | {
      status: "within_month" | "beyond_available_nights";
      /** Exact break-even nights. */
      nights: Decimal;
      /** The first whole night whose displayed profit is ≥ 0 (BUILD_PLAN.md §4.3). */
      wholeNights: number;
    }
  | {
      /** Every booked night adds to the loss: per-night contribution after commission ≤ 0. */
      status: "no_break_even";
    };

/** Which sentence the screen shows next to the headline; the copy lives in the message files. */
export type ScenarioSentence =
  | { kind: "no_available_nights" }
  | { kind: "no_break_even" }
  | { kind: "beyond_month"; nights: Decimal }
  | { kind: "short"; nights: Decimal; nightsShort: number }
  | { kind: "at_first_profitable_night"; nights: Decimal; wholeNights: number }
  | { kind: "above"; nights: Decimal; nightsAbove: number };

export interface ScenarioSections {
  /** Gross revenue (accommodation + cleaning fees). */
  revenue: Decimal;
  platformFees: Decimal;
  /** Every operating expense except rent; repairs included. */
  operatingExpenses: Decimal;
  /** Rental arbitrage only. */
  rent: Decimal | null;
  /** Managed for an owner only. */
  managementCommission: Decimal | null;
  /** revenue − fees − operating expenses − rent − commission, to the piastre. */
  profitBeforeDepreciation: Decimal;
  /** profitBeforeDepreciation − netAfterDepreciation, to the piastre. */
  depreciation: Decimal;
}

export interface ScenarioView {
  /** Displayed gross revenue. */
  revenue: Decimal;
  /** Defined as revenue − net after depreciation, so the summary rows always add up as displayed. */
  totalCostsWithDepreciation: Decimal;
  /** The headline: net profit after depreciation (for a managed unit, the owner's). */
  netAfterDepreciation: Decimal;
  /** The verdict word: "profit" when the displayed net is ≥ 0.00. */
  outcome: "profit" | "loss";
  sections: ScenarioSections;
  breakEven: AfterDepreciationBreakEven;
  sentence: ScenarioSentence;
  /**
   * Managed units: commission − manager-borne costs. A scenario has no
   * manager-borne costs (every cost line comes off the owner's NOI), so
   * this is the commission — the displayed line, so a unit card and the
   * commission section always show the same figure. Null otherwise.
   */
  managerProfit: Decimal | null;
}

/** Doublings of the search horizon before giving up (2^200 nights: never reached in practice). */
const MAX_DOUBLINGS = 200;

function afterDepreciationBreakEven(input: ScenarioInput, result: ScenarioResult): AfterDepreciationBreakEven {
  const inMonth = result.breakEven.includingDepreciation;
  if (inMonth.kind === "reached") {
    // A root on a falling piece (no fixed costs, a negative contribution)
    // is not a break-even a host can reach by booking more.
    if (inMonth.contributionPerNight.lessThanOrEqualTo(0)) return { status: "no_break_even" };
    return { status: "within_month", nights: inMonth.nights, wholeNights: inMonth.wholeNights };
  }
  if (inMonth.reason === "never_profitable") return { status: "no_break_even" };

  // Beyond the available nights (or none available): the same solver,
  // over a wider horizon, doubled until the root is inside it.
  const model = scenarioModel(input);
  let horizon = Decimal.max(result.nightsAvailable, 1).times(2);
  for (let i = 0; i < MAX_DOUBLINGS; i++) {
    const wider = breakEvenNights(model, horizon, BASIS_AFTER_DEPRECIATION);
    if (wider.kind === "reached") {
      if (wider.contributionPerNight.lessThanOrEqualTo(0)) return { status: "no_break_even" };
      return { status: "beyond_available_nights", nights: wider.nights, wholeNights: wider.wholeNights };
    }
    if (wider.reason === "never_profitable") return { status: "no_break_even" };
    horizon = horizon.times(2);
  }
  return { status: "no_break_even" };
}

function sentenceFor(result: ScenarioResult, breakEven: AfterDepreciationBreakEven, outcome: "profit" | "loss"): ScenarioSentence {
  if (result.nightsAvailable.lessThanOrEqualTo(0)) return { kind: "no_available_nights" };
  if (breakEven.status === "no_break_even") return { kind: "no_break_even" };
  const booked = new Decimal(result.kpis.bookedNights);
  if (outcome === "profit") {
    const above = booked.minus(breakEven.wholeNights).floor();
    return above.lessThanOrEqualTo(0)
      ? { kind: "at_first_profitable_night", nights: breakEven.nights, wholeNights: breakEven.wholeNights }
      : { kind: "above", nights: breakEven.nights, nightsAbove: above.toNumber() };
  }
  if (breakEven.status === "beyond_available_nights") return { kind: "beyond_month", nights: breakEven.nights };
  // A loss inside the month means booked < break-even: once profit reaches
  // zero it never falls again as nights rise (commission only lowers the slope).
  return { kind: "short", nights: breakEven.nights, nightsShort: new Decimal(breakEven.wholeNights).minus(booked).ceil().toNumber() };
}

/** True when a value is already in whole piastres, so rounding leaves it unchanged. */
const isWholePiastres = (value: Decimal.Value) => new Decimal(value).decimalPlaces() <= 2;

function sectionsFor(input: ScenarioInput, result: ScenarioResult, net: Decimal): ScenarioSections {
  const { pnl } = result;
  const isArbitrage = input.operatingModel === "rental_arbitrage";
  const isManaged = input.operatingModel === "managed_for_owner";

  let revenue = roundMoney(pnl.grossRevenue);
  // Half-up rounds away from zero, so for a whole-piastre k, round(x − k)
  // ≠ round(x) − k when x is a half-piastre tie and x, x − k have opposite
  // signs (+0.005 → 0.01 but −0.005 → −0.01). Then a depreciation already
  // in whole piastres keeps its value and profit before depreciation takes
  // the other half of its tie: still within half a piastre of its value.
  const before = isWholePiastres(result.depreciation) ? net.plus(result.depreciation) : roundMoney(result.profitBeforeDepreciation);
  // Rent is a typed amount: shown as typed, never adjusted.
  const rent = isArbitrage ? roundMoney(result.rent) : null;

  // The computed lines; the first one (operating expenses, then fees, then
  // commission) that was itself rounded takes the leftover piastre, so the
  // block sums exactly to `before`.
  const lines = {
    platformFees: pnl.platformFees,
    operatingExpenses: result.opexExcludingRent,
    managementCommission: isManaged ? pnl.commission : null,
  };
  const rounded = {
    platformFees: roundMoney(lines.platformFees),
    operatingExpenses: roundMoney(lines.operatingExpenses),
    managementCommission: lines.managementCommission === null ? null : roundMoney(lines.managementCommission),
  };
  const leftover = revenue
    .minus(rounded.platformFees)
    .minus(rounded.operatingExpenses)
    .minus(rounded.managementCommission ?? ZERO)
    .minus(rent ?? ZERO)
    .minus(before);
  if (!leftover.isZero()) {
    const order = ["operatingExpenses", "platformFees", "managementCommission"] as const;
    const absorber = order.find((key) => lines[key] !== null && !new Decimal(lines[key]!).equals(rounded[key]!));
    if (absorber) rounded[absorber] = rounded[absorber]!.plus(leftover);
    // Every cost line is in whole piastres, so only revenue and the
    // subtotal were rounded, in ties of opposite sign: revenue takes the
    // other half of its tie.
    else revenue = revenue.minus(leftover);
  }

  return {
    revenue,
    platformFees: rounded.platformFees,
    operatingExpenses: rounded.operatingExpenses,
    rent,
    managementCommission: rounded.managementCommission,
    profitBeforeDepreciation: before,
    depreciation: before.minus(net),
  };
}

export function scenarioView(input: ScenarioInput, result: ScenarioResult = computeScenario(input)): ScenarioView {
  const net = roundMoney(result.netProfit);
  const outcome = net.greaterThanOrEqualTo(0) ? "profit" : "loss";
  const breakEven = afterDepreciationBreakEven(input, result);
  const sections = sectionsFor(input, result, net);
  const revenue = sections.revenue;
  return {
    revenue,
    totalCostsWithDepreciation: revenue.minus(net),
    netAfterDepreciation: net,
    outcome,
    sections,
    breakEven,
    sentence: sentenceFor(result, breakEven, outcome),
    managerProfit: sections.managementCommission,
  };
}
