import { jobAcceptsApplications, type JobLifecycleDates } from "@/lib/jobs/jobLifecycle";

export type JobFeaturedFields = JobLifecycleDates & {
  is_featured?: boolean | null;
  featured_from?: string | null;
  featured_until?: string | null;
};

function parseInstant(raw: string | null | undefined): Date | null {
  const s = (raw ?? "").toString().trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isFeaturedColumnMissing(message: string | undefined): boolean {
  return /is_featured|featured_from|featured_until|column/i.test(message ?? "");
}

export type EmployerFeaturedDisplayState =
  | { kind: "inactive" }
  | { kind: "active"; until: string };

/** Employer UI: featured until date while window not ended (read-only; no client writes). */
export function getEmployerFeaturedDisplayState(
  job: JobFeaturedFields & { status?: string | null },
  asOf: Date = new Date(),
): EmployerFeaturedDisplayState {
  if ((job.status ?? "").toString() !== "published") return { kind: "inactive" };
  if (!job.is_featured) return { kind: "inactive" };

  const until = parseInstant(job.featured_until);
  if (!until || asOf >= until) return { kind: "inactive" };

  return { kind: "active", until: job.featured_until!.toString() };
}

/** True when featured flag, window, published status, and apply eligibility all match. */
export function isJobFeaturedActive(job: JobFeaturedFields, asOf: Date = new Date()): boolean {
  if (!job.is_featured) return false;
  if ((job.status ?? "").toString() !== "published") return false;

  const from = parseInstant(job.featured_from);
  const until = parseInstant(job.featured_until);
  if (!from || !until) return false;
  if (asOf < from || asOf >= until) return false;

  return jobAcceptsApplications(job, asOf);
}
