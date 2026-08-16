export type Job = {
  id: string;
  title: string;
  company: string;
  /** Public URL of company logo from employer profile (optional). */
  companyLogoUrl?: string | null;
  location: string;
  type: string;
  workType?: string;
  jobType?: string;
  summary?: string;
  salary?: string;
  /** Numeric salary bounds for range filters (EUR etc.). */
  salaryMin?: number | null;
  salaryMax?: number | null;
  createdAt?: string;
  /** Card display tags (may mix skills + keywords). Not used as skill facets. */
  tags: string[];
  /** Structured required skills from the job post. */
  skills?: string[];
  requiredCerts: string[];
  domains?: string[];
  languages?: string[];
  /** Raw experience_level_required key (e.g. mid, not_required). */
  experienceLevel?: string | null;
  /** When employer set experience to not_required. */
  openToFirstJob?: boolean;
  /**
   * Automatic employment-rules pre-check: work conditions may suit a young (minor) seeker.
   * Never a manual employer toggle.
   */
  suitableForYoungSeeker?: boolean;
  /** True only when admin-verified (never from company name alone). */
  companyVerified?: boolean;
};

