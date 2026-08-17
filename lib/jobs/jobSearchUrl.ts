import type { JobFilterFacet, JobFilterSelection } from "@/lib/jobs/jobSearchFacets";
import type { JobSearchSort } from "@/lib/jobs/jobSearchSort";

export type JobSearchUrlParams = {
  query?: string;
  location?: string;
  workType?: string;
  jobType?: string;
  experience?: string;
  hasSalary?: boolean;
  sort?: JobSearchSort;
  filters?: JobFilterSelection[];
};

const FACET_PARAM: Partial<Record<JobFilterFacet, string>> = {
  title: "title",
  location: "loc",
  domain: "domain",
  jobType: "jobType",
  workType: "workType",
  salary: "salary",
  experience: "experience",
  skill: "skill",
  cert: "cert",
  language: "language",
};

function encodeFilter(f: JobFilterSelection): string {
  const prefix = FACET_PARAM[f.facet] ?? f.facet;
  return `${prefix}:${encodeURIComponent(f.value)}`;
}

function decodeFilter(token: string): JobFilterSelection | null {
  const idx = token.indexOf(":");
  if (idx <= 0) return null;
  const key = token.slice(0, idx);
  const value = decodeURIComponent(token.slice(idx + 1));
  const facet = (Object.entries(FACET_PARAM).find(([, v]) => v === key)?.[0] ??
    key) as JobFilterFacet;
  if (!value.trim()) return null;
  return { facet, value };
}

export function buildJobSearchUrl(params: JobSearchUrlParams): string {
  const sp = new URLSearchParams();
  const q = params.query?.trim();
  const loc = params.location?.trim();
  if (q) sp.set("query", q);
  if (loc) sp.set("location", loc);
  if (params.workType) sp.set("workType", params.workType);
  if (params.jobType) sp.set("jobType", params.jobType);
  if (params.experience) sp.set("experience", params.experience);
  if (params.hasSalary) sp.set("hasSalary", "1");
  if (params.sort && params.sort !== "newest") sp.set("sort", params.sort);

  for (const f of params.filters ?? []) {
    sp.append("f", encodeFilter(f));
  }

  const qs = sp.toString();
  return qs ? `/tood?${qs}` : "/tood";
}

export function parseJobSearchParams(
  input: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
): JobSearchUrlParams {
  const get = (key: string): string | undefined => {
    if (input instanceof URLSearchParams) {
      const v = input.get(key);
      return v?.trim() || undefined;
    }
    const raw = input[key];
    const v = Array.isArray(raw) ? raw[0] : raw;
    return v?.trim() || undefined;
  };

  const getAll = (key: string): string[] => {
    if (input instanceof URLSearchParams) {
      return input.getAll(key).map((v) => v.trim()).filter(Boolean);
    }
    const raw = input[key];
    if (Array.isArray(raw)) return raw.map((v) => v.trim()).filter(Boolean);
    if (raw?.trim()) return [raw.trim()];
    return [];
  };

  const filters: JobFilterSelection[] = [];
  for (const token of getAll("f")) {
    const parsed = decodeFilter(token);
    if (parsed) filters.push(parsed);
  }

  return {
    query: get("query"),
    location: get("location"),
    workType: get("workType"),
    jobType: get("jobType"),
    experience: get("experience"),
    hasSalary: get("hasSalary") === "1" || get("hasSalary") === "true",
    sort: (get("sort") as JobSearchUrlParams["sort"]) ?? undefined,
    filters,
  };
}

export function jobSearchParamsToString(params: JobSearchUrlParams): string {
  const url = buildJobSearchUrl(params);
  return url.includes("?") ? url.split("?")[1]! : "";
}
