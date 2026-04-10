export type Job = {
  id: string;
  title: string;
  company: string;
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

