import { overlapJaccard, tokenizeToCanonSet } from "@/lib/matching/normalization";

export type SimilarJobSource = {
  id: string;
  title?: string | null;
  location?: string | null;
  job_type?: string | null;
  work_type?: string | null;
  required_skills?: string[] | null;
  keywords?: string[] | null;
  certificate_requirements?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
};

const WEIGHTS = {
  title: 0.28,
  skills: 0.22,
  location: 0.16,
  workType: 0.1,
  jobType: 0.08,
  salary: 0.08,
  certs: 0.08,
} as const;

const MIN_SCORE = 0.2;

function asList(v: string[] | null | undefined): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function splitCerts(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normKey(raw: string | null | undefined): string {
  return (raw ?? "").toString().trim().toLowerCase().replace(/-/g, "_");
}

function workTypeKey(raw: string | null | undefined): string {
  const v = normKey(raw);
  if (v === "onsite" || v === "on_site" || v === "kohapeal") return "on_site";
  if (v === "hybrid" || v === "hubriid") return "hybrid";
  if (v === "remote" || v === "kaugtoo") return "remote";
  return v;
}

function midpoint(min: number | null | undefined, max: number | null | undefined): number | null {
  const a = typeof min === "number" && Number.isFinite(min) ? min : null;
  const b = typeof max === "number" && Number.isFinite(max) ? max : null;
  if (a != null && b != null) return (a + b) / 2;
  return a ?? b;
}

function salaryCloseness(a: SimilarJobSource, b: SimilarJobSource): number {
  const am = midpoint(a.salary_min, a.salary_max);
  const bm = midpoint(b.salary_min, b.salary_max);
  if (am == null || bm == null || am <= 0 || bm <= 0) return 0;
  const rel = Math.abs(am - bm) / Math.max(am, bm);
  if (rel <= 0.15) return 1;
  if (rel <= 0.35) return 0.6;
  if (rel <= 0.55) return 0.3;
  return 0;
}

function textOverlap(a: Array<string | null | undefined>, b: Array<string | null | undefined>): number {
  return overlapJaccard(tokenizeToCanonSet(a), tokenizeToCanonSet(b));
}

/** Job-to-job relatedness for discovery. Not a seeker match score — never shown as %. */
export function scoreJobSimilarity(source: SimilarJobSource, candidate: SimilarJobSource): number {
  const title = textOverlap([source.title], [candidate.title]);
  const skills = textOverlap(
    [...asList(source.required_skills), ...asList(source.keywords)],
    [...asList(candidate.required_skills), ...asList(candidate.keywords)],
  );
  const location = textOverlap([source.location], [candidate.location]);
  const certs = textOverlap(splitCerts(source.certificate_requirements), splitCerts(candidate.certificate_requirements));

  const srcWork = workTypeKey(source.work_type);
  const candWork = workTypeKey(candidate.work_type);
  const workType = srcWork && candWork && srcWork === candWork ? 1 : 0;

  const srcJob = normKey(source.job_type);
  const candJob = normKey(candidate.job_type);
  const jobType = srcJob && candJob && srcJob === candJob ? 1 : 0;

  const salary = salaryCloseness(source, candidate);

  const total =
    title * WEIGHTS.title +
    skills * WEIGHTS.skills +
    location * WEIGHTS.location +
    workType * WEIGHTS.workType +
    jobType * WEIGHTS.jobType +
    salary * WEIGHTS.salary +
    certs * WEIGHTS.certs;

  const hasRoleSignal = title >= 0.2 || skills >= 0.2 || certs >= 0.2;
  const hasContextSignal = location >= 0.38 && workType === 1;
  if (!hasRoleSignal && !hasContextSignal) return 0;
  if (total < MIN_SCORE) return 0;
  return total;
}

export function pickSimilarJobs<T extends SimilarJobSource>(
  source: SimilarJobSource,
  candidates: T[],
  limit = 4,
): T[] {
  const ranked = candidates
    .map((job) => ({ job, score: scoreJobSimilarity(source, job) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.job.id.localeCompare(b.job.id));
  return ranked.slice(0, Math.min(4, Math.max(1, limit))).map((row) => row.job);
}
