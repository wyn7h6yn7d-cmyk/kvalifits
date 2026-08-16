/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";

import { adminMfaRedirectPath, getAdminMfaStatus } from "@/lib/auth/adminMfa";
import { emailVerificationBlockReason } from "@/lib/auth/emailVerification";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Auth + admin role only (used by MFA setup so enrollment is not blocked by AAL2). */
export async function requireAdminIdentity(locale: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  if (emailVerificationBlockReason(user) === "unverified") {
    await supabase.auth.signOut({ scope: "local" });
    redirect(`/${locale}/auth/login?error=email_not_confirmed`);
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const metaRole = (user.user_metadata as any)?.role;
  const role = (profileErr ? metaRole : profile?.role) ?? metaRole ?? null;

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
