import type { MatchExplanation } from "@/lib/matching/matchExplanation";

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
  publishedAt?: string | null;
  applicationDeadline?: string | null;
  /** Advisory match score for logged-in seeker ranking (0–100). */
  matchScore?: number | null;
  /** Matched structured requirements, only when matchScore is present. */
  matchReqsFilled?: number | null;
  matchReqsTotal?: number | null;
  /** Why the score is what it is — never a bare percentage. */
  matchExplanation?: MatchExplanation | null;
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
  /** Public company directory slug when the employer is listed. */
  companySlug?: string | null;
};

