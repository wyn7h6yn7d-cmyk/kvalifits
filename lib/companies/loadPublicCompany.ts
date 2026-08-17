import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PUBLIC_COMPANY_SELECT,
  PUBLIC_COMPANY_SELECT_LEGACY,
  isMissingDbObjectError,
  isUuid,
  mapPublicCompanyRow,
  type PublicCompany,
} from "@/lib/companies/publicCompany";
import {
  formatJobSalaryDisplay,
  isJobSalaryPeriod,
  isJobSalaryTax,
} from "@/lib/jobs/jobSalary";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";

export type PublicCompanyJob = {
  id: string;
  title: string;
  location: string;
  salary?: string;
  publishedAt: string | null;
};

const JOB_SELECT_FULL =
  "id,title,location,status,published_at,created_at,application_deadline,expires_at,salary_min,salary_max,salary_currency,salary_tax,salary_period";
const JOB_SELECT_MID =
  "id,title,location,status,created_at,salary_min,salary_max,salary_currency,salary_tax,salary_period";
const JOB_SELECT_LEGACY = "id,title,location,status,created_at,salary_min,salary_max,salary_currency";

async function fetchBySlugOrId(
  supabase: SupabaseClient,
  table: "employer_public_profiles" | "employer_profiles",
  select: string,
  slug: string,
): Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }> {
  const bySlug = await supabase.from(table).select(select).eq("public_slug", slug).maybeSingle();
  if (!bySlug.error && bySlug.data) {
    return { data: bySlug.data as unknown as Record<string, unknown>, error: null };
  }
  if (bySlug.error && !isMissingDbObjectError(bySlug.error.message) && !/public_slug/i.test(bySlug.error.message ?? "")) {
    return { data: null, error: bySlug.error };
  }
  if (isUuid(slug)) {
    const byId = await supabase.from(table).select(select).eq("id", slug).maybeSingle();
    if (byId.error && !isMissingDbObjectError(byId.error.message)) {
      return { data: null, error: byId.error };
    }
    return { data: (byId.data as unknown as Record<string, unknown> | null) ?? null, error: byId.error };
  }
  return { data: null, error: bySlug.error };
}

export async function loadPublicCompanyBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<PublicCompany | null> {
  const key = slug.trim();
  if (!key) return null;

  const fromView = await fetchBySlugOrId(supabase, "employer_public_profiles", PUBLIC_COMPANY_SELECT, key);
  if (fromView.data) return finalizePublicCompany(supabase, fromView.data);
  if (fromView.error && !isMissingDbObjectError(fromView.error.message) && !/public_slug/i.test(fromView.error.message ?? "")) {
    throw fromView.error;
  }

  const fromTable = await fetchBySlugOrId(supabase, "employer_profiles", PUBLIC_COMPANY_SELECT, key);
  if (fromTable.data) return finalizePublicCompany(supabase, fromTable.data);
  if (fromTable.error && !isMissingDbObjectError(fromTable.error.message) && !/public_slug/i.test(fromTable.error.message ?? "")) {
    throw fromTable.error;
  }

  const legacy = await fetchBySlugOrId(supabase, "employer_profiles", PUBLIC_COMPANY_SELECT_LEGACY, key);
  if (legacy.error && !isMissingDbObjectError(legacy.error.message) && !/public_slug/i.test(legacy.error.message ?? "")) {
    throw legacy.error;
  }
  return finalizePublicCompany(supabase, legacy.data);
}

async function finalizePublicCompany(
  supabase: SupabaseClient,
  row: Record<string, unknown> | null,
): Promise<PublicCompany | null> {
  const mapped = row ? mapPublicCompanyRow(row) : null;
  if (!mapped) return null;
  return (await companyHasPublishedJob(supabase, mapped.id)) ? mapped : null;
}

async function companyHasPublishedJob(supabase: SupabaseClient, employerProfileId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("job_posts")
    .select("id", { count: "exact", head: true })
    .eq("employer_profile_id", employerProfileId)
    .eq("status", "published");
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function loadActiveJobsForPublicCompany(
  supabase: SupabaseClient,
  employerProfileId: string,
  locale: string,
  tJobs: (key: string) => string,
): Promise<PublicCompanyJob[]> {
  let { data, error } = await supabase
    .from("job_posts")
    .select(JOB_SELECT_FULL)
    .eq("employer_profile_id", employerProfileId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  if (error && /published_at|application_deadline|expires_at|column/i.test(error.message ?? "")) {
    const mid = await supabase
      .from("job_posts")
      .select(JOB_SELECT_MID)
      .eq("employer_profile_id", employerProfileId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);
    data = mid.data as typeof data;
    error = mid.error;
  }
  if (error && /salary_|column/i.test(error.message ?? "")) {
    const legacy = await supabase
      .from("job_posts")
      .select(JOB_SELECT_LEGACY)
      .eq("employer_profile_id", employerProfileId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);
    data = legacy.data as typeof data;
    error = legacy.error;
  }
  if (error) throw error;

  const jobs: PublicCompanyJob[] = [];
  for (const row of data ?? []) {
    const j = row as {
      id: string;
      title?: string | null;
      location?: string | null;
      status?: string | null;
      published_at?: string | null;
      created_at?: string | null;
      application_deadline?: string | null;
      expires_at?: string | null;
      salary_min?: number | null;
      salary_max?: number | null;
      salary_currency?: string | null;
      salary_tax?: string | null;
      salary_period?: string | null;
    };
    if (
      !jobAcceptsApplications({
        status: j.status,
        published_at: j.published_at,
        application_deadline: j.application_deadline,
        expires_at: j.expires_at,
      })
    ) {
      continue;
    }
    const tax = isJobSalaryTax(j.salary_tax) ? j.salary_tax : null;
    const period = isJobSalaryPeriod(j.salary_period) ? j.salary_period : null;
    jobs.push({
      id: String(j.id),
      title: (j.title ?? "").toString().trim() || "—",
      location: (j.location ?? "").toString().trim() || "—",
      salary: formatJobSalaryDisplay({
        min: j.salary_min ?? null,
        max: j.salary_max ?? null,
        currency: j.salary_currency,
        tax,
        period,
        locale,
        taxLabel: tax ? tJobs(`jobSalaryTaxShort.${tax}`) : "",
        periodLabel: period ? tJobs(`jobSalaryPeriodOption.${period}`) : "",
      }),
      publishedAt: j.published_at ?? j.created_at ?? null,
    });
  }
  return jobs;
}
