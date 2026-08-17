import type { Job } from "@/components/jobs/types";
import {
  buildFacetOptions,
  FACET_SEARCH_RESULT_LIMIT,
  isSearchableFacet,
  isStructuredTaxonomyValue,
  optionMatchesFacetQuery,
  type FacetOption,
  type JobFilterFacet,
} from "@/lib/jobs/jobSearchFacets";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function splitCerts(raw: unknown): string[] {
  const s = (raw ?? "").toString().trim();
  if (!s) return [];
  return s
    .split(/[,;\n]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function normText(s: string) {
  return s.trim().replace(/\s+/g, " ").replace(/[\u2011\u2010\u2212]/g, "-");
}

export async function searchPublishedFacetValues(
  facet: JobFilterFacet,
  q: string,
  keywordQuery = "",
): Promise<FacetOption[]> {
  if (!isSearchableFacet(facet)) return [];
  const needle = q.trim();
  if (needle.length < 2) return [];

  const supabase = await createSupabaseServerClient();
  const selectCols =
    "title,location,required_skills,certificate_requirements,employer_profile_id,status,published_at,application_deadline,expires_at,short_summary";

  const { data, error } = await supabase
    .from("job_posts")
    .select(selectCols)
    .eq("status", "published")
    .limit(2500);

  if (error || !data) return [];

  const rows = data.filter((row) =>
    jobAcceptsApplications({
      status: (row.status ?? null) as string | null,
      published_at: (row.published_at ?? null) as string | null,
      application_deadline: (row.application_deadline ?? null) as string | null,
      expires_at: (row.expires_at ?? null) as string | null,
    }),
  );

  let industryByEmployer = new Map<string, string>();
  if (facet === "domain") {
    const ids = Array.from(
      new Set(rows.map((r) => (r.employer_profile_id ?? "").toString()).filter(Boolean)),
    );
    if (ids.length) {
      const { data: employers } = await supabase
        .from("employer_profiles")
        .select("id,industry")
        .in("id", ids.slice(0, 500));
      industryByEmployer = new Map(
        (employers ?? []).map((e) => [
          e.id as string,
          normText((e.industry ?? "").toString()),
        ]),
      );
    }
  }

  const kw = keywordQuery.trim().toLowerCase();
  const jobs: Job[] = rows
    .map((row) => {
      const skills = ((row.required_skills as string[] | null) ?? [])
        .map((s) => normText(String(s)))
        .filter((s) => isStructuredTaxonomyValue(s, "skill"));
      const domain = industryByEmployer.get((row.employer_profile_id ?? "").toString()) || "";
      return {
        id: "",
        title: (row.title ?? "").toString().trim() || "—",
        company: "",
        location: normText((row.location ?? "").toString()) || "—",
        type: "—",
        tags: [],
        skills,
        requiredCerts: splitCerts(row.certificate_requirements).filter((c) =>
          isStructuredTaxonomyValue(c, "cert"),
        ),
        domains: domain ? [domain] : [],
        summary: (row.short_summary ?? "").toString(),
      } satisfies Job;
    })
    .filter((job) => {
      if (!kw) return true;
      const hay = [job.title, job.location, job.summary ?? "", ...(job.skills ?? []), ...(job.domains ?? [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(kw);
    });

  return buildFacetOptions(jobs, [], facet, "")
    .filter((o) => optionMatchesFacetQuery(o, needle))
    .slice(0, FACET_SEARCH_RESULT_LIMIT);
}
