/** Safe API error code — never include profile columns. */
export const ACCOUNT_BLOCKED_ERROR = "account_blocked" as const;
export const NOT_AUTHENTICATED_ERROR = "not_authenticated" as const;

export type ProfileSecurityRole = "seeker" | "employer" | "admin";

export type ProfileSecurity = {
  role: ProfileSecurityRole | null;
  isBlocked: boolean;
  lookupFailed?: boolean;
};

export type AuthGateOk = {
  ok: true;
  userId: string;
  role: ProfileSecurityRole | null;
};

export type AuthGateFailure = {
  ok: false;
  status: 401 | 403;
  error: typeof NOT_AUTHENTICATED_ERROR | typeof ACCOUNT_BLOCKED_ERROR;
};

export type AuthGateResult = AuthGateOk | AuthGateFailure;

export function emptyProfileSecurity(): ProfileSecurity {
  return { role: null, isBlocked: false, lookupFailed: false };
}

export function profileLookupFailed(): ProfileSecurity {
  return { role: null, isBlocked: false, lookupFailed: true };
}

export function profileSecurityFromRow(row: { role?: unknown; is_blocked?: unknown } | null): ProfileSecurity {
  const role = row?.role;
  const ok = role === "seeker" || role === "employer" || role === "admin";
  return {
    role: ok ? role : null,
    isBlocked: Boolean(row?.is_blocked),
    lookupFailed: false,
  };
}

/**
 * Single authorization decision for an already-resolved user + profile security row.
 * Blocked accounts are forbidden even when the JWT is still valid.
 */
export function evaluateAuthGate(input: {
  user: { id: string } | null;
  security: ProfileSecurity | null;
}): AuthGateResult {
  if (!input.user) {
    return { ok: false, status: 401, error: NOT_AUTHENTICATED_ERROR };
  }
  if (input.security?.lookupFailed) {
    return { ok: false, status: 403, error: ACCOUNT_BLOCKED_ERROR };
  }
  if (input.security?.isBlocked) {
    return { ok: false, status: 403, error: ACCOUNT_BLOCKED_ERROR };
  }
  return {
    ok: true,
    userId: input.user.id,
    role: input.security?.role ?? null,
  };
}

/** After password auth succeeds: a blocked profile must not keep a usable session. */
export function loginSessionAllowed(security: ProfileSecurity | null): boolean {
  if (!security || security.lookupFailed) return false;
  return !security.isBlocked;
}

/** Leftover JWT after an admin block: PostgREST writes must not proceed. */
export function blockedSessionMayMutate(security: ProfileSecurity | null): boolean {
  return Boolean(security) && !security?.lookupFailed && !security?.isBlocked;
}

/** Postgres SQLSTATE raised by reject_blocked_user_dml. */
export const BLOCKED_WRITE_SQLSTATE = "42501";

export function isBlockedAccountWriteError(err: { code?: string | null; message?: string | null } | null): boolean {
  if (!err) return false;
  const code = (err.code ?? "").toString();
  const message = (err.message ?? "").toLowerCase();
  return code === BLOCKED_WRITE_SQLSTATE || message.includes("account_blocked");
}

export function authGateBody(gate: AuthGateFailure, unauthenticatedError?: string): { error: string } {
  if (gate.status === 401) {
    return { error: unauthenticatedError ?? NOT_AUTHENTICATED_ERROR };
  }
  return { error: ACCOUNT_BLOCKED_ERROR };
}
