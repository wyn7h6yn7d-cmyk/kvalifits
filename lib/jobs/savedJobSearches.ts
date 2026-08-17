import type { Job } from "@/components/jobs/types";
import {
  jobMatchesSelections,
  type JobFilterFacet,
  type JobFilterSelection,
} from "@/lib/jobs/jobSearchFacets";
import { buildJobSearchUrl } from "@/lib/jobs/jobSearchUrl";

export const SAVED_SEARCH_FREQUENCIES = ["immediate", "daily", "weekly"] as const;
export type SavedSearchFrequency = (typeof SAVED_SEARCH_FREQUENCIES)[number];

export const SAVED_SEARCH_MATCH_THRESHOLDS = [60, 70, 80, 90] as const;
export const DEFAULT_SAVED_SEARCH_MIN_MATCH = 80;

/**
 * Email/cron delivery is not configured. Persistence and settings UI may run;
 * do not tell the user that messages are being sent.
 */
export const SAVED_SEARCH_ALERTS_DELIVERY_ENABLED = false;

export type SavedSearchSnapshot = {
  query: string;
  requirePublicSalary: boolean;
  filters: JobFilterSelection[];
};

export type SavedJobSearchRow = {
  id: string;
  seeker_user_id: string;
  name: string;
  query: string;
  filters: JobFilterSelection[];
  require_public_salary: boolean;
  min_match_percent: number | null;
  frequency: SavedSearchFrequency;
  enabled: boolean;
  locale: string;
  search_fingerprint: string;
  notify_after: string;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
};

const FACETS = new Set<JobFilterFacet>([
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
]);

export function parseSavedSearchFrequency(raw: unknown): SavedSearchFrequency {
  if (raw === "immediate" || raw === "daily" || raw === "weekly") return raw;
  return "daily";
}

export function parseMinMatchPercent(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "" || raw === "none") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 0 || rounded > 100) return null;
  return rounded;
}

export function normalizeSavedSearchFilters(raw: unknown): JobFilterSelection[] {
  if (!Array.isArray(raw)) return [];
  const out: JobFilterSelection[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const facet = (item as { facet?: unknown }).facet;
    const value = ((item as { value?: unknown }).value ?? "").toString().trim();
    if (typeof facet !== "string" || !FACETS.has(facet as JobFilterFacet) || !value) continue;
    const key = `${facet}::${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ facet: facet as JobFilterFacet, value });
  }
  out.sort((a, b) => a.facet.localeCompare(b.facet) || a.value.localeCompare(b.value));
  return out;
}

export function normalizeSavedSearchSnapshot(input: SavedSearchSnapshot): SavedSearchSnapshot {
  return {
    query: (input.query ?? "").toString().trim().slice(0, 500),
    requirePublicSalary: Boolean(input.requirePublicSalary),
    filters: normalizeSavedSearchFilters(input.filters),
  };
}

export function fingerprintSavedSearch(
  snapshot: SavedSearchSnapshot,
  minMatchPercent: number | null,
): string {
  const n = normalizeSavedSearchSnapshot(snapshot);
  return JSON.stringify({
    q: n.query.toLowerCase(),
    salary: n.requirePublicSalary,
    f: n.filters,
    m: minMatchPercent,
  });
}

export function savedSearchToJobsUrl(row: Pick<SavedJobSearchRow, "query" | "filters" | "require_public_salary">): string {
  return buildJobSearchUrl({
    query: row.query.trim() || undefined,
    hasSalary: row.require_public_salary || undefined,
    filters: normalizeSavedSearchFilters(row.filters),
  });
}

export function defaultSavedSearchName(snapshot: SavedSearchSnapshot, untitled: string): string {
  const n = normalizeSavedSearchSnapshot(snapshot);
  const parts = [n.query, ...n.filters.slice(0, 3).map((f) => f.value)].filter(Boolean);
  const label = parts.join(" · ").slice(0, 80);
  return label || untitled;
}

export function jobMatchesSavedSearch(
  job: Job,
  snapshot: SavedSearchSnapshot,
  minMatchPercent: number | null,
): boolean {
  const n = normalizeSavedSearchSnapshot(snapshot);
  if (!jobMatchesSelections(job, n.filters, n.query)) return false;
  if (n.requirePublicSalary && job.salaryMin == null && job.salaryMax == null) return false;
  if (minMatchPercent != null) {
    if (typeof job.matchScore !== "number" || job.matchScore < minMatchPercent) return false;
  }
  return true;
}

/** Jobs published after `notifyAfter` that match the saved search. Used by a future worker. */
export function newJobsForSavedSearch(
  jobs: readonly Job[],
  snapshot: SavedSearchSnapshot,
  minMatchPercent: number | null,
  notifyAfterIso: string,
): Job[] {
  const after = Date.parse(notifyAfterIso);
  const afterMs = Number.isFinite(after) ? after : 0;
  return jobs.filter((job) => {
    if (!jobMatchesSavedSearch(job, snapshot, minMatchPercent)) return false;
    const published = Date.parse(job.publishedAt ?? job.createdAt ?? "");
    if (!Number.isFinite(published)) return true;
    return published > afterMs;
  });
}
