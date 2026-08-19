import { cache } from "react";

import { getAuthUser } from "@/lib/auth/currentAuth";
import { getProfileSecurity } from "@/lib/auth/profileSecurity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailVerificationBlockReason } from "@/lib/auth/emailVerification";
import { employerCoreComplete } from "@/lib/matching/profileRules";
import { seekerCoreComplete } from "@/lib/seeker/profileCompleteness";
import { isSeekerAvatarFromStorageUpload } from "@/lib/seeker/seekerAvatarUpload";

type Role = "seeker" | "employer" | "admin";

/** One onboarding/role resolution per locale per request. Uses cached getAuthUser(). */
export const getRoleAndNextPath = cache(async (locale: string) => {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser();

  if (!user) {
    return { user: null, role: null, nextPath: `/${locale}/auth/login` };
  }

  if (emailVerificationBlockReason(user) === "unverified") {
    await supabase.auth.signOut({ scope: "local" });
    return {
      user: null,
      role: null,
      nextPath: `/${locale}/auth/login?error=email_not_confirmed`,
    };
  }

  const security = await getProfileSecurity(user.id);
  if (security.isBlocked) {
    return { user, role: null, nextPath: `/${locale}/blocked` };
  }

  const fallbackRole = user.user_metadata?.role;
  const role = ((security.role ?? fallbackRole ?? null) as Role | null);
  if (!role) {
    return { user, role: null, nextPath: `/${locale}/auth/register` };
  }

  if (role === "admin") {
    return { user, role, nextPath: `/${locale}/admin` };
  }

  if (role === "seeker") {
    const avatarOk = isSeekerAvatarFromStorageUpload(user.user_metadata?.avatar_url as string | undefined);
    const { data: seeker } = await supabase
      .from("seeker_profiles")
      .select(
        "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,date_of_birth,learning_obligation_status"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const isComplete = seekerCoreComplete({
      avatarOk,
      seeker: seeker ?? null,
    });
    return {
      user,
      role,
      nextPath: isComplete ? `/${locale}/account/seeker` : `/${locale}/onboarding/seeker`,
    };
  }

  // employer
  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("company_name,contact_email,company_description,location,industry")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  const isComplete = employerCoreComplete(employer ?? null);

  return {
    user,
    role,
    nextPath: isComplete ? `/${locale}/account/employer` : `/${locale}/onboarding/employer`,
  };
});

