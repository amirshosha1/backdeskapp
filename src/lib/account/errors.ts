/**
 * Every way an account request can fail, as the app names it. The server
 * actions return these (never raw database messages), and each one has its
 * own Arabic and English copy under `account.errors` in messages/.
 */
export const ACCOUNT_ERRORS = [
  "not_configured",
  "not_signed_in",
  "superseded",
  "identity_changed",
  "session_expired",
  "unit_limit_reached",
  "shared_org_requires_owner_transfer",
  "forbidden",
  "invalid",
  "not_found",
  "network",
  "unknown",
] as const;
export type AccountError = (typeof ACCOUNT_ERRORS)[number];

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: AccountError };

/** The parts of a PostgREST error (and its HTTP status) this mapping reads. */
export interface DbErrorLike {
  code?: string | null;
  message?: string | null;
}

/**
 * A Data API (PostgREST) error → the app's error. The order matters: the
 * known P0001 messages come from our database functions and triggers.
 */
export function mapDbError(error: DbErrorLike | null | undefined, status?: number): AccountError {
  if (!error) return "unknown";
  const code = error.code ?? "";
  const message = error.message ?? "";
  if (code === "P0001") {
    if (message === "unit_limit_reached") return "unit_limit_reached";
    if (message === "shared_org_requires_owner_transfer") return "shared_org_requires_owner_transfer";
    return "unknown";
  }
  if (code === "42501") return "forbidden";
  // PostgREST's JWT errors (invalid, expired, claims) and plain 401s.
  if (/^PGRST30[0-3]$/.test(code) || status === 401) return "session_expired";
  if (code === "PGRST116") return "not_found";
  // Integrity (23…) and data (22…) errors: a value the constraints refuse.
  if (/^2[23][0-9A-Z]{3}$/.test(code) || code === "PGRST204") return "invalid";
  // postgrest-js turns a failed fetch into status 0 with an empty code.
  if (status === 0 || (code === "" && /^(FetchError|TypeError|AbortError)\b/.test(message))) return "network";
  return "unknown";
}

/** The parts of an auth-js error this mapping reads. */
export interface AuthErrorLike {
  name?: string;
  status?: number;
}

/** An auth-js error while reading the session → the app's error. */
export function mapAuthError(error: AuthErrorLike | null | undefined): AccountError {
  if (!error) return "not_signed_in";
  if (error.name === "AuthSessionMissingError") return "not_signed_in";
  if (error.name === "AuthRetryableFetchError" || error.status === 0) return "network";
  // An expired session whose refresh failed, a revoked session, a bad token.
  return "session_expired";
}
