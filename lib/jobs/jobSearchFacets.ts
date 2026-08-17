import type { Job } from "@/components/jobs/types";

export type JobFilterFacet =
  | "title"
  | "location"
  | "domain"
  | "jobType"
  | "workType"
  | "salary"
  | "experience"
  | "skill"
  | "cert"
  | "language";

export type JobFilterSelection = {
  facet: JobFilterFacet;
  value: string;
};

export type FacetOption = {
  value: string;
  count: number;
};

export const ALL_JOB_FILTER_FACETS: JobFilterFacet[] = [
  "title",
  "location",
  "domain",
  "jobType",
  "workType",
  "salary",
  "experience",
  "skill",
  "cert",
  "language",
];

/** Large taxonomies: never dump the full list into the DOM. */
export const SEARCHABLE_FACETS: JobFilterFacet[] = [
  "title",
  "location",
  "domain",
  "skill",
  "cert",
];

export const FACET_INITIAL_VISIBLE = 6;
export const FACET_EXPANDED_VISIBLE = 12;
export const FACET_SEARCH_RESULT_LIMIT = 20;
export const FACET_CLIENT_CATALOG_LIMIT = 40;
export const FACET_SEARCH_MIN_CHARS = 2;

export const SALARY_BUCKETS = [
  { id: "0-1499", min: 0, max: 1499 },
  { id: "1500-1999", min: 1500, max: 1999 },
  { id: "2000-2499", min: 2000, max: 2499 },
  { id: "2500-2999", min: 2500, max: 2999 },
  { id: "3000-3999", min: 3000, max: 3999 },
  { id: "4000+", min: 4000, max: null },
] as const;

export type SalaryBucketId = (typeof SALARY_BUCKETS)[number]["id"];

const SMALL_FACETS = new Set<JobFilterFacet>([
  "jobType",
  "workType",
  "salary",
  "experience",
  "language",
]);

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u2011\u2010\u2212]/g, "-");
}

function normCompact(s: string) {
  return norm(s).replace(/\s+/g, "");
}

export function locationParts(location: string): string[] {
  const raw = (location ?? "").toString().trim();
  if (!raw || raw === "—") return [];
  const parts = raw
    .split(/[/,|]/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : [raw];
}

/**
 * Structured taxonomy values only — not sentences scraped from job descriptions.
 * Enum-like facets (workload, salary buckets) always pass.
 */
export function isStructuredTaxonomyValue(raw: string, facet: JobFilterFacet): boolean {
  const s = raw.trim();
  if (!s || s === "—") return false;
  if (SMALL_FACETS.has(facet) && facet !== "language") return true;
  if (s.length < 2 || s.length > 48) return false;
  if (s.split(/\s+/).length > 6) return false;
  return true;
}

function jobMatchesLocation(job: Job, value: string): boolean {
  const c = normCompact(value);
  return locationParts(job.location).some((p) => normCompact(p) === c);
}

function jobSalaryOverlapsBucket(job: Job, bucketId: string): boolean {
  const bucket = SALARY_BUCKETS.find((b) => b.id === bucketId);
  if (!bucket) return false;
  const min = job.salaryMin ?? null;
  const max = job.salaryMax ?? null;
  if (min == null && max == null) return false;
  const jobLo = min ?? max!;
  const jobHi = max ?? min!;
  const bLo = bucket.min;
  const bHi = bucket.max ?? Number.POSITIVE_INFINITY;
  return jobLo <= bHi && jobHi >= bLo;
}

function jobMatchesFacetValue(job: Job, facet: JobFilterFacet, value: string): boolean {
  switch (facet) {
    case "title":
      return norm(job.title) === norm(value);
    case "location":
      return jobMatchesLocation(job, value);
    case "domain":
      return (job.domains ?? []).some((d) => norm(d) === norm(value));
    case "jobType":
      return Boolean(job.jobType && job.jobType === value);
    case "workType":
      return Boolean(job.workType && job.workType === value);
    case "salary":
      return jobSalaryOverlapsBucket(job, value);
    case "experience":
      return Boolean(job.experienceLevel && job.experienceLevel === value);
    case "skill":
      return (job.skills ?? []).some((s) => norm(s) === norm(value));
    case "cert":
      return (job.requiredCerts ?? []).some((c) => norm(c) === norm(value));
    case "language":
      return (job.languages ?? []).some((l) => norm(l) === norm(value));
    default:
      return false;
  }
}

/** Within a facet: OR. Across facets: AND. Free-text query is separate. */
export function jobMatchesSelections(
  job: Job,
  selections: readonly JobFilterSelection[],
  query = "",
): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = [
      job.title,
      job.company,
      job.location,
      job.summary ?? "",
      ...(job.skills ?? []),
      ...(job.requiredCerts ?? []),
      ...(job.domains ?? []),
      ...(job.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  if (!selections.length) return true;

  const byFacet = new Map<JobFilterFacet, string[]>();
  for (const s of selections) {
    const list = byFacet.get(s.facet) ?? [];
    list.push(s.value);
    byFacet.set(s.facet, list);
  }

  for (const [facet, values] of byFacet) {
    if (!values.some((v) => jobMatchesFacetValue(job, facet, v))) return false;
  }
  return true;
}

/** Values used for taxonomy filters. Skills come only from structured `required_skills`. */
export function valuesFromJob(job: Job, facet: JobFilterFacet): string[] {
  switch (facet) {
    case "title": {
      const t = job.title?.trim();
      return t && t !== "—" ? [t] : [];
    }
    case "location":
      return locationParts(job.location);
    case "domain":
      return (job.domains ?? []).map((d) => d.trim()).filter(Boolean);
    case "jobType":
      return job.jobType ? [job.jobType] : [];
    case "workType":
      return job.workType ? [job.workType] : [];
    case "salary":
      return SALARY_BUCKETS.filter((b) => jobSalaryOverlapsBucket(job, b.id)).map((b) => b.id);
    case "experience":
      return job.experienceLevel ? [job.experienceLevel] : [];
    case "skill":
      return (job.skills ?? []).map((s) => s.trim()).filter(Boolean);
    case "cert":
      return (job.requiredCerts ?? []).map((c) => c.trim()).filter(Boolean);
    case "language":
      return (job.languages ?? []).map((l) => l.trim()).filter(Boolean);
    default:
      return [];
  }
}

function aggregateFacet(
  jobs: readonly Job[],
  facet: JobFilterFacet,
): Map<string, { display: string; count: number }> {
  const counts = new Map<string, { display: string; count: number }>();
  for (const job of jobs) {
    for (const raw of valuesFromJob(job, facet)) {
      if (!isStructuredTaxonomyValue(raw, facet)) continue;
      const key = norm(raw);
      if (!key) continue;
      const prev = counts.get(key);
      if (prev) prev.count += 1;
      else counts.set(key, { display: raw, count: 1 });
    }
  }
  return counts;
}

function sortFacetOptions(options: FacetOption[]): FacetOption[] {
  return options.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "et"));
}

/**
 * Facet counts for one group, given other active filters (AND across facets, OR within).
 * Zero-count values are omitted unless already selected.
 */
export function buildFacetOptions(
  allJobs: readonly Job[],
  selections: readonly JobFilterSelection[],
  facet: JobFilterFacet,
  query = "",
): FacetOption[] {
  const other = selections.filter((s) => s.facet !== facet);
  const selectedValues = selections.filter((s) => s.facet === facet).map((s) => s.value);
  const baseJobs = allJobs.filter((j) => jobMatchesSelections(j, other, query));
  const counts = aggregateFacet(baseJobs, facet);

  const options: FacetOption[] = [];
  const seen = new Set<string>();
  for (const { display, count } of counts.values()) {
    if (count <= 0) continue;
    options.push({ value: display, count });
    seen.add(norm(display));
  }

  for (const value of selectedValues) {
    const key = norm(value);
    if (seen.has(key)) continue;
    const counted = counts.get(key);
    options.push({ value, count: counted?.count ?? 0 });
    seen.add(key);
  }

  return sortFacetOptions(options);
}

export function buildAllFacetOptions(
  allJobs: readonly Job[],
  selections: readonly JobFilterSelection[],
  query = "",
): Record<JobFilterFacet, FacetOption[]> {
  const map = {} as Record<JobFilterFacet, FacetOption[]>;
  for (const facet of ALL_JOB_FILTER_FACETS) {
    map[facet] = buildFacetOptions(allJobs, selections, facet, query);
  }
  return map;
}

/** Keep top-N by count plus any selected values. Never ship unbounded catalogs to the client UI. */
export function limitFacetCatalog(
  options: readonly FacetOption[],
  selectedValues: readonly string[],
  limit = FACET_CLIENT_CATALOG_LIMIT,
): FacetOption[] {
  const selectedNorm = new Set(selectedValues.map((v) => norm(v)));
  const top = options.filter((o) => o.count > 0 || selectedNorm.has(norm(o.value))).slice(0, limit);
  const topNorm = new Set(top.map((o) => norm(o.value)));
  const extras = options.filter((o) => selectedNorm.has(norm(o.value)) && !topNorm.has(norm(o.value)));
  return [...top, ...extras];
}

export function optionMatchesFacetQuery(
  option: FacetOption,
  query: string,
  formatLabel?: (value: string) => string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const label = (formatLabel?.(option.value) ?? option.value).toLowerCase();
  return label.includes(q) || option.value.toLowerCase().includes(q);
}

export function visibleFacetOptions(input: {
  catalog: readonly FacetOption[];
  selectedValues: ReadonlySet<string>;
  searchQuery: string;
  remoteOptions: readonly FacetOption[] | null;
  expanded: boolean;
  searchable: boolean;
  formatLabel?: (value: string) => string;
}): FacetOption[] {
  const selectedNorm = new Set(Array.from(input.selectedValues).map((v) => norm(v)));
  const selected = input.catalog.filter((o) => selectedNorm.has(norm(o.value)));
  const q = input.searchQuery.trim();

  if (input.searchable && q) {
    const pool = input.remoteOptions
      ? [...input.remoteOptions]
      : input.catalog.filter((o) => optionMatchesFacetQuery(o, q, input.formatLabel));
    const merged: FacetOption[] = [];
    const seen = new Set<string>();
    for (const o of [...selected, ...pool]) {
      const key = norm(o.value);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(o);
      if (merged.length >= selected.length + FACET_SEARCH_RESULT_LIMIT) break;
    }
    return merged;
  }

  const unselected = input.catalog.filter((o) => !selectedNorm.has(norm(o.value)) && o.count > 0);
  const cap = input.expanded
    ? input.searchable
      ? FACET_EXPANDED_VISIBLE
      : Math.max(FACET_EXPANDED_VISIBLE, unselected.length)
    : FACET_INITIAL_VISIBLE;
  const shownUnselected = unselected.slice(0, cap);
  const topNorm = new Set(shownUnselected.map((o) => norm(o.value)));
  const extraSelected = selected.filter((o) => !topNorm.has(norm(o.value)));
  return [...shownUnselected, ...extraSelected];
}

export function selectionKey(s: JobFilterSelection): string {
  return `${s.facet}::${s.value}`;
}

export function toggleSelection(
  prev: JobFilterSelection[],
  facet: JobFilterFacet,
  value: string,
): JobFilterSelection[] {
  const key = selectionKey({ facet, value });
  const exists = prev.some((s) => selectionKey(s) === key);
  if (exists) return prev.filter((s) => selectionKey(s) !== key);
  return [...prev, { facet, value }];
}

export function isSearchableFacet(facet: JobFilterFacet): boolean {
  return SEARCHABLE_FACETS.includes(facet);
}

/** Legacy flat-chip matcher kept for any residual callers. */
export function chipMatchesJob(job: Job, chip: string): boolean {
  if (job.workType === chip) return true;
  if (job.jobType === chip) return true;
  if (job.type === chip) return true;
  if ((job.skills ?? []).includes(chip)) return true;
  if (job.requiredCerts.includes(chip)) return true;
  if (job.domains?.includes(chip)) return true;
  if (job.languages?.includes(chip)) return true;
  if (job.experienceLevel === chip) return true;
  if (jobMatchesLocation(job, chip)) return true;
  return false;
}
