import "server-only";
import { z } from "zod";
import { parseCalculatorForm, type CalculatorForm } from "@/lib/calculator/form";
import { ASSUMED_FIELDS, MANAGED_BASES, NUMBER_FIELDS, OPERATING_MODELS, PERCENT_BASES, type StoredInputs } from "@/lib/calculator/stored-inputs";
import { APARTMENT_COUNTS } from "@/lib/first-run/apartment-count";
import { jsonbTextBytes } from "./jsonb-size";

/**
 * What the account's server actions accept (CLAUDE.md §6.6: every input is
 * validated with Zod at the server boundary). Server-only: Zod never ships
 * to the browser. The database checks the same things again (constraints,
 * grants, RLS); these rules exist so a bad request fails with a clear
 * error before it reaches it.
 */

/** units.calculator_inputs: octet_length(calculator_inputs::text) <= 8192. */
export const CALCULATOR_INPUTS_MAX_BYTES = 8192;
/** units.name: 1–60 characters (code points, as Postgres counts them). */
export const UNIT_NAME_MAX = 60;

// Control characters (C0 and C1), line/paragraph separators, and the
// direction embeddings, overrides and isolates that could make a name
// display as something else. Plain Arabic and English text never needs them.
const FORBIDDEN_IN_NAME = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;

export const unitNameSchema = z
  .string()
  .transform((s) => s.normalize("NFC").trim())
  .refine((s) => s.length > 0, { message: "name_empty" })
  .refine((s) => [...s].length <= UNIT_NAME_MAX, { message: "name_too_long" })
  .refine((s) => !FORBIDDEN_IN_NAME.test(s), { message: "name_invalid_characters" });

export const operatingModelSchema = z.enum(OPERATING_MODELS as [string, ...string[]]);

export const apartmentCountSchema = z.enum(APARTMENT_COUNTS);

export const unitIdSchema = z.uuid();

const calculatorFormSchema = z.strictObject({
  operatingModel: z.enum(OPERATING_MODELS as [CalculatorForm["operatingModel"], ...CalculatorForm["operatingModel"][]]),
  values: z.strictObject(
    // laundryCost postdates saved forms: a payload without it means zero, exactly as parseStoredForm reads it.
    Object.fromEntries(NUMBER_FIELDS.map((f) => [f, f === "laundryCost" ? z.string().max(32).default("0") : z.string().max(32)])) as Record<
      (typeof NUMBER_FIELDS)[number],
      z.ZodString
    >,
  ),
  commission: z.strictObject({
    basis: z.enum(MANAGED_BASES as [CalculatorForm["commission"]["basis"], ...CalculatorForm["commission"]["basis"][]]),
    hybridMode: z.enum(["sum", "max"]),
    hybridBasis: z.enum(PERCENT_BASES as [CalculatorForm["commission"]["hybridBasis"], ...CalculatorForm["commission"]["hybridBasis"][]]),
    includeCleaningFees: z.boolean(),
  }),
});

/**
 * `units.calculator_inputs`: exactly `{ form, assumed }` (inputs only, never
 * results), a form the engine accepts, at most 8 KB as Postgres counts it.
 */
export const calculatorInputsSchema = z
  .strictObject({
    form: calculatorFormSchema,
    assumed: z.array(z.enum(ASSUMED_FIELDS as [StoredInputs["assumed"][number], ...StoredInputs["assumed"][number][]])).max(ASSUMED_FIELDS.length * 2),
  })
  .transform((x): StoredInputs => ({ form: x.form as CalculatorForm, assumed: [...new Set(x.assumed)] }))
  .refine((x) => parseCalculatorForm(x.form).ok, { message: "form_rejected_by_engine" })
  .refine((x) => jsonbTextBytes(x) <= CALCULATOR_INPUTS_MAX_BYTES, { message: "inputs_too_large" });

export const createUnitSchema = z.strictObject({
  name: unitNameSchema,
  inputs: calculatorInputsSchema,
});

export const updateUnitSchema = z
  .strictObject({
    id: unitIdSchema,
    name: unitNameSchema.optional(),
    inputs: calculatorInputsSchema.optional(),
  })
  .refine((x) => x.name !== undefined || x.inputs !== undefined, { message: "nothing_to_update" });

export const adoptGuestUnitSchema = z.strictObject({
  name: unitNameSchema,
  inputs: calculatorInputsSchema,
  apartmentCount: apartmentCountSchema.nullable(),
});

export type CreateUnitInput = z.input<typeof createUnitSchema>;
export type UpdateUnitInput = z.input<typeof updateUnitSchema>;
export type AdoptGuestUnitInput = z.input<typeof adoptGuestUnitSchema>;
