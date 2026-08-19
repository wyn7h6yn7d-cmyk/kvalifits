import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { authGateBody, evaluateAuthGate, NOT_AUTHENTICATED_ERROR, type AuthGateFailure } from "@/lib/auth/accountBlocked";
import { getAuthUser } from "@/lib/auth/currentAuth";
import { getProfileSecurity } from "@/lib/auth/profileSecurity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  ok: true;
  user: User;
  role: "seeker" | "employer" | "admin" | null;
  isBlocked: false;
  supabase: SupabaseClient;
};

/**
 * Shared server-side gate for authenticated API routes.
 * Resolves the Auth user, loads profiles.is_blocked, and rejects blocked accounts.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser | AuthGateFailure> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser();
  const security = user ? await getProfileSecurity(user.id) : null;
  const gate = evaluateAuthGate({ user, security });
  if (!gate.ok) return gate;
  if (!user) return { ok: false, status: 401, error: NOT_AUTHENTICATED_ERROR };
  return { ok: true, user, role: gate.role, supabase, isBlocked: false };
}

const AUTH_JSON_HEADERS = { "Cache-Control": "private, no-store" } as const;

export function authGateJson(
  gate: AuthGateFailure,
  opts?: { unauthenticatedError?: string },
): NextResponse {
  return NextResponse.json(authGateBody(gate, opts?.unauthenticatedError), {
    status: gate.status,
    headers: AUTH_JSON_HEADERS,
  });
}
