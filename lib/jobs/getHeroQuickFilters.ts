import { cache } from "react";

import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import { type HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ORDER: HeroQuickFilterId[] = ["remote", "full_time", "public_salary", "first_job"];

const LIFECYCLE = "status,published_at,application_deadline,expires_at";

type LifecycleRow = {
  status?: unknown;
  published_at?: unknown;
  application_deadline?: unknown;
  expires_at?: unknown;
};

function anyAccepting(rows: LifecycleRow[] | null | undefined): boolean {
  return (rows ?? []).some((row) =>
    jobAcceptsApplications({
      status: (row.status ?? null) as string | null,
      published_at: (row.published_at ?? null) as string | null,
      application_deadline: (row.application_deadline ?? null) as string | null,
      expires_at: (row.expires_at ?? null) as string | null,
    }),
  );
}

/**
 * Existence samples for the four hero chips — not a 300-row catalog dump.
 * Expired jobs are still filtered client-side via jobAcceptsApplications.
 */
export const getHeroQuickFilters = cache(async (): Promise<HeroQuickFilterId[]> => {
  const supabase = await createSupabaseServerClient();

  const [remote, fullTime, salary, firstJob] = await Promise.all([
    supabase.from("job_posts").select(LIFECYCLE).eq("status", "published").eq("work_type", "remote").limit(12),
    supabase.from("job_posts").select(LIFECYCLE).eq("status", "published").eq("job_type", "full_time").limit(12),
    supabase
      .from("job_posts")
      .select(LIFECYCLE)
      .eq("status", "published")
      .or("salary_min.not.is.null,salary_max.not.is.null")
      .limit(12),
    supabase
      .from("job_posts")
      .select(LIFECYCLE)
      .eq("status", "published")
      .eq("experience_level_required", "not_required")
      .limit(12),
  ]);

  const failed = [remote, fullTime, salary, firstJob].some(
    (r) => r.error && /column/i.test(r.error.message ?? ""),
  );
  if (failed) return [];

  const available = new Set<HeroQuickFilterId>();
  if (anyAccepting(remote.data as LifecycleRow[] | null)) available.add("remote");
  if (anyAccepting(fullTime.data as LifecycleRow[] | null)) available.add("full_time");
  if (anyAccepting(salary.data as LifecycleRow[] | null)) available.add("public_salary");
  if (anyAccepting(firstJob.data as LifecycleRow[] | null)) available.add("first_job");

  return ORDER.filter((id) => available.has(id));
});
