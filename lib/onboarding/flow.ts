import { createSupabaseServerClient } from "@/lib/supabase/server";
import { employerCoreComplete, seekerCoreComplete } from "@/lib/matching/profileRules";

type Role = "seeker" | "employer" | "admin";

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
    const avatarOk = nonEmpty(user.user_metadata?.avatar_url);
    const { data: seeker } = await supabase
      .from("seeker_profiles")
      .select(
        "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,is_complete"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: certRows } = await supabase
      .from("seeker_certificates")
      .select("certificate_image_url")
      .eq("user_id", user.id);

    const certWithImage = (certRows ?? []).filter((c) => (c.certificate_image_url ?? "").toString().trim().length > 0)
      .length;

    const completeByFlag = Boolean(seeker?.is_complete);
    const completeByFields = seekerCoreComplete({
      avatarOk,
      seeker: seeker ?? null,
      certRowsWithImage: certWithImage,
    });

    const isComplete = completeByFlag || completeByFields;
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

