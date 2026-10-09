"use client";

import type Decimal from "decimal.js";
import { useAccount } from "@/lib/account/store";
import { parseCalculatorForm, type CalculatorForm } from "@/lib/calculator/form";
import type { StoredInputs } from "@/lib/calculator/stored-inputs";
import { computeScenario, orgProfit, scenarioView, type OperatingModel } from "@/lib/finance";
import { ownUnit, useGuest } from "@/lib/guest/store";

/**
 * The person's own apartments, wherever they live: the account's when
 * signed in, otherwise the one kept in this browser. Null until it is known
 * (the page is static; the browser's state and the session are read after
 * hydration), so a screen never shows the wrong list for a moment.
 */
export interface MyApartment {
  key: string;
  /** The account's name; null for the browser apartment (the screen names it). */
  name: string | null;
  operatingModel: OperatingModel;
  /** Null when an account apartment's stored inputs can no longer be opened. */
  inputs: StoredInputs | null;
  href: string;
}

export function useMyApartments(): MyApartment[] | null {
  const account = useAccount();
  const guest = useGuest();
  if (account === null || account.status === "loading") return null;
  if (account.status === "signed_in") {
    return account.units.map((u) => ({
      key: u.id,
      name: u.name,
      operatingModel: u.operatingModel,
      inputs: u.inputs,
      href: `/demo/calculator?unit=${u.id}`,
    }));
  }
  if (guest === null) return null;
  const own = ownUnit(guest);
  return own
    ? [{ key: own.id, name: null, operatingModel: own.form.operatingModel, inputs: { form: own.form, assumed: own.assumed }, href: "/demo/calculator" }]
    : [];
}

/**
 * An apartment's monthly figure, exactly as its Units card shows it (the
 * engine's): net profit after depreciation, or for a managed unit the
 * manager's profit. Null when the form no longer parses.
 */
export function apartmentNet(form: CalculatorForm): Decimal | null {
  const parsed = parseCalculatorForm(form);
  if (!parsed.ok) return null;
  const view = scenarioView(parsed.input, computeScenario(parsed.input));
  return form.operatingModel === "managed_for_owner" ? view.managerProfit : view.netAfterDepreciation;
}

/** The sum of the apartments' figures (the engine's org profit, no overhead); calculator apartments are in EGP. */
export function apartmentsTotal(nets: readonly { operatingModel: OperatingModel; net: Decimal }[]): Decimal | null {
  const totals = orgProfit(
    nets.map(({ operatingModel, net }) => ({
      operatingModel,
      currency: "EGP",
      ...(operatingModel === "managed_for_owner" ? { managerProfit: net } : { netProfit: net }),
    })),
    [],
  );
  return totals[0]?.total ?? null;
}
