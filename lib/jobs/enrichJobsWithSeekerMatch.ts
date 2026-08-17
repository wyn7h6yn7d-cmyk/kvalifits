import {
  calculateJobMatch,
  type JobMatchInput,
  type SeekerCertificateInput,
  type SeekerMatchInput,
} from "@/lib/matching/calculateJobMatch";
import type { Job } from "@/components/jobs/types";
import { seekerCanUseMatchRanking } from "@/lib/jobs/seekerMatchRanking";
import { buildMatchExplanation } from "@/lib/matching/matchExplanation";

type RawJobRow = Record<string, unknown>;

export function buildJobMatchInput(row: RawJobRow): JobMatchInput {
  return {
    title: (row.title ?? null) as string | null,
    location: (row.location ?? null) as string | null,
    work_type: (row.work_type ?? null) as string | null,
    job_type: (row.job_type ?? null) as string | null,
    short_summary: (row.short_summary ?? null) as string | null,
    description: (row.description ?? null) as string | null,
    requirements: (row.requirements ?? null) as string | null,
    requirement_lines: (row.requirement_lines as string[] | null) ?? null,
    job_requirements: row.job_requirements,
    required_skills: (row.required_skills as string[] | null) ?? null,
    keywords: (row.keywords as string[] | null) ?? null,
    experience_level_required: (row.experience_level_required ?? null) as string | null,
    certificate_requirements: (row.certificate_requirements ?? null) as string | null,
    weekly_hours: row.weekly_hours as number | null | undefined,
    daily_hours: row.daily_hours as number | null | undefined,
    shift_start: (row.shift_start ?? null) as string | null,
    shift_end: (row.shift_end ?? null) as string | null,
    includes_night_work: row.includes_night_work as boolean | null | undefined,
    is_hazardous_work: row.is_hazardous_work as boolean | null | undefined,
  };
}

export function enrichJobsWithSeekerMatch(
  jobs: Job[],
  rawById: Map<string, RawJobRow>,
  seeker: SeekerMatchInput | null,
  certs: SeekerCertificateInput[],
): { jobs: Job[]; matchSortAvailable: boolean } {
  const matchSortAvailable = seekerCanUseMatchRanking(seeker);
  if (!matchSortAvailable || !seeker) {
    return { jobs, matchSortAvailable: false };
  }

  const enriched = jobs.map((job) => {
    const raw = rawById.get(job.id);
    if (!raw) return job;
    const jobInput = buildJobMatchInput(raw);
    const { score, breakdown } = calculateJobMatch(seeker, certs, jobInput);
    const reqTotal = breakdown.requirementsTotal;
    return {
      ...job,
      matchScore: score,
      matchReqsFilled: reqTotal > 0 ? breakdown.requirementsMatched : null,
      matchReqsTotal: reqTotal > 0 ? reqTotal : null,
      matchExplanation: (() => {
        const explanation = buildMatchExplanation({
          breakdown,
          job: jobInput,
          seeker,
          certs,
        });
        return {
          ...explanation,
          criteria: explanation.criteria.slice(0, 8),
        };
      })(),
    };
  });

  return { jobs: enriched, matchSortAvailable: true };
}
