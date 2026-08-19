/**
 * saved_job_searches column classes.
 * A = seeker-controlled (CRUD of their own search settings)
 * B = worker / server delivery state (must not be JWT-writable)
 * D = identity / audit
 */
export type SavedJobSearchFieldClass = "A" | "B" | "D";

export const SAVED_JOB_SEARCH_COLUMN_CLASS = {
  name: "A",
  query: "A",
  filters: "A",
  require_public_salary: "A",
  min_match_percent: "A",
  frequency: "A",
  enabled: "A",
  locale: "A",
  search_fingerprint: "A",
  updated_at: "A",

  last_notified_at: "B",
  notify_after: "B",

  id: "D",
  seeker_user_id: "D",
  created_at: "D",
} as const satisfies Record<string, SavedJobSearchFieldClass>;

export type SavedJobSearchColumn = keyof typeof SAVED_JOB_SEARCH_COLUMN_CLASS;

export function authenticatedMayInsertSavedSearchColumn(column: SavedJobSearchColumn): boolean {
  if (column === "id" || column === "seeker_user_id" || column === "created_at") return true;
  return SAVED_JOB_SEARCH_COLUMN_CLASS[column] === "A";
}

export function authenticatedMayUpdateSavedSearchColumn(column: SavedJobSearchColumn): boolean {
  return SAVED_JOB_SEARCH_COLUMN_CLASS[column] === "A";
}

const FORGE_CURSOR_COLUMNS: SavedJobSearchColumn[] = ["last_notified_at", "notify_after"];

export function clientDeliveryCursorForgeIsBlocked(column: SavedJobSearchColumn): boolean {
  return (
    SAVED_JOB_SEARCH_COLUMN_CLASS[column] === "B" &&
    authenticatedMayUpdateSavedSearchColumn(column) === false &&
    authenticatedMayInsertSavedSearchColumn(column) === false
  );
}

export const CLIENT_DELIVERY_CURSOR_FORGE_COLUMNS = FORGE_CURSOR_COLUMNS;
