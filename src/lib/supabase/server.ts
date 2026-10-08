import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseEnv } from "./env";

export type ServerSupabase = SupabaseClient<Database>;

/**
 * A Supabase client for one server action or route handler, acting as the
 * signed-in person: the publishable key plus their session cookies, so Row
 * Level Security applies exactly as in the browser. Null when accounts are
 * not configured. A refreshed session is written back through the cookies,
 * which server actions and route handlers are allowed to set.
 */
export async function createServerSupabase(): Promise<ServerSupabase | null> {
  const env = supabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(env.url, env.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
      },
    },
  });
}
