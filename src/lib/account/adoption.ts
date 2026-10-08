import { sameForm } from "@/lib/calculator/form";
import { parseStoredInputs, type StoredInputs } from "@/lib/calculator/stored-inputs";

/**
 * Moving a visitor's browser apartment into their account (decided
 * 2026-10-08, docs/BUILD_PLAN.md "0a/0b slice 1"):
 *   - the account has no apartments → add it, then clear the browser copy;
 *   - the account already has the same numbers → just clear the browser copy;
 *   - otherwise → ask: add it, or delete it from this device.
 * Account data is never overwritten by browser data. "The same numbers"
 * means the same form field by field; which inputs are still tagged
 * تجريبي does not count.
 *
 * Pure, so the server action decides from a fresh read of the account and
 * the tests can cover every case.
 */
export type AdoptionDecision = { kind: "add" } | { kind: "duplicate"; unitId: string } | { kind: "ask" };

export function decideAdoption(guest: StoredInputs, accountUnits: { id: string; calculator_inputs: unknown }[]): AdoptionDecision {
  if (accountUnits.length === 0) return { kind: "add" };
  for (const unit of accountUnits) {
    const stored = parseStoredInputs(unit.calculator_inputs);
    if (stored && sameForm(stored.form, guest.form)) return { kind: "duplicate", unitId: unit.id };
  }
  return { kind: "ask" };
}
