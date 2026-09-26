import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip Next.js internals, static files and API routes (none exist yet).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
