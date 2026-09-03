import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

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

function accepts(row: LifecycleRow | null | undefined): boolean {
  if (!row) return false;
  return jobAcceptsApplications({
    status: (row.status ?? null) as string | null,
    published_at: (row.published_at ?? null) as string | null,
    application_deadline: (row.application_deadline ?? null) as string | null,
    expires_at: (row.expires_at ?? null) as string | null,
  });
}

async function newestPublished(
  supabase: SupabaseClient,
  apply: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    q: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any,
) {
  let q = supabase.from("job_posts").select(LIFECYCLE).eq("status", "published");
  q = apply(q);
  return q.order("published_at", { ascending: false, nullsFirst: false }).limit(1);
}

/**
 * Existence probes for hero chips — one newest row per chip (limit 1).
 */
export const getHeroQuickFilters = cache(async (): Promise<HeroQuickFilterId[]> => {
  const supabase = await createSupabaseServerClient();

  const [remote, fullTime, salary, firstJob] = await Promise.all([
    newestPublished(supabase, (q) => q.eq("work_type", "remote")),
    newestPublished(supabase, (q) => q.eq("job_type", "full_time")),
    newestPublished(supabase, (q) => q.or("salary_min.not.is.null,salary_max.not.is.null")),
    newestPublished(supabase, (q) => q.eq("experience_level_required", "not_required")),
  ]);

  const failed = [remote, fullTime, salary, firstJob].some(
    (r) => r.error && /column/i.test(r.error.message ?? ""),
  );
  if (failed) return [];

  const available = new Set<HeroQuickFilterId>();
  if (accepts((remote.data as LifecycleRow[] | null)?.[0])) available.add("remote");
  if (accepts((fullTime.data as LifecycleRow[] | null)?.[0])) available.add("full_time");
  if (accepts((salary.data as LifecycleRow[] | null)?.[0])) available.add("public_salary");
  if (accepts((firstJob.data as LifecycleRow[] | null)?.[0])) available.add("first_job");

  return ORDER.filter((id) => available.has(id));
});
