/**
 * Account privacy: erase vs legally retained categories.
 * Retention buckets are stored in `legal_retention_records` and managed separately
 * from live profile rows (different table, category, retain_until).
 */

export const ACCOUNT_ERASE_CATEGORIES = [
  "auth_identity",
  "sessions",
  "profile",
  "certificates_and_files",
  "preferences_and_needs",
  "applications_personal",
  "saved_jobs",
  "saved_job_searches",
  "employer_company",
  "job_posts_personal",
] as const;

export type AccountEraseCategory = (typeof ACCOUNT_ERASE_CATEGORIES)[number];

/** Categories that may be kept anonymised after deletion — separate admin lifecycle. */
export const ACCOUNT_RETENTION_CATEGORIES = [
  "dispute_resolution",
  "security_audit",
  "legal_obligation",
] as const;

export type AccountRetentionCategory = (typeof ACCOUNT_RETENTION_CATEGORIES)[number];

/** Default retain windows (days) — adjust per legal advice later without changing erase flow. */
export const ACCOUNT_RETENTION_DEFAULT_DAYS: Record<AccountRetentionCategory, number | null> = {
  dispute_resolution: 365 * 3,
  security_audit: 365 * 5,
  legal_obligation: null, // open-ended until category rules are set
};

export const ACCOUNT_DELETE_CONFIRM_WORD = "KUSTUTA";
