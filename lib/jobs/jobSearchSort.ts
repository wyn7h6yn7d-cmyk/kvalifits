import type { Job } from "@/components/jobs/types";

export type JobSearchSort = "match" | "newest" | "salary" | "deadline";

export const JOB_SEARCH_SORTS: JobSearchSort[] = ["match", "newest", "salary", "deadline"];

export function parseJobSearchSort(raw: string | undefined | null): JobSearchSort {
  if (raw === "match" || raw === "newest" || raw === "salary" || raw === "deadline") return raw;
  return "newest";
}

function ts(iso: string | undefined | null): number {
  if (!iso) return 0;
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function sortJobs(jobs: readonly Job[], sort: JobSearchSort): Job[] {
  const copy = [...jobs];
  switch (sort) {
    case "match":
      return copy.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
    case "salary":
      return copy.sort(
        (a, b) =>
          (b.salaryMax ?? b.salaryMin ?? -1) - (a.salaryMax ?? a.salaryMin ?? -1),
      );
    case "deadline":
      return copy.sort((a, b) => {
        const da = a.applicationDeadline ? ts(a.applicationDeadline) : Number.POSITIVE_INFINITY;
        const db = b.applicationDeadline ? ts(b.applicationDeadline) : Number.POSITIVE_INFINITY;
        return da - db;
      });
    case "newest":
    default:
      return copy.sort(
        (a, b) =>
          ts(b.publishedAt ?? b.createdAt) - ts(a.publishedAt ?? a.createdAt),
      );
  }
}
