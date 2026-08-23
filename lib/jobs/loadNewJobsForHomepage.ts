import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";

import type { Job } from "@/components/jobs/types";
import { getCurrentAuth } from "@/lib/auth/currentAuth";
import { loadEmployerPublicRowsByIds } from "@/lib/companies/loadPublicEmployerFields";
import { isE2eOfflineSupabase } from "@/lib/e2e/offlineHarness";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import {
  mapPublishedJobToCard,
  type PublishedJobSearchRow,
} from "@/lib/jobs/mapPublishedJobToCard";
import { fetchSavedJobIdsForUser } from "@/lib/jobs/savedJobs";
import { applyCompactJobMatches, getJobMatchesForSeeker } from "@/lib/matching/getJobMatchesForSeeker";
import { loadSeekerMatchContext } from "@/lib/matching/seekerMatchContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NEW_JOBS_LIMIT = 6;
const QUERY_LIMIT = 24;

const SELECT =
  "id,title,location,job_type,work_type,short_summary,description,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,salary_tax,salary_period,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,languages,is_featured,featured_from,featured_until";

function isCurrentlyFeatured(row: PublishedJobSearchRow, nowIso: string) {
  const featured = row as PublishedJobSearchRow & {
    is_featured?: boolean | null;
    featured_from?: string | null;
    featured_until?: string | null;
  };
  if (!featured.is_featured) return false;
  const from = featured.featured_from ? Date.parse(featured.featured_from) : NaN;
  const until = featured.featured_until ? Date.parse(featured.featured_until) : NaN;
  const now = Date.parse(nowIso);
  if (Number.isNaN(now)) return false;
  if (!Number.isNaN(from) && now < from) return false;
  if (!Number.isNaN(until) && now >= until) return false;
  return true;
}

async function queryLatestPublishedRows(supabase: SupabaseClient) {
  const primary = await supabase
    .from("job_posts")
    .select(SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(QUERY_LIMIT);

  if (!primary.error) return primary;

  if (/published_at|application_deadline|expires_at|column/i.test(primary.error.message ?? "")) {
    return supabase
      .from("job_posts")
      .select(SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMIT);
  }

  return primary;
}

export type NewHomepageJobsResult = {
  jobs: Job[];
  savedJobIds: string[];
  canSaveJobs: boolean;
};

export async function loadNewJobsForHomepage(input: {
  supabase: SupabaseClient;
  locale: string;
  tJobs: (key: string) => string;
}): Promise<NewHomepageJobsResult> {
  const empty = { jobs: [], savedJobIds: [], canSaveJobs: true };

  if (isE2eOfflineSupabase()) return empty;

  const nowIso = new Date().toISOString();
  const { data, error } = await queryLatestPublishedRows(input.supabase);

  if (error) {
    return empty;
  }

  return finalizeNewJobs((data ?? []) as PublishedJobSearchRow[], input, nowIso, empty);
}

async function finalizeNewJobs(
  rows: PublishedJobSearchRow[],
  input: { supabase: SupabaseClient; locale: string; tJobs: (key: string) => string },
  nowIso: string,
  empty: NewHomepageJobsResult,
): Promise<NewHomepageJobsResult> {
  const open = rows.filter(
    (row) =>
      jobAcceptsApplications({
        status: (row.status ?? null) as string | null,
        published_at: (row.published_at ?? null) as string | null,
        application_deadline: (row.application_deadline ?? null) as string | null,
        expires_at: (row.expires_at ?? null) as string | null,
      }) && !isCurrentlyFeatured(row, nowIso),
  );

  const picked = open.slice(0, NEW_JOBS_LIMIT);
  if (!picked.length) return empty;

  const employerIds = [
    ...new Set(picked.map((row) => (row.employer_profile_id ?? "").toString()).filter(Boolean)),
  ];
  let enriched = picked;
  if (employerIds.length) {
    const byId = await loadEmployerPublicRowsByIds(input.supabase, employerIds);
    enriched = picked.map((row) => {
      const emp = byId.get((row.employer_profile_id ?? "").toString());
      if (!emp) return row;
      return {
        ...row,
        company_name: emp.company_name,
        logo_url: emp.logo_url,
        company_verified: emp.company_verified,
        verification_status: emp.verification_status,
        industry: emp.industry,
        public_slug: emp.public_slug,
      };
    });
  }

  let jobs = enriched.map((row) => mapPublishedJobToCard(row, input.locale, input.tJobs));

  const auth = await getCurrentAuth();
  const userId = auth.userId;
  const role = auth.role;
  const canSaveJobs = !role || role === "seeker";

  if (userId && role === "seeker" && jobs.length) {
    const context = await loadSeekerMatchContext(userId);
    const matched = await getJobMatchesForSeeker({
      supabase: input.supabase,
      userId,
      jobIds: jobs.map((job) => job.id),
      context,
    });
    jobs = applyCompactJobMatches(jobs, matched.byId);
  }

  let savedJobIds: string[] = [];
  if (userId && role === "seeker") {
    savedJobIds = await fetchSavedJobIdsForUser(input.supabase, userId);
  }

  return { jobs, savedJobIds, canSaveJobs };
}

export const getNewJobsForHomepage = cache(async (locale: string): Promise<NewHomepageJobsResult> => {
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const supabase = await createSupabaseServerClient();
  return loadNewJobsForHomepage({
    supabase,
    locale,
    tJobs: (key) => tJobs(key as never),
  });
});
