import { admin } from "./db";

/**
 * Builds src/types/database.ts from the migrated test database, in the
 * shape supabase-js expects (`Database["public"]["Tables"][…]["Row" |
 * "Insert" | "Update" | "Relationships"]`, `Functions`). Claude's Supabase
 * connector cannot see the Backdesk project and the Supabase CLI's
 * generator needs Docker, so the types come from the same migrations the
 * hosted project runs (CLAUDE.md §4).
 *
 * One deliberate difference from Supabase's generator: Insert and Update
 * list only the columns the `authenticated` role is granted. Every other
 * column is `?: never`, so the compiler refuses a write the database would
 * reject with 42501. Tables and functions `authenticated` cannot reach are
 * left out.
 *
 * Any column type or function signature not mapped below throws, so a new
 * migration that needs one fails loudly here instead of producing `unknown`.
 */

const TS_TYPE: Record<string, string> = {
  uuid: "string",
  text: "string",
  bpchar: "string",
  varchar: "string",
  timestamptz: "string",
  timestamp: "string",
  date: "string",
  int2: "number",
  int4: "number",
  int8: "number",
  numeric: "number",
  float4: "number",
  float8: "number",
  bool: "boolean",
  json: "Json",
  jsonb: "Json",
};

interface Column {
  name: string;
  typname: string;
  nullable: boolean;
  hasDefault: boolean;
  canSelect: boolean;
  canInsert: boolean;
  canUpdate: boolean;
}

interface Relationship {
  name: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}

function tsType(table: string, column: Column): string {
  const base = TS_TYPE[column.typname];
  if (!base) throw new Error(`db types: no TypeScript type for ${table}.${column.name} (${column.typname}); add it to TS_TYPE`);
  return column.nullable ? `${base} | null` : base;
}

const list = (items: string[]) => `[${items.map((i) => JSON.stringify(i)).join(", ")}]`;

async function tables(): Promise<{ oid: number; name: string }[]> {
  const { rows } = await admin.query(
    `select c.oid::int as oid, c.relname as name
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('r', 'p')
        and has_any_column_privilege('authenticated', c.oid, 'SELECT')
      order by c.relname`,
  );
  return rows as { oid: number; name: string }[];
}

async function columns(oid: number): Promise<Column[]> {
  const { rows } = await admin.query(
    `select a.attname as name,
            t.typname,
            not a.attnotnull as nullable,
            (a.atthasdef or a.attidentity <> '' or a.attgenerated <> '') as "hasDefault",
            has_column_privilege('authenticated', c.oid, a.attnum, 'SELECT') as "canSelect",
            has_column_privilege('authenticated', c.oid, a.attnum, 'INSERT') as "canInsert",
            has_column_privilege('authenticated', c.oid, a.attnum, 'UPDATE') as "canUpdate"
       from pg_attribute a
       join pg_class c on c.oid = a.attrelid
       join pg_type t on t.oid = a.atttypid
      where c.oid = $1 and a.attnum > 0 and not a.attisdropped
      order by a.attname`,
    [oid],
  );
  return rows as Column[];
}

/** Foreign keys to other tables in `public` (references to auth.users are not reachable through the Data API). */
async function relationships(oid: number): Promise<Relationship[]> {
  const { rows } = await admin.query(
    `select con.conname as name,
            array(select a.attname from unnest(con.conkey) with ordinality k(attnum, i)
                  join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum order by k.i)::text[] as columns,
            exists (
              select 1 from pg_index ix
               where ix.indrelid = con.conrelid and ix.indisunique
                 and (select array_agg(x order by x) from unnest(ix.indkey::int2[]) x)
                   = (select array_agg(x order by x) from unnest(con.conkey) x)
            ) as "isOneToOne",
            ref.relname as "referencedRelation",
            array(select a.attname from unnest(con.confkey) with ordinality k(attnum, i)
                  join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.attnum order by k.i)::text[] as "referencedColumns"
       from pg_constraint con
       join pg_class ref on ref.oid = con.confrelid
       join pg_namespace rn on rn.oid = ref.relnamespace
      where con.contype = 'f' and con.conrelid = $1 and rn.nspname = 'public'
      order by con.conname`,
    [oid],
  );
  return rows as Relationship[];
}

async function functions(): Promise<{ name: string; args: number; returns: string; setof: boolean }[]> {
  const { rows } = await admin.query(
    `select p.proname as name, p.pronargs::int as args, p.prorettype::regtype::text as returns, p.proretset as setof
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.prokind = 'f'
        and p.prorettype <> 'trigger'::regtype
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
      order by p.proname`,
  );
  return rows as { name: string; args: number; returns: string; setof: boolean }[];
}

export async function generateDatabaseTypes(): Promise<string> {
  const out: string[] = [];
  out.push(
    "// Generated by `pnpm db:types` from supabase/migrations/ (tests/db/types.ts).",
    "// Do not edit by hand: `pnpm test:db` fails when this file is out of date.",
    "// Insert and Update list only the columns the `authenticated` role is",
    "// granted; every other column is `never`, so TypeScript refuses to write it.",
    "",
    "export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];",
    "",
    "export type Database = {",
    "  public: {",
    "    Tables: {",
  );

  for (const table of await tables()) {
    const cols = await columns(table.oid);
    out.push(`      ${table.name}: {`);
    out.push("        Row: {");
    for (const c of cols.filter((c) => c.canSelect)) out.push(`          ${c.name}: ${tsType(table.name, c)};`);
    out.push("        };");
    out.push("        Insert: {");
    for (const c of cols) {
      if (!c.canInsert) out.push(`          ${c.name}?: never;`);
      else out.push(`          ${c.name}${c.nullable || c.hasDefault ? "?" : ""}: ${tsType(table.name, c)};`);
    }
    out.push("        };");
    out.push("        Update: {");
    for (const c of cols) out.push(`          ${c.name}?: ${c.canUpdate ? tsType(table.name, c) : "never"};`);
    out.push("        };");
    const rels = await relationships(table.oid);
    if (rels.length === 0) {
      out.push("        Relationships: [];");
    } else {
      out.push("        Relationships: [");
      for (const r of rels) {
        out.push(
          "          {",
          `            foreignKeyName: ${JSON.stringify(r.name)};`,
          `            columns: ${list(r.columns)};`,
          `            isOneToOne: ${r.isOneToOne};`,
          `            referencedRelation: ${JSON.stringify(r.referencedRelation)};`,
          `            referencedColumns: ${list(r.referencedColumns)};`,
          "          },",
        );
      }
      out.push("        ];");
    }
    out.push("      };");
  }

  out.push("    };", "    Views: { [_ in never]: never };", "    Functions: {");
  for (const fn of await functions()) {
    if (fn.args !== 0 || fn.setof || fn.returns !== "void") {
      throw new Error(`db types: public.${fn.name} has a signature the generator does not map yet (args or a return value); extend tests/db/types.ts`);
    }
    out.push(`      ${fn.name}: { Args: never; Returns: undefined };`);
  }
  out.push(
    "    };",
    "    Enums: { [_ in never]: never };",
    "    CompositeTypes: { [_ in never]: never };",
    "  };",
    "};",
    "",
    'type PublicSchema = Database["public"];',
    "",
    'export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];',
    'export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];',
    'export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];',
    "",
  );
  return out.join("\n");
}
