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

export const SALARY_BUCKETS = [
  { id: "0-1499", min: 0, max: 1499 },
  { id: "1500-1999", min: 1500, max: 1999 },
  { id: "2000-2499", min: 2000, max: 2499 },
  { id: "2500-2999", min: 2500, max: 2999 },
  { id: "3000-3999", min: 3000, max: 3999 },
  { id: "4000+", min: 4000, max: null },
] as const;

export type SalaryBucketId = (typeof SALARY_BUCKETS)[number]["id"];

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
  query = ""
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

function collectValues(jobs: readonly Job[], facet: JobFilterFacet): string[] {
  const out = new Set<string>();
  for (const job of jobs) {
    switch (facet) {
      case "title": {
        const t = job.title?.trim();
        if (t && t !== "—") out.add(t);
        break;
      }
      case "location":
        for (const p of locationParts(job.location)) out.add(p);
        break;
      case "domain":
        for (const d of job.domains ?? []) if (d.trim()) out.add(d.trim());
        break;
      case "jobType":
        if (job.jobType) out.add(job.jobType);
        break;
      case "workType":
        if (job.workType) out.add(job.workType);
        break;
      case "salary":
        for (const b of SALARY_BUCKETS) {
          if (jobSalaryOverlapsBucket(job, b.id)) out.add(b.id);
        }
        break;
      case "experience":
        if (job.experienceLevel) out.add(job.experienceLevel);
        break;
      case "skill":
        for (const s of job.skills ?? []) if (s.trim()) out.add(s.trim());
        break;
      case "cert":
        for (const c of job.requiredCerts ?? []) if (c.trim()) out.add(c.trim());
        break;
      case "language":
        for (const l of job.languages ?? []) if (l.trim()) out.add(l.trim());
        break;
    }
  }
  return Array.from(out);
}

/**
 * Facet counts for one group, given other active filters (AND across facets, OR within).
 * Options with count 0 are omitted. Sorted by count desc, then label.
 */
export function buildFacetOptions(
  allJobs: readonly Job[],
  selections: readonly JobFilterSelection[],
  facet: JobFilterFacet,
  query = ""
): FacetOption[] {
  const other = selections.filter((s) => s.facet !== facet);
  const baseJobs = allJobs.filter((j) => jobMatchesSelections(j, other, query));
  const values = collectValues(allJobs, facet);

  const options: FacetOption[] = [];
  for (const value of values) {
    const count = baseJobs.filter((j) => jobMatchesFacetValue(j, facet, value)).length;
    if (count > 0) options.push({ value, count });
  }

  options.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "et"));
  return options;
}

export function selectionKey(s: JobFilterSelection): string {
  return `${s.facet}::${s.value}`;
}

export function toggleSelection(
  prev: JobFilterSelection[],
  facet: JobFilterFacet,
  value: string
): JobFilterSelection[] {
  const key = selectionKey({ facet, value });
  const exists = prev.some((s) => selectionKey(s) === key);
  if (exists) return prev.filter((s) => selectionKey(s) !== key);
  return [...prev, { facet, value }];
}

/** Legacy flat-chip matcher kept for any residual callers. */
export function chipMatchesJob(job: Job, chip: string): boolean {
  if (job.workType === chip) return true;
  if (job.jobType === chip) return true;
  if (job.type === chip) return true;
  if ((job.skills ?? []).includes(chip)) return true;
  if (job.tags.includes(chip)) return true;
  if (job.requiredCerts.includes(chip)) return true;
  if (job.domains?.includes(chip)) return true;
  if (job.languages?.includes(chip)) return true;
  if (job.experienceLevel === chip) return true;
  if (jobMatchesLocation(job, chip)) return true;
  return false;
}
