import type { Job } from "@/components/jobs/types";

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u2011\u2010\u2212]/g, "-");
}

function normCompact(s: string) {
  return norm(s).replace(/\s+/g, "");
}

/** Kas töökuulutus vastab ühele kiibile (AND loogika kasutab mitut kiipi). */
export function chipMatchesJob(job: Job, chip: string): boolean {
  if (job.workType === chip) return true;
  if (job.jobType === chip) return true;
  if (job.type === chip) return true;
  if (job.tags.includes(chip)) return true;
  if (job.requiredCerts.includes(chip)) return true;
  if (job.domains?.includes(chip)) return true;
  if (job.languages?.includes(chip)) return true;

  const c = normCompact(chip);
  const jl = normCompact(job.location);
  const parts = job.location
    .split(/[/,|]/)
    .map((p) => normCompact(p.trim()))
    .filter(Boolean);
  if (parts.some((p) => p === c)) return true;
  if (jl === c) return true;

  return false;
}
