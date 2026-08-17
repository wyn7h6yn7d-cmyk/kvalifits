import type { SupabaseClient } from "@supabase/supabase-js";

import type { Job } from "@/components/jobs/types";
import type { FacetOption, JobFilterFacet, JobFilterSelection } from "@/lib/jobs/jobSearchFacets";
import { ALL_JOB_FILTER_FACETS, SALARY_BUCKETS } from "@/lib/jobs/jobSearchFacets";
import { enrichJobsWithSeekerMatch } from "@/lib/jobs/enrichJobsWithSeekerMatch";
import { parseJobSearchParams } from "@/lib/jobs/jobSearchUrl";
import { selectionsFromSearchParams, sortFromParams } from "@/lib/jobs/jobSearchState";
import { sortJobs, type JobSearchSort } from "@/lib/jobs/jobSearchSort";
import {
  canonicalJobTypeKey,
  canonicalWorkTypeKey,
  mapJobType,
  mapPublishedJobToCard,
  mapWorkType,
  type PublishedJobSearchRow,
} from "@/lib/jobs/mapPublishedJobToCard";
import { fetchSavedJobIdsForUser } from "@/lib/jobs/savedJobs";
import { seekerCanUseMatchRanking } from "@/lib/jobs/seekerMatchRanking";
import { experienceBackgroundFromDb } from "@/lib/seeker/experienceBackground";
import type { SeekerCertificateInput, SeekerMatchInput } from "@/lib/matching/calculateJobMatch";

export const JOB_SEARCH_PAGE_SIZE = 20;
export const JOB_SEARCH_MATCH_CANDIDATE_CAP = 200;

export type JobSearchPageResult = {
  jobs: Job[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  facetOptions: Record<JobFilterFacet, FacetOption[]>;
  matchSortAvailable: boolean;
  savedJobIds: string[];
  canSaveJobs: boolean;
  sort: JobSearchSort;
};

type RpcArgs = {
  p_query: string | null;
  p_locations: string[] | null;
  p_titles: string[] | null;
  p_domains: string[] | null;
  p_job_types: string[] | null;
  p_work_types: string[] | null;
  p_salary_buckets: string[] | null;
  p_experience: string[] | null;
  p_skills: string[] | null;
  p_certs: string[] | null;
  p_languages: string[] | null;
  p_has_salary: boolean;
  p_sort: string;
  p_page: number;
  p_page_size: number;
};

function emptyArr(values: string[]): string[] | null {
  return values.length ? values : null;
}

function sanitizeQuery(raw: string | undefined): string | null {
  const q = (raw ?? "").trim().slice(0, 200).replace(/[%_]/g, " ");
  return q || null;
}

function valuesForFacet(selections: JobFilterSelection[], facet: JobFilterFacet): string[] {
  return selections.filter((s) => s.facet === facet).map((s) => s.value.trim()).filter(Boolean);
}

export function rpcArgsFromSearch(params: {
  query?: string;
  hasSalary?: boolean;
  selections: JobFilterSelection[];
  sort: JobSearchSort;
  page: number;
  pageSize: number;
}): RpcArgs {
  const jobTypes = valuesForFacet(params.selections, "jobType")
    .map((v) => canonicalJobTypeKey(v) ?? v.trim().toLowerCase().replace(/-/g, "_"))
    .filter(Boolean);
  const workTypes = valuesForFacet(params.selections, "workType")
    .map((v) => canonicalWorkTypeKey(v) ?? v.trim().toLowerCase().replace(/-/g, "_"))
    .filter(Boolean);
  const salaryBuckets = valuesForFacet(params.selections, "salary").filter((id) =>
    SALARY_BUCKETS.some((b) => b.id === id),
  );

  return {
    p_query: sanitizeQuery(params.query),
    p_locations: emptyArr(valuesForFacet(params.selections, "location")),
    p_titles: emptyArr(valuesForFacet(params.selections, "title")),
    p_domains: emptyArr(valuesForFacet(params.selections, "domain")),
    p_job_types: emptyArr(jobTypes),
    p_work_types: emptyArr(workTypes),
    p_salary_buckets: emptyArr(salaryBuckets),
    p_experience: emptyArr(valuesForFacet(params.selections, "experience")),
    p_skills: emptyArr(valuesForFacet(params.selections, "skill")),
    p_certs: emptyArr(valuesForFacet(params.selections, "cert")),
    p_languages: emptyArr(valuesForFacet(params.selections, "language")),
    p_has_salary: Boolean(params.hasSalary),
    p_sort: params.sort === "match" ? "newest" : params.sort,
    p_page: params.page,
    p_page_size: params.pageSize,
  };
}

function parseRpcPayload(raw: unknown): {
  jobs: PublishedJobSearchRow[];
  total_count: number;
  current_page: number;
  total_pages: number;
  page_size: number;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const jobs = Array.isArray(o.jobs) ? (o.jobs as PublishedJobSearchRow[]) : [];
  const total_count = Number(o.total_count) || 0;
  const page_size = Number(o.page_size) || JOB_SEARCH_PAGE_SIZE;
  const current_page = Math.max(1, Number(o.current_page) || 1);
  const total_pages = Math.max(1, Number(o.total_pages) || 1);
  return { jobs, total_count, current_page, total_pages, page_size };
}

function emptyFacets(): Record<JobFilterFacet, FacetOption[]> {
  const map = {} as Record<JobFilterFacet, FacetOption[]>;
  for (const f of ALL_JOB_FILTER_FACETS) map[f] = [];
  return map;
}

function parseFacetsPayload(
  raw: unknown,
  tJobs: (key: string) => string,
): Record<JobFilterFacet, FacetOption[]> {
  const out = emptyFacets();
  if (!raw || typeof raw !== "object") return out;
  const o = raw as Record<string, unknown>;
  for (const facet of ALL_JOB_FILTER_FACETS) {
    const list = o[facet];
    if (!Array.isArray(list)) continue;
    out[facet] = list
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const value = ((item as { value?: unknown }).value ?? "").toString().trim();
        const count = Number((item as { count?: unknown }).count) || 0;
        if (!value) return null;
        if (facet === "jobType") {
          const label = mapJobType(value, tJobs) ?? value;
          return { value: label, count };
        }
        if (facet === "workType") {
          const label = mapWorkType(value, tJobs) ?? value;
          return { value: label, count };
        }
        return { value, count };
      })
      .filter((x): x is FacetOption => Boolean(x));
  }
  return out;
}

function rpcMissing(message: string | undefined) {
  return /function|schema cache|does not exist|search_published_jobs/i.test(message ?? "");
}

async function callSearchRpc(supabase: SupabaseClient, args: RpcArgs) {
  const { data, error } = await supabase.rpc("search_published_jobs", args);
  if (error) {
    if (rpcMissing(error.message)) return { payload: null as ReturnType<typeof parseRpcPayload>, error };
    return { payload: null as ReturnType<typeof parseRpcPayload>, error };
  }
  return { payload: parseRpcPayload(data), error: null };
}

export async function loadPublishedJobSearch(input: {
  supabase: SupabaseClient;
  locale: string;
  searchParams: Record<string, string | string[] | undefined>;
  tJobs: (key: string) => string;
}): Promise<JobSearchPageResult> {
  const { supabase, locale, searchParams, tJobs } = input;
  const parsed = parseJobSearchParams(searchParams);
  const selections = selectionsFromSearchParams(parsed, tJobs);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    role = (profile?.role ?? user.user_metadata?.role ?? null) as string | null;
  }
  const canSaveJobs = !role || role === "seeker";

  let seekerInput: SeekerMatchInput | null = null;
  let certs: SeekerCertificateInput[] = [];
  if (user && role === "seeker") {
    const { data: seekerRow } = await supabase
      .from("seeker_profiles")
      .select(
        "full_name,profile_title,location,about,skills,experience_level,preferred_job_types,preferred_locations,has_b_category_drivers_license,pref_full_time,pref_part_time,pref_remote_work,pref_hybrid_work,pref_on_site_work,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years,languages",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    seekerInput = seekerRow
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
      .eq("user_id", user.id);
    certs = (certRows ?? []).map((c) => ({
      certificate_name: c.certificate_name ?? null,
      certificate_issuer: c.certificate_issuer ?? null,
      certificate_valid_until: c.certificate_valid_until ?? null,
    }));
  }

  const matchSortAvailable = seekerCanUseMatchRanking(seekerInput);
  const sort = sortFromParams(parsed, matchSortAvailable);
  const page = parsed.page ?? 1;
  const useMatchSort = sort === "match" && matchSortAvailable;

  const args = rpcArgsFromSearch({
    query: parsed.query,
    hasSalary: parsed.hasSalary,
    selections,
    sort,
    page: useMatchSort ? 1 : page,
    pageSize: useMatchSort ? JOB_SEARCH_MATCH_CANDIDATE_CAP : JOB_SEARCH_PAGE_SIZE,
  });

  let payload = (await callSearchRpc(supabase, args)).payload;
  if (!payload) {
    const fallback = await fallbackPublishedSearch(supabase, args);
    payload = fallback;
  }

  let jobs = payload.jobs.map((row) => mapPublishedJobToCard(row, locale, tJobs));
  let totalCount = payload.total_count;
  let currentPage = useMatchSort ? page : payload.current_page;
  let totalPages = useMatchSort
    ? Math.max(1, Math.ceil(Math.min(totalCount, jobs.length) / JOB_SEARCH_PAGE_SIZE))
    : payload.total_pages;

  const rawById = new Map<string, Record<string, unknown>>();
  for (const row of payload.jobs) {
    const id = (row.id ?? "").toString();
    if (id) rawById.set(id, row as Record<string, unknown>);
  }

  if (seekerInput && jobs.length) {
    const jobIds = jobs.map((j) => j.id).filter(Boolean);
    const matchFull = await supabase
      .from("job_posts")
      .select("id,description,requirements,requirement_lines,job_requirements")
      .in("id", jobIds);
    const matchRows =
      matchFull.error && /job_requirements|requirement_lines|column/i.test(matchFull.error.message ?? "")
        ? await supabase.from("job_posts").select("id,description,requirements").in("id", jobIds)
        : matchFull;
    if (!matchRows.error) {
      for (const row of matchRows.data ?? []) {
        const id = (row as { id: string }).id;
        const prev = rawById.get(id) ?? {};
        rawById.set(id, { ...prev, ...(row as Record<string, unknown>) });
      }
    }
    const enriched = enrichJobsWithSeekerMatch(jobs, rawById, seekerInput, certs);
    jobs = enriched.jobs;
  }

  if (useMatchSort) {
    const ranked = sortJobs(jobs, "match");
    const scoredTotal = ranked.length;
    totalCount = scoredTotal;
    totalPages = Math.max(1, Math.ceil(scoredTotal / JOB_SEARCH_PAGE_SIZE));
    currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * JOB_SEARCH_PAGE_SIZE;
    jobs = ranked.slice(start, start + JOB_SEARCH_PAGE_SIZE);
  }

  const { data: facetData, error: facetErr } = await supabase.rpc("published_job_search_facets", {
    p_query: args.p_query,
    p_locations: args.p_locations,
    p_titles: args.p_titles,
    p_domains: args.p_domains,
    p_job_types: args.p_job_types,
    p_work_types: args.p_work_types,
    p_salary_buckets: args.p_salary_buckets,
    p_experience: args.p_experience,
    p_skills: args.p_skills,
    p_certs: args.p_certs,
    p_languages: args.p_languages,
    p_has_salary: args.p_has_salary,
  });
  const facetOptions =
    !facetErr && facetData ? parseFacetsPayload(facetData, tJobs) : emptyFacets();

  let savedJobIds: string[] = [];
  if (user && role === "seeker") {
    savedJobIds = await fetchSavedJobIdsForUser(supabase, user.id);
  }

  return {
    jobs,
    totalCount,
    currentPage,
    totalPages,
    pageSize: JOB_SEARCH_PAGE_SIZE,
    facetOptions,
    matchSortAvailable,
    savedJobIds,
    canSaveJobs,
    sort,
  };
}

async function fallbackPublishedSearch(
  supabase: SupabaseClient,
  args: RpcArgs,
): Promise<NonNullable<ReturnType<typeof parseRpcPayload>>> {
  const pageSize = JOB_SEARCH_PAGE_SIZE;
  const page = Math.max(1, args.p_page || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("job_posts")
    .select(
      "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,salary_tax,salary_period,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,languages",
      { count: "exact" },
    )
    .eq("status", "published");

  if (args.p_query) {
    const needle = args.p_query;
    q = q.or(`title.ilike.%${needle}%,location.ilike.%${needle}%,short_summary.ilike.%${needle}%`);
  }
  if (args.p_locations?.[0]) q = q.ilike("location", `%${args.p_locations[0]}%`);
  if (args.p_job_types?.length) q = q.in("job_type", args.p_job_types);
  if (args.p_work_types?.length) q = q.in("work_type", args.p_work_types);
  if (args.p_experience?.length) q = q.in("experience_level_required", args.p_experience);
  if (args.p_has_salary) q = q.or("salary_min.not.is.null,salary_max.not.is.null");
  if (args.p_sort === "salary") q = q.order("salary_max", { ascending: false, nullsFirst: false });
  else if (args.p_sort === "deadline") q = q.order("application_deadline", { ascending: true, nullsFirst: false });
  else q = q.order("published_at", { ascending: false, nullsFirst: false });

  const { data, count } = await q.range(from, to);
  let rows = (data ?? []) as PublishedJobSearchRow[];
  const employerIds = Array.from(
    new Set(rows.map((r) => (r.employer_profile_id ?? "").toString()).filter(Boolean)),
  );
  if (employerIds.length) {
    const { data: employers } = await supabase
      .from("employer_profiles")
      .select("id,company_name,logo_url,company_verified,verification_status,industry,public_slug")
      .in("id", employerIds);
    const byId = new Map((employers ?? []).map((e) => [e.id as string, e]));
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
  const total = count ?? rows.length;
  return {
    jobs: rows,
    total_count: total,
    current_page: page,
    total_pages: Math.max(1, Math.ceil(total / pageSize)),
    page_size: pageSize,
  };
}
