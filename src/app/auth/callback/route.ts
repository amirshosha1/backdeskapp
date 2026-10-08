import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { FLASH_COOKIE, FLASH_COOKIE_MAX_AGE, NEXT_COOKIE, safeNextPath } from "@/lib/auth/next-path";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Where Google sign-in returns (through Supabase Auth): exactly
 * /auth/callback, the only path in Supabase's redirect allow-list. Supabase
 * adds `?code=…` (PKCE); the code verifier is the cookie the browser client
 * set when sign-in started. The exchange stores the session in cookies.
 *
 * Then: back to the page the person started from, read from the `bd_next`
 * cookie and accepted only if it is one of the app's own pages
 * (safeNextPath). If Google or Supabase reports an error, or the exchange
 * fails, the same page opens with a one-shot `bd_flash` cookie that shows
 * "sign-in didn't complete": no error ever goes into a URL.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const next = safeNextPath(cookieStore.get(NEXT_COOKIE)?.value);
  const params = request.nextUrl.searchParams;
  const code = params.get("code");

  let signedIn = false;
  if (code && !params.has("error")) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      signedIn = !error;
    }
  }

  cookieStore.delete(NEXT_COOKIE);
  if (!signedIn) {
    cookieStore.set(FLASH_COOKIE, "signin_failed", {
      path: "/",
      maxAge: FLASH_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }

  // A relative Location: the browser resolves it against the callback's own
  // origin. request.url is not trusted for the host (under `next start` it
  // reports the configured hostname, not the one the browser used), and a
  // jump to another host would lose the session cookies just set.
  return new NextResponse(null, { status: 303, headers: { Location: next, "Cache-Control": "no-store" } });
}
