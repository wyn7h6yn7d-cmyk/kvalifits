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

  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      "id,job_post_id,created_at,consent_to_share,cover_letter,application_answers,employer_status,shared_profile"
    )
    .eq("seeker_user_id", userId);

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
    workplaceNeeds: workplaceNeeds ?? null,
    workCapacity: workCapacity ?? null,
    jobApplications: applications ?? [],
    employerProfile: employer ?? null,
    jobPosts,
    jobPostReportsFiled: reports ?? [],
    notes: {
      et: "See fail on sinu isikuandmete koopia Kvalifitsi kontolt. Sertifikaadifailid ise võivad olla eraldi allalaaditavad seni, kuni konto on aktiivne.",
      en: "This file is a copy of your personal data from your Kvalifits account. Certificate files may be downloadable separately while the account is active.",
    },
  };
}
