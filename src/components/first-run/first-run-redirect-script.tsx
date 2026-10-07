import { FIRST_RUN_REDIRECT_SCRIPT } from "@/lib/guest/keys";

/** Server-rendered into Home's static HTML; see `FIRST_RUN_REDIRECT_SCRIPT`. */
export function FirstRunRedirectScript() {
  return <script dangerouslySetInnerHTML={{ __html: FIRST_RUN_REDIRECT_SCRIPT }} />;
}
