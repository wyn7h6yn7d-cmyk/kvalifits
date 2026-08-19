import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { workplaceNeedsFromDb } from "@/lib/seeker/workplaceNeeds";
import { workCapacityFromDb } from "@/lib/seeker/workCapacity";
import { coerceEducationRows, isEducationTableMissing } from "@/lib/seeker/education";

const SEEKER_SELECT =
  "full_name,profile_title,phone,location,about,skills,skill_ids,profession_id,languages,language_ids,experience_level,preferred_job_types,preferred_locations,profile_visible,salary_expectation,work_authorization_notes,cv_url,has_b_category_drivers_license,date_of_birth,learning_obligation_status,is_minor,legal_representative_consent_status,pref_full_time,pref_part_time,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,pref_day_work,pref_evening_work,pref_night_work,pref_shift_work,pref_weekend_work,pref_flexible_hours,pref_remote_work,pref_hybrid_work,pref_on_site_work,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years";

const SEEKER_SELECT_LEGACY =
  "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,profile_visible,salary_expectation,work_authorization_notes,cv_url,has_b_category_drivers_license,date_of_birth,learning_obligation_status,is_minor,legal_representative_consent_status,pref_full_time,pref_part_time,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,pref_day_work,pref_evening_work,pref_night_work,pref_shift_work,pref_weekend_work,pref_flexible_hours,pref_remote_work,pref_hybrid_work,pref_on_site_work,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years";

const CERT_SELECT =
  "id,certificate_id,certificate_name,certificate_number,certificate_issuer,certificate_valid_from,certificate_valid_until,certificate_image_url,verification_status,verified_at,verification_source,verified_by";
const CERT_SELECT_LEGACY =
  "id,certificate_name,certificate_number,certificate_issuer,certificate_valid_from,certificate_valid_until,certificate_image_url";

const EDUCATION_SELECT =
  "id,seeker_user_id,institution,field_of_study,degree_or_level,start_year,end_year,currently_studying,description,created_at,updated_at";

export async function loadSeekerProfileFormData(user: User) {
  const supabase = await createSupabaseServerClient();

  let seekerQuery = await supabase.from("seeker_profiles").select(SEEKER_SELECT).eq("user_id", user.id).maybeSingle();
  if (seekerQuery.error && /column|schema cache/i.test(seekerQuery.error.message ?? "")) {
    seekerQuery = await supabase.from("seeker_profiles").select(SEEKER_SELECT_LEGACY).eq("user_id", user.id).maybeSingle();
  }
  const { data: seeker } = seekerQuery;

  const certQuery = await supabase
    .from("seeker_certificates")
    .select(CERT_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  let certs = certQuery.data;
  if (certQuery.error && /verification_|column/i.test(certQuery.error.message ?? "")) {
    const fallback = await supabase
      .from("seeker_certificates")
      .select(CERT_SELECT_LEGACY)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    certs = fallback.data as typeof certs;
  }

  const { data: workplaceNeedsRow } = await supabase
    .from("seeker_workplace_needs")
    .select(
      "accessible_workplace,flexible_hours,extra_breaks,adapted_tools,adapted_arrangement,remote_option,other_need,other_note,shared_with_employer,share_practical_needs_with_employer",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: workCapacityRow } = await supabase
    .from("seeker_work_capacity")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  const eduQuery = await supabase
    .from("seeker_education")
    .select(EDUCATION_SELECT)
    .eq("seeker_user_id", user.id);
  const education =
    eduQuery.error && isEducationTableMissing(eduQuery.error.message)
      ? []
      : coerceEducationRows(eduQuery.data);

  return {
    userId: user.id,
    email: user.email ?? "",
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    linkedin_url: (user.user_metadata?.linkedin_url as string | undefined) ?? null,
    seeker: seeker ?? null,
    certificates: certs ?? [],
    education,
    workplaceNeeds: workplaceNeedsFromDb(workplaceNeedsRow ?? null),
    workCapacity: workCapacityFromDb(workCapacityRow ?? null),
  };
}
