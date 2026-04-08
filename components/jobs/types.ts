export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  tags: string[];
  requiredCerts: string[];
  domains?: string[];
  languages?: string[];
};

