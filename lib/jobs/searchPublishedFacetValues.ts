import {
  FACET_SEARCH_RESULT_LIMIT,
  optionMatchesFacetQuery,
  type FacetOption,
  type JobFilterFacet,
} from "@/lib/jobs/jobSearchFacets";
import { rpcArgsFromSearch } from "@/lib/jobs/loadPublishedJobSearch";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function searchPublishedFacetValues(
  facet: JobFilterFacet,
  q: string,
  keywordQuery = "",
): Promise<FacetOption[]> {
  const needle = q.trim();
  if (needle.length < 2) return [];

  const supabase = await createSupabaseServerClient();
  const args = rpcArgsFromSearch({
    query: keywordQuery,
    hasSalary: false,
    selections: [],
    sort: "newest",
    page: 1,
    pageSize: 20,
  });

  const { data, error } = await supabase.rpc("published_job_search_facets", {
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

  if (error || !data || typeof data !== "object") return [];
  const list = (data as Record<string, unknown>)[facet];
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const value = ((item as { value?: unknown }).value ?? "").toString().trim();
      const count = Number((item as { count?: unknown }).count) || 0;
      if (!value) return null;
      return { value, count } satisfies FacetOption;
    })
    .filter((x): x is FacetOption => Boolean(x))
    .filter((o) => optionMatchesFacetQuery(o, needle))
    .slice(0, FACET_SEARCH_RESULT_LIMIT);
}
