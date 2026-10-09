import { parseStoredInputs, type StoredInputs } from "@/lib/calculator/stored-inputs";
import type { OperatingModel } from "@/lib/finance";
import type { Tables } from "@/types/database";

/**
 * An apartment saved to the account, as the app uses it. Shared by the
 * browser (reads) and the server actions (writes return the saved row).
 */

/** The columns the app reads from `public.units`. */
export const UNIT_COLUMNS = "id, name, operating_model, calculator_inputs, engine_version, created_at, updated_at";

export type UnitRow = Pick<Tables<"units">, "id" | "name" | "operating_model" | "calculator_inputs" | "engine_version" | "created_at" | "updated_at">;

export interface AccountUnit {
  id: string;
  name: string;
  operatingModel: OperatingModel;
  /** Null when the stored inputs can no longer be opened (the card then offers delete only). */
  inputs: StoredInputs | null;
  engineVersion: string;
  updatedAt: string;
}

export function toAccountUnit(row: UnitRow): AccountUnit {
  const inputs = parseStoredInputs(row.calculator_inputs);
  return {
    id: row.id,
    name: row.name,
    operatingModel: (inputs?.form.operatingModel ?? row.operating_model) as OperatingModel,
    inputs,
    engineVersion: row.engine_version,
    updatedAt: row.updated_at,
  };
}
