/** Simple employer hiring pipeline — not a full ATS. */

export const APPLICATION_PIPELINE_STATUSES = [
  "new", // Uus
  "reviewing", // Ülevaatamisel
  "interview", // Vestlusele
  "interview_2", // Teine vestlus
  "offer", // Pakkumine tehtud
  "hired", // Palgatud
  "rejected", // Ei sobinud
  "withdrawn", // Kandidaat loobus
] as const;

export type ApplicationPipelineStatus = (typeof APPLICATION_PIPELINE_STATUSES)[number];

/** Primary hiring path (excludes terminal outcomes). */
export const APPLICATION_PIPELINE_ACTIVE = [
  "new",
  "reviewing",
  "interview",
  "interview_2",
  "offer",
  "hired",
] as const satisfies readonly ApplicationPipelineStatus[];

export const APPLICATION_PIPELINE_TERMINAL = ["rejected", "withdrawn"] as const satisfies readonly ApplicationPipelineStatus[];

export function isApplicationPipelineStatus(v: unknown): v is ApplicationPipelineStatus {
  return typeof v === "string" && (APPLICATION_PIPELINE_STATUSES as readonly string[]).includes(v);
}

/** Map legacy DB values into the pipeline. */
export function normalizeApplicationStatus(raw: string | null | undefined): ApplicationPipelineStatus {
  const v = (raw ?? "").toString().trim().toLowerCase();
  if (v === "submitted" || v === "") return "new";
  if (isApplicationPipelineStatus(v)) return v;
  return "new";
}

export function applicationStatusLabelKey(status: ApplicationPipelineStatus): string {
  return `applicationPipelineStatus.${status}`;
}
