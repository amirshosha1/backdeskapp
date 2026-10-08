/**
 * The two Supabase values the app uses. Both are public by design: they
 * ship in every browser, and Row Level Security is what protects the data
 * (docs/SETUP_AUTH.md). No secret or service-role key exists anywhere in
 * the app. While either is unset (local dev, e2e builds, CI), accounts are
 * off: every account entry point is hidden and the app is visitor-only.
 *
 * Each variable is read by its literal name so Next.js can inline it into
 * the browser bundle.
 */
export interface SupabaseEnv {
  url: string;
  key: string;
  /** The auth cookie's name: `sb-<project ref>-auth-token` (split into `.0`, `.1`… when long). */
  authCookie: string;
}

export function supabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  let ref: string;
  try {
    ref = new URL(url).hostname.split(".")[0]!;
  } catch {
    return null;
  }
  return { url, key, authCookie: `sb-${ref}-auth-token` };
}

/** Whether a `document.cookie` string holds a Supabase session cookie (possibly chunked). */
export function hasAuthCookie(cookieHeader: string, authCookie: string): boolean {
  const escaped = authCookie.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|;\\s*)${escaped}(?:\\.\\d+)?=[^;]`).test(cookieHeader);
}
