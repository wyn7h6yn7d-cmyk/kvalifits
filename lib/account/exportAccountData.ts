/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Build a portable JSON export of the account holder's personal data.
 * Grouped by category so the user can see what we store.
 */
export async function exportAccountData(opts: {
  supabase: SupabaseClient;
  user: User;
}): Promise<Record<string, unknown>> {
  const { supabase, user } = opts;
  const userId = user.id;
  const exportedAt = new Date().toISOString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,created_at,updated_at,terms_version,privacy_version,terms_accepted_at")
    .eq("id", userId)
    .maybeSingle();

  const { data: seeker } = await supabase.from("seeker_profiles").select("*").eq("user_id", userId).maybeSingle();

  const { data: certificates } = await supabase
    .from("seeker_certificates")
    .select(
      "id,certificate_name,certificate_number,certificate_issuer,certificate_valid_from,certificate_valid_until,verification_status,verified_at,verification_source,created_at"
    )
    .eq("user_id", userId);

  const { data: education, error: educationErr } = await supabase
    .from("seeker_education")
    .select(
      "id,institution,field_of_study,degree_or_level,start_year,end_year,currently_studying,description,created_at,updated_at",
    )
    .eq("seeker_user_id", userId);
  const educationRows =
    educationErr && /does not exist|schema cache|relation|could not find/i.test(educationErr.message ?? "")
      ? []
      : education ?? [];

  const { data: workplaceNeeds } = await supabase
    .from("seeker_workplace_needs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: workCapacity } = await supabase
    .from("seeker_work_capacity")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: applications, error: applicationsErr } = await supabase
    .from("job_applications")
    .select(
      "id,job_post_id,created_at,status,status_updated_at,consent_to_share,cover_letter,application_answers,shared_profile"
    )
    .eq("seeker_user_id", userId);
  let jobApplications = applications ?? [];
  if (applicationsErr && /status_updated_at/i.test(applicationsErr.message ?? "")) {
    const fallback = await supabase
      .from("job_applications")
      .select(
        "id,job_post_id,created_at,status,consent_to_share,cover_letter,application_answers,shared_profile"
      )
      .eq("seeker_user_id", userId);
    if (!fallback.error) jobApplications = (fallback.data ?? []) as typeof jobApplications;
  } else if (applicationsErr && /status|column/i.test(applicationsErr.message ?? "")) {
    const fallback = await supabase
      .from("job_applications")
      .select("id,job_post_id,created_at,consent_to_share,cover_letter,application_answers,shared_profile")
      .eq("seeker_user_id", userId);
    if (!fallback.error) jobApplications = (fallback.data ?? []) as typeof jobApplications;
  }

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select(
      "id,company_name,registry_code,contact_email,contact_phone,website,company_description,location,industry,company_size,logo_url,company_verified,verification_status,verification_source,verified_at,created_at,updated_at"
    )
    .eq("owner_user_id", userId)
    .maybeSingle();

  let jobPosts: any[] = [];
  if (employer?.id) {
    const { data: jobs } = await supabase
      .from("job_posts")
      .select("id,title,status,location,created_at,updated_at,published_at")
      .eq("employer_profile_id", employer.id);
    jobPosts = jobs ?? [];
  }

  const { data: reports } = await supabase
    .from("job_post_reports")
    .select("id,job_post_id,reason,details,status,created_at")
    .eq("reporter_user_id", userId);

  let savedJobs: any[] = [];
  {
    const savedRes = await supabase
      .from("saved_jobs")
      .select("id,job_post_id,created_at")
      .eq("seeker_user_id", userId);
    if (!savedRes.error) savedJobs = savedRes.data ?? [];
  }

  let savedJobSearches: any[] = [];
  {
    const savedSearchRes = await supabase
      .from("saved_job_searches")
      .select(
        "id,name,query,filters,require_public_salary,min_match_percent,frequency,enabled,locale,created_at,updated_at",
      )
      .eq("seeker_user_id", userId);
    if (!savedSearchRes.error) savedJobSearches = savedSearchRes.data ?? [];
  }

  let notifications: any[] = [];
  {
    const notifRes = await supabase
      .from("notifications")
      .select("id,type,entity_type,entity_id,payload,created_at,read_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (!notifRes.error) notifications = notifRes.data ?? [];
  }

  return {
    exportVersion: 1,
    exportedAt,
    account: {
      userId,
      email: user.email ?? null,
      createdAt: user.created_at ?? null,
      lastSignInAt: (user as any).last_sign_in_at ?? null,
      role: (profile as any)?.role ?? (user.user_metadata as any)?.role ?? null,
      legalAcceptance: {
        termsVersion: (profile as any)?.terms_version ?? null,
        privacyVersion: (profile as any)?.privacy_version ?? null,
        termsAcceptedAt: (profile as any)?.terms_accepted_at ?? null,
      },
    },
    seekerProfile: seeker ?? null,
    certificates: certificates ?? [],
    education: educationRows,
    workplaceNeeds: workplaceNeeds ?? null,
    workCapacity: workCapacity ?? null,
    jobApplications,
    savedJobs: savedJobs ?? [],
    savedJobSearches: savedJobSearches ?? [],
    notifications: notifications ?? [],
    employerProfile: employer ?? null,
    jobPosts,
    jobPostReportsFiled: reports ?? [],
    notes: {
      et: "See fail on sinu isikuandmete koopia Kvalifitsi kontolt. Sertifikaadifailid ise võivad olla eraldi allalaaditavad seni, kuni konto on aktiivne.",
      en: "This file is a copy of your personal data from your Kvalifits account. Certificate files may be downloadable separately while the account is active.",
    },
  };
}
