import type { JobFilterSelection } from "./jobSearchFacets";
import { parseJobSearchSort, type JobSearchSort } from "./jobSearchSort";
import { type JobSearchUrlParams } from "./jobSearchUrl";

function workTypeLabel(raw: string, tJobs: (key: string) => string): string | null {
  const v = raw.trim().toLowerCase().replace(/-/g, "_");
  if (v === "remote") return tJobs("workTypeRemote");
  if (v === "hybrid") return tJobs("workTypeHybrid");
  if (v === "on_site" || v === "onsite") return tJobs("workTypeOnSite");
  return null;
}

function jobTypeLabel(raw: string, tJobs: (key: string) => string): string | null {
  const v = raw.trim().toLowerCase().replace(/-/g, "_");
  if (v === "full_time") return tJobs("jobTypeFullTime");
  if (v === "part_time") return tJobs("jobTypePartTime");
  if (v === "contract") return tJobs("jobTypeContract");
  if (v === "internship") return tJobs("jobTypeInternship");
  return null;
}

function addSelection(
  out: JobFilterSelection[],
  facet: JobFilterSelection["facet"],
  value: string,
) {
  const v = value.trim();
  if (!v) return;
  const key = `${facet}::${v}`;
  if (out.some((s) => `${s.facet}::${s.value}` === key)) return;
  out.push({ facet, value: v });
}

export function selectionsFromSearchParams(
  params: JobSearchUrlParams,
  tJobs: (key: string) => string,
): JobFilterSelection[] {
  const out: JobFilterSelection[] = [...(params.filters ?? [])];

  if (params.location) addSelection(out, "location", params.location);

  const wt = params.workType ? workTypeLabel(params.workType, tJobs) : null;
  if (wt) addSelection(out, "workType", wt);

  const jt = params.jobType ? jobTypeLabel(params.jobType, tJobs) : null;
  if (jt) addSelection(out, "jobType", jt);

  if (params.experience) addSelection(out, "experience", params.experience);

  return out;
}

export function buildSearchUrlState(input: {
  query: string;
  locationInput: string;
  selections: JobFilterSelection[];
  requirePublicSalary: boolean;
  sort: JobSearchSort;
  page?: number;
}): JobSearchUrlParams {
  const locationSelections = input.selections.filter((s) => s.facet === "location");
  const otherFilters = input.selections.filter((s) => s.facet !== "location");

  const locationText = input.locationInput.trim();
  const locationParam =
    locationText ||
    (locationSelections.length === 1 ? locationSelections[0]!.value : undefined);

  const filters = [...otherFilters];
  if (locationSelections.length > 1) {
    for (const s of locationSelections) addSelection(filters, "location", s.value);
  } else if (locationSelections.length === 1 && locationSelections[0]!.value !== locationParam) {
    addSelection(filters, "location", locationSelections[0]!.value);
  }

  return {
    query: input.query.trim() || undefined,
    location: locationParam || undefined,
    hasSalary: input.requirePublicSalary || undefined,
    sort: input.sort !== "newest" ? input.sort : undefined,
    page: input.page && input.page > 1 ? input.page : undefined,
    filters,
  };
}

export function sortFromParams(params: JobSearchUrlParams, matchSortAvailable: boolean): JobSearchSort {
  const sort = parseJobSearchSort(params.sort);
  if (sort === "match" && !matchSortAvailable) return "newest";
  return sort;
}
