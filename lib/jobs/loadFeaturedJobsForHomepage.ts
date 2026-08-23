import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";

import type { Job } from "@/components/jobs/types";
import { getCurrentAuth } from "@/lib/auth/currentAuth";
import { loadEmployerPublicRowsByIds } from "@/lib/companies/loadPublicEmployerFields";
import { isE2eOfflineSupabase } from "@/lib/e2e/offlineHarness";
import {
  mapPublishedJobToCard,
  type PublishedJobSearchRow,
} from "@/lib/jobs/mapPublishedJobToCard";
import { fetchSavedJobIdsForUser } from "@/lib/jobs/savedJobs";
import { applyCompactJobMatches, getJobMatchesForSeeker } from "@/lib/matching/getJobMatchesForSeeker";
import { loadSeekerMatchContext } from "@/lib/matching/seekerMatchContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FEATURED_LIMIT = 4;

const SELECT =
  "id,title,location,job_type,work_type,short_summary,description,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,salary_tax,salary_period,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,languages,is_featured,featured_from,featured_until";

function featuredColumnMissing(message: string | undefined) {
  return /is_featured|featured_from|featured_until|column/i.test(message ?? "");
}

async function queryFeaturedRows(supabase: SupabaseClient, nowIso: string) {
  return supabase
    .from("job_posts")
    .select(SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .lte("featured_from", nowIso)
    .gt("featured_until", nowIso)
    .order("featured_from", { ascending: false })
    .limit(FEATURED_LIMIT);
}

export type FeaturedHomepageJobsResult = {
  jobs: Job[];
  savedJobIds: string[];
  canSaveJobs: boolean;
};

export async function loadFeaturedJobsForHomepage(input: {
  supabase: SupabaseClient;
  locale: string;
  tJobs: (key: string) => string;
}): Promise<FeaturedHomepageJobsResult> {
  const empty = { jobs: [], savedJobIds: [], canSaveJobs: true };

  if (isE2eOfflineSupabase()) return empty;

  const nowIso = new Date().toISOString();
  const { data, error } = await queryFeaturedRows(input.supabase, nowIso);

  if (error) {
    if (featuredColumnMissing(error.message)) return empty;
    return empty;
  }

  let rows = (data ?? []) as PublishedJobSearchRow[];
  if (!rows.length) return empty;

  const employerIds = [
    ...new Set(rows.map((row) => (row.employer_profile_id ?? "").toString()).filter(Boolean)),
  ];
  if (employerIds.length) {
    const byId = await loadEmployerPublicRowsByIds(input.supabase, employerIds);
    rows = rows.map((row) => {
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

  let jobs = rows.map((row) => mapPublishedJobToCard(row, input.locale, input.tJobs));

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

export const getFeaturedJobsForHomepage = cache(async (locale: string): Promise<FeaturedHomepageJobsResult> => {
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const supabase = await createSupabaseServerClient();
  return loadFeaturedJobsForHomepage({
    supabase,
    locale,
    tJobs: (key) => tJobs(key as never),
  });
});
