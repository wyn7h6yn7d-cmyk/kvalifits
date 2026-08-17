import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";

export type HeroQuickFilterId = "remote" | "full_time" | "public_salary" | "first_job";

type JobRow = {
  work_type?: unknown;
  job_type?: unknown;
  experience_level_required?: unknown;
  salary_min?: unknown;
  salary_max?: unknown;
  status?: unknown;
  published_at?: unknown;
  application_deadline?: unknown;
  expires_at?: unknown;
};

const ORDER: HeroQuickFilterId[] = ["remote", "full_time", "public_salary", "first_job"];

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function heroQuickFiltersFromJobs(rows: readonly JobRow[]): HeroQuickFilterId[] {
  const available = new Set<HeroQuickFilterId>();

  for (const row of rows) {
    if (
      !jobAcceptsApplications({
        status: (row.status ?? null) as string | null,
        published_at: (row.published_at ?? null) as string | null,
        application_deadline: (row.application_deadline ?? null) as string | null,
        expires_at: (row.expires_at ?? null) as string | null,
      })
    ) {
      continue;
    }

    const workType = (row.work_type ?? "").toString().trim().toLowerCase();
    const jobType = (row.job_type ?? "").toString().trim().toLowerCase();
    const experience = (row.experience_level_required ?? "").toString().trim();
    const salaryMin = toNum(row.salary_min);
    const salaryMax = toNum(row.salary_max);

    if (workType === "remote") available.add("remote");
    if (jobType === "full_time") available.add("full_time");
    if (salaryMin !== null || salaryMax !== null) available.add("public_salary");
    if (experience === "not_required") available.add("first_job");
  }

  return ORDER.filter((id) => available.has(id));
}

export function heroQuickFilterToSearchParams(id: HeroQuickFilterId) {
  switch (id) {
    case "remote":
      return { workType: "remote" };
    case "full_time":
      return { jobType: "full_time" };
    case "public_salary":
      return { hasSalary: true };
    case "first_job":
      return { experience: "not_required" };
  }
}
