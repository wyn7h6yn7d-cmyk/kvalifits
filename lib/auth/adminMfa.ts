import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Admin MFA readiness helpers (TOTP).
 *
 * Soft mode (default): if the admin has a verified TOTP factor, require AAL2.
 * Hard mode: set ADMIN_MFA_ENFORCE=1 to require enrollment + AAL2 for all admins.
 */
export function adminMfaEnforceEnrollment(): boolean {
  return process.env.ADMIN_MFA_ENFORCE === "1";
}

export type AdminMfaStatus = {
  currentLevel: "aal1" | "aal2" | string;
  nextLevel: "aal1" | "aal2" | string | null;
  hasVerifiedTotp: boolean;
  needsEnrollment: boolean;
  needsChallenge: boolean;
};

export async function getAdminMfaStatus(supabase: SupabaseClient): Promise<AdminMfaStatus> {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedTotp = Boolean(factors?.totp?.some((f) => f.status === "verified"));
  const currentLevel = (aal?.currentLevel ?? "aal1") as string;
  const nextLevel = (aal?.nextLevel ?? null) as string | null;
  const enforce = adminMfaEnforceEnrollment();

  const needsEnrollment = enforce && !hasVerifiedTotp;
  const needsChallenge =
    hasVerifiedTotp && currentLevel !== "aal2" && (nextLevel === "aal2" || hasVerifiedTotp);

  return {
    currentLevel,
    nextLevel,
    hasVerifiedTotp,
    needsEnrollment,
    needsChallenge,
  };
}

export function adminMfaRedirectPath(
  locale: string,
  status: AdminMfaStatus,
  nextPath: string
): string | null {
  if (status.needsEnrollment) {
    return `/${locale}/admin/security?setup=1&next=${encodeURIComponent(nextPath)}`;
  }
  if (status.needsChallenge) {
    return `/${locale}/auth/mfa?next=${encodeURIComponent(nextPath)}`;
  }
  return null;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export type { User };
