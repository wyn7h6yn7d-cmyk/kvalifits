/**
 * job_applications column classes for INSERT.
 * A = candidate input (apply form / answers)
 * B = server controlled (apply API / service role)
 * C = employer controlled (pipeline UPDATE only)
 * D = admin / audit / system
 *
 * Authenticated PostgREST INSERT is revoked. Official apply uses
 * POST /api/job-applications (service role).
 */
export type JobApplicationFieldClass = "A" | "B" | "C" | "D";

export const JOB_APPLICATION_COLUMN_CLASS = {
  job_post_id: "A",
  cover_letter: "A",
  application_answers: "A",

  seeker_user_id: "B",
  consent_to_share: "B",
  shared_profile: "B",
  match_score: "B",
  match_breakdown: "B",
  match_details: "B",
  status: "B",
  created_at: "B",
  updated_at: "B",
  status_updated_at: "B",
  employer_notified_at: "B",

  employer_status: "C",
  employer_notes: "C",

  id: "D",
  reviewed_at: "D",
  reviewed_by: "D",
} as const satisfies Record<string, JobApplicationFieldClass>;

export type JobApplicationColumn = keyof typeof JOB_APPLICATION_COLUMN_CLASS;

/** Authenticated Data API must not INSERT any job_applications column. */
export function authenticatedMayInsertColumn(column: JobApplicationColumn): boolean {
  void column;
  return false;
}

export function authenticatedMaySetOnInsert(column: JobApplicationColumn): boolean {
  return authenticatedMayInsertColumn(column);
}

const FORGE_ATTACK_COLUMNS: JobApplicationColumn[] = [
  "match_score",
  "status",
  "seeker_user_id",
  "employer_status",
  "employer_notes",
  "reviewed_at",
  "reviewed_by",
  "consent_to_share",
  "shared_profile",
  "match_breakdown",
  "match_details",
];

export function clientInsertForgeIsBlocked(column: JobApplicationColumn): boolean {
  return (
    JOB_APPLICATION_COLUMN_CLASS[column] !== "A" &&
    authenticatedMaySetOnInsert(column) === false
  );
}

export const CLIENT_INSERT_FORGE_COLUMNS = FORGE_ATTACK_COLUMNS;
