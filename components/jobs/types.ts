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
  createdAt?: string;
  tags: string[];
  requiredCerts: string[];
  domains?: string[];
  languages?: string[];
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

