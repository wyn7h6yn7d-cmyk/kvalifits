/** Seeker-facing status only — never exposes employer pipeline nuance beyond these labels. */
export function seekerApplicationStatusLabelKey(status: string | null | undefined): string {
  const v = (status ?? "").toString().trim().toLowerCase();
  if (v === "withdrawn") return "seekerApplicationStatus_withdrawn";
  if (v === "rejected") return "seekerApplicationStatus_processEnded";
  if (v === "hired") return "seekerApplicationStatus_hired";
  if (v === "offer") return "seekerApplicationStatus_offer";
  if (v === "interview" || v === "interview_2") return "seekerApplicationStatus_interview";
  if (v === "reviewing") return "seekerApplicationStatus_reviewing";
  return "seekerApplicationStatus_sent";
}

export function jobMetaFromSharedProfile(sp: unknown): {
  jobTitle: string;
  employerName: string;
  jobId: string;
} {
  const job = (sp as { job?: Record<string, unknown> } | null)?.job ?? {};
  const employer = (sp as { employer?: Record<string, unknown> } | null)?.employer ?? {};
  return {
    jobTitle: (job.title ?? "").toString().trim() || "—",
    employerName: (employer.company_name ?? "").toString().trim() || "—",
    jobId: (job.id ?? "").toString().trim() || "",
  };
}
