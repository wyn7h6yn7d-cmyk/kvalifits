/**
 * Public listing vs employer-only draft/preview visibility.
 * Archived jobs that were once published remain public history.
 */

export type JobVisibilityFields = {
  status?: string | null;
  published_at?: string | null;
};

export function jobStatusOf(job: JobVisibilityFields): string {
  return (job.status ?? "").toString();
}

export function isDraftJob(job: JobVisibilityFields): boolean {
  return jobStatusOf(job) === "draft";
}

/** True when the listing may appear on the public job board / public job URL. */
export function isPublicJobListing(job: JobVisibilityFields): boolean {
  const status = jobStatusOf(job);
  if (status === "published") return true;
  if (status === "archived" && Boolean(job.published_at)) return true;
  return false;
}

/** Drafts (and never-published archives) must not be indexed or listed publicly. */
export function isJobHiddenFromPublic(job: JobVisibilityFields): boolean {
  return !isPublicJobListing(job);
}

export function canAccessEmployerJobPreview(args: {
  viewerUserId: string | null | undefined;
  ownerUserId: string | null | undefined;
}): boolean {
  const viewer = (args.viewerUserId ?? "").toString();
  const owner = (args.ownerUserId ?? "").toString();
  return Boolean(viewer && owner && viewer === owner);
}

export function employerJobPreviewAccess(args: {
  job: JobVisibilityFields | null;
  viewerUserId: string | null | undefined;
  ownerUserId: string | null | undefined;
}): "allow" | "not_found" | "forbidden" {
  if (!args.job) return "not_found";
  if (!canAccessEmployerJobPreview(args)) return "forbidden";
  return "allow";
}
