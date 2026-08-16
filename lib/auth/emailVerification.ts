import type { User } from "@supabase/supabase-js";

/**
 * Email verification policy.
 * Default: require verified email for authenticated app use.
 * Set AUTH_REQUIRE_EMAIL_VERIFICATION=0 only for local/dev with confirmations disabled.
 */
export function requireEmailVerification(): boolean {
  return process.env.AUTH_REQUIRE_EMAIL_VERIFICATION !== "0";
}

export function isEmailVerified(user: User | null | undefined): boolean {
  if (!user) return false;
  // Supabase sets email_confirmed_at when confirmations are off or after verify.
  if (user.email_confirmed_at) return true;
  // Some payloads expose confirmed_at
  const confirmedAt = (user as { confirmed_at?: string | null }).confirmed_at;
  return Boolean(confirmedAt);
}

export function emailVerificationBlockReason(user: User | null | undefined): "unverified" | null {
  if (!requireEmailVerification()) return null;
  if (!user) return null;
  return isEmailVerified(user) ? null : "unverified";
}
