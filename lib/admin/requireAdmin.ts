/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";

import { adminMfaRedirectPath, getAdminMfaStatus } from "@/lib/auth/adminMfa";
import { emailVerificationBlockReason } from "@/lib/auth/emailVerification";
import { getAuthUser } from "@/lib/auth/currentAuth";
import { getProfileSecurity } from "@/lib/auth/profileSecurity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Auth + admin role only (used by MFA setup so enrollment is not blocked by AAL2). */
export async function requireAdminIdentity(locale: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser();

  if (!user) redirect(`/${locale}/auth/login`);

  if (emailVerificationBlockReason(user) === "unverified") {
    await supabase.auth.signOut({ scope: "local" });
    redirect(`/${locale}/auth/login?error=email_not_confirmed`);
  }

  const security = await getProfileSecurity(user.id);
  if (security.isBlocked) {
    redirect(`/${locale}/blocked`);
  }

  const metaRole = (user.user_metadata as any)?.role;
  const role = security.role ?? metaRole ?? null;

  if (role !== "admin") redirect(`/${locale}/account`);

  return { supabase, user };
}

/** Full admin gate including MFA challenge / enrollment when applicable. */
export async function requireAdmin(locale: string) {
  const { supabase, user } = await requireAdminIdentity(locale);
  const mfa = await getAdminMfaStatus(supabase);
  const nextPath = `/${locale}/admin`;
  const mfaRedirect = adminMfaRedirectPath(locale, mfa, nextPath);
  if (mfaRedirect) redirect(mfaRedirect);
  return { supabase, user, mfa };
}
