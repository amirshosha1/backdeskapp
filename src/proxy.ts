import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip Next.js internals, static files, API routes (none exist yet) and
  // the sign-in callback, which is a route handler outside the locales:
  // Supabase must find it at exactly /auth/callback.
  matcher: ["/((?!api|auth/callback|_next|.*\\..*).*)"],
};
