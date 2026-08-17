import {
  FACET_SEARCH_RESULT_LIMIT,
  optionMatchesFacetQuery,
  type FacetOption,
  type JobFilterFacet,
} from "@/lib/jobs/jobSearchFacets";
import { rpcArgsFromSearch } from "@/lib/jobs/loadPublishedJobSearch";
import { selectionsFromSearchParams, sortFromParams } from "@/lib/jobs/jobSearchState";
import { parseJobSearchParams } from "@/lib/jobs/jobSearchUrl";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseValueCountList(raw: unknown): FacetOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const value = ((item as { value?: unknown }).value ?? "").toString().trim();
      const count = Number((item as { count?: unknown }).count) || 0;
      if (!value || count <= 0) return null;
      return { value, count } satisfies FacetOption;
    })
    .filter((x): x is FacetOption => Boolean(x));
}

export async function searchPublishedFacetValues(
  facet: JobFilterFacet,
  q: string,
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): Promise<FacetOption[]> {
  const needle = q.trim();
  if (needle.length < 2) return [];

  const parsed = parseJobSearchParams(searchParams);
  const supabase = await createSupabaseServerClient();
  const selections = selectionsFromSearchParams(parsed, (key) => key);
  const args = rpcArgsFromSearch({
    query: parsed.query,
    hasSalary: parsed.hasSalary,
    selections,
    sort: sortFromParams(parsed, false),
    page: 1,
    pageSize: 20,
  });

  const filterArgs = {
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
  };

  const targeted = await supabase.rpc("published_job_facet_values", {
    p_facet: facet,
    p_facet_query: needle,
    ...filterArgs,
    p_limit: FACET_SEARCH_RESULT_LIMIT,
  });

  if (!targeted.error && targeted.data != null) {
    return parseValueCountList(targeted.data).slice(0, FACET_SEARCH_RESULT_LIMIT);
  }

  const { data, error } = await supabase.rpc("published_job_search_facets", filterArgs);
  if (error || !data || typeof data !== "object") return [];
  const list = (data as Record<string, unknown>)[facet];
  return parseValueCountList(list)
    .filter((o) => optionMatchesFacetQuery(o, needle))
    .slice(0, FACET_SEARCH_RESULT_LIMIT);
}
