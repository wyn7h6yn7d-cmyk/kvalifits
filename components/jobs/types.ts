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
};

