/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Job } from "@/components/jobs/types";
import { applyCompactJobMatches, getJobMatchesForSeeker } from "@/lib/matching/getJobMatchesForSeeker";
import { loadSeekerMatchContext } from "@/lib/matching/seekerMatchContext";
import { fetchSavedJobIdsForUser } from "@/lib/jobs/savedJobs";
import { sortJobs } from "@/lib/jobs/jobSearchSort";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import { isEmployerCompanyVerified } from "@/lib/employer/companyVerification";
import { loadEmployerPublicRowsByIds } from "@/lib/companies/loadPublicEmployerFields";

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
    const employerRows = await loadEmployerPublicRowsByIds(supabase, employerIds);
    for (const [id, e] of employerRows) {
      employerById.set(id, {
        name: (e.company_name ?? "—").toString(),
        logoUrl: (e.logo_url ?? "").toString().trim() || null,
        verified: isEmployerCompanyVerified({
          company_verified: (e.company_verified as boolean | null | undefined) ?? null,
          verification_status: (e.verification_status as string | null | undefined) ?? null,
        }),
        slug: ((e.public_slug ?? "") as string).toString().trim() || null,
      });
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

  const jobInputs = new Map(openJobs.map((j: any) => [j.id as string, j as Record<string, unknown>]));
  const context = await loadSeekerMatchContext(userId);
  const matched = await getJobMatchesForSeeker({
    supabase,
    userId,
    jobIds: mapped.map((j) => j.id),
    context,
    jobInputs,
  });
  const ranked = sortJobs(applyCompactJobMatches(mapped, matched.byId), "match").filter(
    (j) => typeof j.matchScore === "number",
  );
  const savedJobIds = await fetchSavedJobIdsForUser(supabase, userId);

  return {
    jobs: ranked,
    matchSortAvailable: matched.matchSortAvailable,
    savedJobIds,
  };
}
