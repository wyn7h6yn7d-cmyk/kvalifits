/** Reasons for reporting a public job listing. */

export const JOB_POST_REPORT_REASON_VALUES = [
  "fraud_suspicious",
  "wrong_company",
  "discriminatory",
  "illegal_work",
  "misleading_info",
  "other",
] as const;

export type JobPostReportReason = (typeof JOB_POST_REPORT_REASON_VALUES)[number];

export const JOB_POST_REPORT_STATUS_VALUES = [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
] as const;

export type JobPostReportStatus = (typeof JOB_POST_REPORT_STATUS_VALUES)[number];

export function isJobPostReportReason(v: unknown): v is JobPostReportReason {
  return typeof v === "string" && (JOB_POST_REPORT_REASON_VALUES as readonly string[]).includes(v);
}

export function isJobPostReportStatus(v: unknown): v is JobPostReportStatus {
  return typeof v === "string" && (JOB_POST_REPORT_STATUS_VALUES as readonly string[]).includes(v);
}

export const JOB_POST_REPORT_DETAILS_MAX = 2000;
