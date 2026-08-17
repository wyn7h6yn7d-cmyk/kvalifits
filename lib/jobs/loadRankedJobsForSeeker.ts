/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Job } from "@/components/jobs/types";
import { enrichJobsWithSeekerMatch } from "@/lib/jobs/enrichJobsWithSeekerMatch";
import { fetchSavedJobIdsForUser } from "@/lib/jobs/savedJobs";
import { sortJobs } from "@/lib/jobs/jobSearchSort";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import { isEmployerCompanyVerified } from "@/lib/employer/companyVerification";
import { experienceBackgroundFromDb } from "@/lib/seeker/experienceBackground";
import type { SeekerCertificateInput, SeekerMatchInput } from "@/lib/matching/calculateJobMatch";

const JOB_SELECT =
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,requirement_lines,job_requirements,requirements,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work";
const JOB_SELECT_LEGACY =
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,employer_profile_id,status,created_at,experience_level_required";

export async function loadRankedJobsForSeeker(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ jobs: Job[]; matchSortAvailable: boolean; savedJobIds: string[] }> {
  let { data: jobs, error: jobsErr } = await supabase
    .from("job_posts")
    .select(JOB_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(80);

  if (jobsErr && /column|requirement_lines|job_requirements|weekly_hours|published_at/i.test(jobsErr.message ?? "")) {
    const fallback = await supabase
      .from("job_posts")
      .select(JOB_SELECT_LEGACY)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(80);
    jobs = fallback.data as typeof jobs;
    jobsErr = fallback.error;
  }
  if (jobsErr) throw jobsErr;

  const openJobs = (jobs ?? []).filter((j: any) =>
    jobAcceptsApplications({
      status: j.status,
      published_at: j.published_at ?? null,
      application_deadline: j.application_deadline ?? null,
      expires_at: j.expires_at ?? null,
    }),
  );

  const employerIds = Array.from(
    new Set(openJobs.map((j: any) => j.employer_profile_id).filter(Boolean)),
  ) as string[];

  const employerById = new Map<
    string,
    { name: string; logoUrl: string | null; verified: boolean; slug: string | null }
  >();
  if (employerIds.length) {
    const withSlug = await supabase
      .from("employer_profiles")
      .select("id,company_name,logo_url,company_verified,verification_status,public_slug")
      .in("id", employerIds);
    const employerRows =
      withSlug.error && /public_slug/i.test(withSlug.error.message ?? "")
        ? await supabase
            .from("employer_profiles")
            .select("id,company_name,logo_url,company_verified,verification_status")
            .in("id", employerIds)
        : withSlug;
    if (!employerRows.error) {
      for (const e of employerRows.data ?? []) {
        employerById.set(e.id, {
          name: (e.company_name ?? "—").toString(),
          logoUrl: (e.logo_url ?? "").toString().trim() || null,
          verified: isEmployerCompanyVerified({
            company_verified: (e as { company_verified?: boolean | null }).company_verified,
            verification_status: (e as { verification_status?: string | null }).verification_status,
          }),
          slug: ((e as { public_slug?: string | null }).public_slug ?? "").toString().trim() || null,
        });
      }
    }
  }

  const mapped: Job[] = openJobs.map((j: any) => {
    const emp = employerById.get(j.employer_profile_id);
    const skills = ((j.required_skills as string[] | null) ?? []).map((x) => String(x).trim()).filter(Boolean);
    const experienceLevel = (j.experience_level_required ?? "").toString().trim() || null;
    return {
      id: j.id,
      title: (j.title ?? "").toString().trim() || "—",
      company: emp?.name ?? "—",
      companyLogoUrl: emp?.logoUrl ?? null,
      companyVerified: emp?.verified === true,
      companySlug: emp?.slug ?? null,
      location: (j.location ?? "").toString().trim() || "—",
      type: "—",
      summary: (j.short_summary ?? "").toString().trim() || undefined,
      createdAt: j.created_at ?? undefined,
      publishedAt: j.published_at ?? j.created_at ?? null,
      applicationDeadline: j.application_deadline ?? null,
      tags: skills.slice(0, 10),
      skills,
      requiredCerts: [],
      experienceLevel,
      openToFirstJob: experienceLevel === "not_required",
    };
  });

  const rawById = new Map(openJobs.map((j: any) => [j.id as string, j as Record<string, unknown>]));

  const { data: seekerRow } = await supabase
    .from("seeker_profiles")
    .select(
      "full_name,profile_title,location,about,skills,experience_level,preferred_job_types,preferred_locations,has_b_category_drivers_license,pref_full_time,pref_part_time,pref_remote_work,pref_hybrid_work,pref_on_site_work,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years,languages",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const seekerInput: SeekerMatchInput | null = seekerRow
    ? {
        profile_title: (seekerRow.profile_title ?? null) as string | null,
        full_name: (seekerRow.full_name ?? null) as string | null,
        location: (seekerRow.location ?? null) as string | null,
        about: (seekerRow.about ?? null) as string | null,
        skills: (seekerRow.skills as string[] | null) ?? null,
        experience_level: (seekerRow.experience_level ?? null) as string | null,
        preferred_job_types: (seekerRow.preferred_job_types as string[] | null) ?? null,
        preferred_locations: (seekerRow.preferred_locations as string[] | null) ?? null,
        has_b_category_drivers_license: seekerRow.has_b_category_drivers_license ?? null,
        experience_background: experienceBackgroundFromDb(seekerRow),
        languages: (seekerRow.languages as string[] | null) ?? null,
        pref_desired_weekly_hours: seekerRow.pref_desired_weekly_hours ?? null,
        pref_min_weekly_hours: seekerRow.pref_min_weekly_hours ?? null,
        pref_max_weekly_hours: seekerRow.pref_max_weekly_hours ?? null,
        pref_full_time: seekerRow.pref_full_time ?? null,
        pref_part_time: seekerRow.pref_part_time ?? null,
        pref_remote_work: seekerRow.pref_remote_work ?? null,
        pref_hybrid_work: seekerRow.pref_hybrid_work ?? null,
        pref_on_site_work: seekerRow.pref_on_site_work ?? null,
      }
    : null;

  const { data: certRows } = await supabase
    .from("seeker_certificates")
    .select("certificate_name,certificate_issuer,certificate_valid_until")
    .eq("user_id", userId);

  const certs: SeekerCertificateInput[] = (certRows ?? []).map((c) => ({
    certificate_name: c.certificate_name ?? null,
    certificate_issuer: c.certificate_issuer ?? null,
    certificate_valid_until: c.certificate_valid_until ?? null,
  }));

  const enriched = enrichJobsWithSeekerMatch(mapped, rawById, seekerInput, certs);
  const ranked = sortJobs(enriched.jobs, "match").filter((j) => typeof j.matchScore === "number");
  const savedJobIds = await fetchSavedJobIdsForUser(supabase, userId);

  return {
    jobs: ranked,
    matchSortAvailable: enriched.matchSortAvailable,
    savedJobIds,
  };
}
