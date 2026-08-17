import type { SupabaseClient } from "@supabase/supabase-js";

import type { Job } from "@/components/jobs/types";
import type { FacetOption, JobFilterFacet, JobFilterSelection } from "@/lib/jobs/jobSearchFacets";
import { ALL_JOB_FILTER_FACETS, SALARY_BUCKETS } from "@/lib/jobs/jobSearchFacets";
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
import { applyCompactJobMatches, getJobMatchesForSeeker } from "@/lib/matching/getJobMatchesForSeeker";
import { emptySeekerMatchContext, loadSeekerMatchContext } from "@/lib/matching/seekerMatchContext";
import { getCurrentAuth } from "@/lib/auth/currentAuth";
import { isTaxonomyColumnError } from "@/lib/taxonomy/columnMissing";

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

function parseFacetOption(
  item: unknown,
  facet: JobFilterFacet,
  tJobs: (key: string) => string,
): FacetOption | null {
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
}

function parseFacetsPayload(
  raw: unknown,
  tJobs: (key: string) => string,
  selections: JobFilterSelection[],
): Record<JobFilterFacet, FacetOption[]> {
  const out = emptyFacets();
  if (!raw || typeof raw !== "object") return mergeSelectedFacetOptions(out, selections);
  const o = raw as Record<string, unknown>;
  const selected = new Map<JobFilterFacet, Set<string>>();
  for (const s of selections) {
    const set = selected.get(s.facet) ?? new Set<string>();
    set.add(s.value);
    selected.set(s.facet, set);
  }
  for (const facet of ALL_JOB_FILTER_FACETS) {
    const list = o[facet];
    const keep = selected.get(facet) ?? new Set<string>();
    const parsed = Array.isArray(list)
      ? list
          .map((item) => parseFacetOption(item, facet, tJobs))
          .filter((x): x is FacetOption => Boolean(x))
          .filter((x) => x.count > 0 || keep.has(x.value))
      : [];
    out[facet] = parsed;
  }
  return mergeSelectedFacetOptions(out, selections);
}

function mergeSelectedFacetOptions(
  facets: Record<JobFilterFacet, FacetOption[]>,
  selections: JobFilterSelection[],
): Record<JobFilterFacet, FacetOption[]> {
  for (const s of selections) {
    const list = facets[s.facet];
    if (!list) continue;
    if (list.some((o) => o.value === s.value)) continue;
    list.push({ value: s.value, count: 0 });
  }
  return facets;
}

function rpcMissing(message: string | undefined) {
  return /function|schema cache|does not exist|search_published_jobs|published_job_facet/i.test(
    message ?? "",
  );
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

  const auth = await getCurrentAuth();
  const userId = auth.userId;
  const role = auth.role;
  const canSaveJobs = !role || role === "seeker";

  const seekerContext =
    userId && role === "seeker" ? await loadSeekerMatchContext(userId) : emptySeekerMatchContext;
  const matchSortAvailable = seekerCanUseMatchRanking(seekerContext.seeker);
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

  if (matchSortAvailable && jobs.length && userId) {
    const matched = await getJobMatchesForSeeker({
      supabase,
      userId,
      jobIds: jobs.map((j) => j.id).filter(Boolean),
      context: seekerContext,
    });
    jobs = applyCompactJobMatches(jobs, matched.byId);
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
    !facetErr && facetData
      ? parseFacetsPayload(facetData, tJobs, selections)
      : mergeSelectedFacetOptions(emptyFacets(), selections);

  let savedJobIds: string[] = [];
  if (userId && role === "seeker") {
    savedJobIds = await fetchSavedJobIdsForUser(supabase, userId);
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

const FALLBACK_JOB_SELECTS: string[] = [
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,salary_tax,salary_period,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,languages",
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required",
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,employer_profile_id,status,created_at,published_at",
  "id,title,location,job_type,work_type,short_summary,employer_profile_id,status,created_at",
];

const FALLBACK_EMPLOYER_SELECTS: string[] = [
  "id,company_name,logo_url,company_verified,verification_status,industry,public_slug",
  "id,company_name,logo_url,industry",
  "id,company_name,logo_url",
];

async function fallbackPublishedSearch(
  supabase: SupabaseClient,
  args: RpcArgs,
): Promise<NonNullable<ReturnType<typeof parseRpcPayload>>> {
  const pageSize = JOB_SEARCH_PAGE_SIZE;
  const page = Math.max(1, args.p_page || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let rows: PublishedJobSearchRow[] = [];
  let total = 0;

  for (const select of FALLBACK_JOB_SELECTS) {
    let q = supabase.from("job_posts").select(select, { count: "exact" }).eq("status", "published");

    if (args.p_query) {
      const needle = args.p_query;
      q = q.or(`title.ilike.%${needle}%,location.ilike.%${needle}%,short_summary.ilike.%${needle}%`);
    }
    if (args.p_locations?.[0]) q = q.ilike("location", `%${args.p_locations[0]}%`);
    if (args.p_job_types?.length) q = q.in("job_type", args.p_job_types);
    if (args.p_work_types?.length) q = q.in("work_type", args.p_work_types);
    if (args.p_experience?.length && select.includes("experience_level_required")) {
      q = q.in("experience_level_required", args.p_experience);
    }
    if (args.p_has_salary) q = q.or("salary_min.not.is.null,salary_max.not.is.null");
    if (args.p_sort === "salary") q = q.order("salary_max", { ascending: false, nullsFirst: false });
    else if (args.p_sort === "deadline" && select.includes("application_deadline")) {
      q = q.order("application_deadline", { ascending: true, nullsFirst: false });
    } else if (select.includes("published_at")) {
      q = q.order("published_at", { ascending: false, nullsFirst: false });
    } else {
      q = q.order("created_at", { ascending: false, nullsFirst: false });
    }

    const { data, count, error } = await q.range(from, to);
    if (error && isTaxonomyColumnError(error.message)) continue;
    if (error) break;
    rows = ((data ?? []) as unknown) as PublishedJobSearchRow[];
    total = count ?? rows.length;
    break;
  }

  const employerIds = Array.from(
    new Set(rows.map((r) => (r.employer_profile_id ?? "").toString()).filter(Boolean)),
  );
  if (employerIds.length) {
    let employers: Record<string, unknown>[] = [];
    for (const select of FALLBACK_EMPLOYER_SELECTS) {
      const { data, error } = await supabase.from("employer_profiles").select(select).in("id", employerIds);
      if (error && isTaxonomyColumnError(error.message)) continue;
      if (!error) employers = ((data ?? []) as unknown) as Record<string, unknown>[];
      break;
    }
    const byId = new Map(employers.map((e) => [String(e.id), e]));
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
  return {
    jobs: rows,
    total_count: total,
    current_page: page,
    total_pages: Math.max(1, Math.ceil(total / pageSize)),
    page_size: pageSize,
  };
}
