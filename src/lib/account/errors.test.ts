// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mapAuthError, mapDbError } from "./errors";

describe("mapDbError", () => {
  it("names the apartment limit only for the trigger's own P0001", () => {
    expect(mapDbError({ code: "P0001", message: "unit_limit_reached" }, 400)).toBe("unit_limit_reached");
    expect(mapDbError({ code: "P0001", message: "something else" }, 400)).toBe("unknown");
    expect(mapDbError({ code: "P0001", message: "unit_limit_reached!" }, 400)).toBe("unknown");
  });

  it("maps a missing grant or an RLS refusal to forbidden", () => {
    expect(mapDbError({ code: "42501", message: 'new row violates row-level security policy for table "units"' }, 403)).toBe("forbidden");
  });

  it("maps PostgREST's JWT errors and 401s to session_expired", () => {
    for (const code of ["PGRST300", "PGRST301", "PGRST302", "PGRST303"]) expect(mapDbError({ code, message: "JWT expired" }, 401)).toBe("session_expired");
    expect(mapDbError({ code: "", message: "" }, 401)).toBe("session_expired");
  });

  it("maps constraint and data errors to invalid", () => {
    for (const code of ["23514", "23502", "23503", "22P02", "22001", "PGRST204"]) expect(mapDbError({ code, message: "x" }, 400)).toBe("invalid");
  });

  it("maps 'no rows' to not_found", () => {
    expect(mapDbError({ code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" }, 406)).toBe("not_found");
  });

  it("maps a failed fetch to network", () => {
    expect(mapDbError({ code: "", message: "TypeError: fetch failed" }, 0)).toBe("network");
    expect(mapDbError({ code: "", message: "FetchError: The user aborted a request." })).toBe("network");
  });

  it("maps anything else to unknown", () => {
    expect(mapDbError(null)).toBe("unknown");
    expect(mapDbError({ code: "XX000", message: "internal" }, 500)).toBe("unknown");
    expect(mapDbError({ code: "", message: "" }, 500)).toBe("unknown");
  });
});

describe("mapAuthError", () => {
  it("no session means not signed in", () => {
    expect(mapAuthError(null)).toBe("not_signed_in");
    expect(mapAuthError({ name: "AuthSessionMissingError", status: 400 })).toBe("not_signed_in");
  });

  it("a network failure is network", () => {
    expect(mapAuthError({ name: "AuthRetryableFetchError", status: 0 })).toBe("network");
  });

  it("anything else (a refresh that failed, a revoked session, a bad token) is session_expired", () => {
    expect(mapAuthError({ name: "AuthApiError", status: 400 })).toBe("session_expired");
    expect(mapAuthError({ name: "AuthInvalidJwtError", status: 400 })).toBe("session_expired");
  });
});
