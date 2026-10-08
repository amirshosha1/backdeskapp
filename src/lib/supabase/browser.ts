import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseEnv } from "./env";

export type BrowserSupabase = SupabaseClient<Database>;

let client: Promise<BrowserSupabase> | null = null;

/**
 * The browser's Supabase client, loaded on demand: a visitor who has never
 * signed in downloads none of it. Null when accounts are not configured.
 * The session lives in cookies (@supabase/ssr), so server actions and the
 * sign-in callback see the same session; PKCE is the default flow.
 */
export function loadBrowserSupabase(): Promise<BrowserSupabase> | null {
  const env = supabaseEnv();
  if (!env) return null;
  client ??= import("@supabase/ssr").then(({ createBrowserClient }) => createBrowserClient<Database>(env.url, env.key));
  return client;
}
