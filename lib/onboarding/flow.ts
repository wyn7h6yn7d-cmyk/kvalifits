import { createSupabaseServerClient } from "@/lib/supabase/server";

type Role = "seeker" | "employer";

function nonEmpty(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? null) as Role | null;
  if (!role) {
    return { user, role: null, nextPath: `/${locale}/auth/register` };
  }

  if (role === "seeker") {
    const avatarOk = nonEmpty(user.user_metadata?.avatar_url);
    const { data: seeker } = await supabase
      .from("seeker_profiles")
      .select(
        "full_name,phone,location,profile_title,about,skills,experience_level,preferred_job_types,preferred_locations,is_complete"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const { count: certCount } = await supabase
      .from("seeker_certificates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const completeByFlag = Boolean(seeker?.is_complete);
    const completeByFields =
      avatarOk &&
      nonEmpty(seeker?.full_name) &&
      nonEmpty(seeker?.phone) &&
      nonEmpty(seeker?.location) &&
      nonEmpty(seeker?.profile_title) &&
      nonEmpty(seeker?.about) &&
      nonEmpty(seeker?.experience_level) &&
      Array.isArray(seeker?.skills) &&
      seeker!.skills.length >= 1 &&
      Array.isArray(seeker?.preferred_job_types) &&
      seeker!.preferred_job_types.length >= 1 &&
      Array.isArray(seeker?.preferred_locations) &&
      seeker!.preferred_locations.length >= 1 &&
      (certCount ?? 0) >= 1;

    const isComplete = completeByFlag || completeByFields;
    return {
      user,
      role,
      nextPath: isComplete ? `/${locale}` : `/${locale}/onboarding/seeker`,
    };
  }

  // employer
  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("company_name,contact_email,company_description,location")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  const isComplete =
    nonEmpty(employer?.company_name) &&
    nonEmpty(employer?.contact_email) &&
    nonEmpty(employer?.company_description) &&
    nonEmpty(employer?.location);

  return {
    user,
    role,
    nextPath: isComplete ? `/${locale}/tooandjatele` : `/${locale}/onboarding/employer`,
  };
}

