"use server";

import { ENGINE_VERSION } from "@/lib/finance/version";
import { createServerSupabase, type ServerSupabase } from "@/lib/supabase/server";
import type { StoredInputs } from "@/lib/calculator/stored-inputs";
import type { Json } from "@/types/database";
import { decideAdoption } from "./adoption";
import { mapAuthError, mapDbError, type AccountError, type ActionResult } from "./errors";
import { adoptGuestUnitSchema, apartmentCountSchema, createUnitSchema, unitIdSchema, updateUnitSchema } from "./schemas";
import { UNIT_COLUMNS, type UnitRow } from "./units";

/**
 * Every write the app makes to the account (Batch 3 decision: writes go
 * through server actions with Zod, reads go from the browser). Each action
 * validates its input, then acts as the signed-in person with the
 * publishable key and their session cookies, so the database's grants, Row
 * Level Security and triggers decide what is allowed — these actions add
 * clear errors, not security. There is no service-role or secret key.
 *
 * Writes use only the columns granted to `authenticated` (enforced by the
 * generated types): org_id, name, operating_model, calculator_inputs and
 * engine_version on insert; the same minus org_id on update.
 */

type Session = { supabase: ServerSupabase; userId: string };

async function session(): Promise<Session | AccountError> {
  const supabase = await createServerSupabase();
  if (!supabase) return "not_configured";
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return mapAuthError(error);
  return { supabase, userId };
}

const fail = (error: AccountError) => ({ ok: false, error }) as const;

/** The org the person's apartments go to: their personal org (one per person until Phase 5 teams). */
async function editableOrgId({ supabase, userId }: Session): Promise<{ orgId: string } | { error: AccountError }> {
  const { data, error, status } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .in("role", ["owner", "admin", "member"])
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) return { error: mapDbError(error, status) };
  return data ? { orgId: data.org_id } : { error: "forbidden" };
}

async function insertUnit(s: Session, orgId: string, name: string, inputs: StoredInputs): Promise<ActionResult<UnitRow>> {
  const { data, error, status } = await s.supabase
    .from("units")
    .insert({
      org_id: orgId,
      name,
      operating_model: inputs.form.operatingModel,
      calculator_inputs: inputs as unknown as Json,
      engine_version: ENGINE_VERSION,
    })
    .select(UNIT_COLUMNS)
    .single();
  if (error || !data) return fail(mapDbError(error, status));
  return { ok: true, data };
}

/** Adds an apartment to the account. At the limit the database refuses (P0001) and this returns unit_limit_reached. */
export async function createUnit(input: unknown): Promise<ActionResult<UnitRow>> {
  const parsed = createUnitSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const s = await session();
  if (typeof s === "string") return fail(s);
  const org = await editableOrgId(s);
  if ("error" in org) return fail(org.error);
  return insertUnit(s, org.orgId, parsed.data.name, parsed.data.inputs);
}

/** Renames an apartment and/or saves its calculator inputs. operating_model always follows the inputs. */
export async function updateUnit(input: unknown): Promise<ActionResult<UnitRow>> {
  const parsed = updateUnitSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const s = await session();
  if (typeof s === "string") return fail(s);
  const { id, name, inputs } = parsed.data;
  const { data, error, status } = await s.supabase
    .from("units")
    .update({
      ...(name !== undefined ? { name } : {}),
      ...(inputs !== undefined
        ? { calculator_inputs: inputs as unknown as Json, operating_model: inputs.form.operatingModel, engine_version: ENGINE_VERSION }
        : {}),
    })
    .eq("id", id)
    .select(UNIT_COLUMNS)
    .maybeSingle();
  if (error) return fail(mapDbError(error, status));
  // Row Level Security hides other accounts' rows: 0 rows changed reads as "not found".
  if (!data) return fail("not_found");
  return { ok: true, data };
}

export async function deleteUnit(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = unitIdSchema.safeParse(id);
  if (!parsed.success) return fail("invalid");
  const s = await session();
  if (typeof s === "string") return fail(s);
  const { data, error, status } = await s.supabase.from("units").delete().eq("id", parsed.data).select("id").maybeSingle();
  if (error) return fail(mapDbError(error, status));
  if (!data) return fail("not_found");
  return { ok: true, data };
}

export type AdoptionOutcome = { outcome: "added"; unit: UnitRow } | { outcome: "duplicate"; unitId: string } | { outcome: "ask" };

/**
 * The browser's apartment at sign-in (src/lib/account/adoption.ts): added
 * when the account has none, recognised when the account already has the
 * same numbers, otherwise the person is asked. Decided here, from a fresh
 * read of the account, never from what the browser believes.
 */
export async function adoptGuestUnit(input: unknown): Promise<ActionResult<AdoptionOutcome>> {
  const parsed = adoptGuestUnitSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const s = await session();
  if (typeof s === "string") return fail(s);
  const { data: units, error, status } = await s.supabase.from("units").select("id, calculator_inputs");
  if (error || !units) return fail(mapDbError(error, status));
  const decision = decideAdoption(parsed.data.inputs, units);
  if (decision.kind === "duplicate") return { ok: true, data: { outcome: "duplicate", unitId: decision.unitId } };
  if (decision.kind === "ask") return { ok: true, data: { outcome: "ask" } };
  const org = await editableOrgId(s);
  if ("error" in org) return fail(org.error);
  const added = await insertUnit(s, org.orgId, parsed.data.name, parsed.data.inputs);
  return added.ok ? { ok: true, data: { outcome: "added", unit: added.data } } : added;
}

/**
 * The first-run answer "how many apartments". `onlyIfEmpty` is the copy
 * made at sign-in from the browser: it never replaces an answer the
 * account already has.
 */
export async function saveApartmentCount(answer: unknown, onlyIfEmpty = false): Promise<ActionResult<{ saved: boolean }>> {
  const parsed = apartmentCountSchema.safeParse(answer);
  if (!parsed.success || typeof onlyIfEmpty !== "boolean") return fail("invalid");
  const s = await session();
  if (typeof s === "string") return fail(s);
  let query = s.supabase.from("profiles").update({ apartment_count_answer: parsed.data }).eq("user_id", s.userId);
  if (onlyIfEmpty) query = query.is("apartment_count_answer", null);
  const { data, error, status } = await query.select("user_id");
  if (error) return fail(mapDbError(error, status));
  return { ok: true, data: { saved: (data ?? []).length > 0 } };
}

/**
 * Deletes the signed-in person's account through public.delete_my_account()
 * (no service-role key: the function acts on auth.uid() only), then signs
 * this device out. If the deletion fails, nothing is signed out.
 */
export async function deleteMyAccount(): Promise<ActionResult> {
  const s = await session();
  if (typeof s === "string") return fail(s);
  const { error, status } = await s.supabase.rpc("delete_my_account");
  if (error) return fail(mapDbError(error, status));
  // The auth user and its sessions are gone; this clears the cookies. auth-js
  // treats the server's "session not found" as already signed out.
  await s.supabase.auth.signOut({ scope: "local" });
  return { ok: true, data: undefined };
}
