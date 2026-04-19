/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { employerCoreComplete, seekerCoreComplete } from "@/lib/matching/profileRules";
import { isSeekerAvatarFromStorageUpload } from "@/lib/seeker/seekerAvatarUpload";

type Role = "seeker" | "employer" | "admin";

export async function getRoleAndNextPath(locale: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, role: null, nextPath: `/${locale}/auth/login` };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const isBlocked = Boolean((profile as any)?.is_blocked);
  if (isBlocked) {
    return { user, role: null, nextPath: `/${locale}/blocked` };
  }

  const fallbackRole = user.user_metadata?.role;
  const role = (((profile as any)?.role ?? fallbackRole ?? null) as Role | null);
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
        "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: certRows } = await supabase
      .from("seeker_certificates")
      .select("id")
      .eq("user_id", user.id);

    const isComplete = seekerCoreComplete({
      avatarOk,
      seeker: seeker ?? null,
      certRowsWithImage: 0,
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
}

