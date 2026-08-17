import type { SupabaseClient } from "@supabase/supabase-js";

import type { Job } from "@/components/jobs/types";
import {
  evaluateApplyEligibility,
  type ApplyEligibilityJobInput,
  type ApplyEligibilityStatus,
} from "@/lib/jobs/evaluateApplyEligibility";
import {
  calculateJobMatch,
  type JobMatchInput,
  type SeekerCertificateInput,
  type SeekerMatchInput,
} from "@/lib/matching/calculateJobMatch";
import { buildMatchExplanation, MATCH_EXPLANATION_CRITERIA_CAP, type MatchExplanation } from "@/lib/matching/matchExplanation";
import { seekerCanUseMatchRanking } from "@/lib/jobs/seekerMatchRanking";
import {
  emptySeekerMatchContext,
  loadSeekerMatchContext,
  type SeekerMatchContext,
} from "@/lib/matching/seekerMatchContext";

export const JOB_MATCH_ID_CAP = 200;

export type CompactJobMatch = {
  jobId: string;
  matchScore: number;
  mandatoryMet: number;
  mandatoryTotal: number;
  preferredMet: number;
  preferredTotal: number;
  reqsMet: number;
  reqsTotal: number;
  eligibilityStatus: ApplyEligibilityStatus;
  reasonIds?: string[];
  explanation?: MatchExplanation;
};

export type GetJobMatchesForSeekerResult = {
  matches: CompactJobMatch[];
  byId: Map<string, CompactJobMatch>;
  matchSortAvailable: boolean;
  context: SeekerMatchContext;
};

const COMPACT_JOB_MATCH_SELECT =
  "id,title,location,work_type,job_type,short_summary,required_skills,keywords,certificate_requirements,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,requirement_lines,job_requirements,requirements,industry_id,profession_id,skill_ids,certificate_ids,language_ids";

function asStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  return v.map((x) => String(x));
}

function asNum(v: unknown): number | null | undefined {
  if (v === null || v === undefined || v === "") return v === undefined ? undefined : null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Compact matching input. Description is never required for scoring. */
export function buildJobMatchInput(row: Record<string, unknown>): JobMatchInput {
  return {
    title: (row.title ?? null) as string | null,
    location: (row.location ?? null) as string | null,
    work_type: (row.work_type ?? null) as string | null,
    job_type: (row.job_type ?? null) as string | null,
    short_summary: (row.short_summary ?? null) as string | null,
    description: null,
    requirements: (row.requirements ?? null) as string | null,
    requirement_lines: asStringArray(row.requirement_lines),
    job_requirements: row.job_requirements,
    required_skills: asStringArray(row.required_skills),
    keywords: asStringArray(row.keywords),
    experience_level_required: (row.experience_level_required ?? null) as string | null,
    certificate_requirements: (row.certificate_requirements ?? null) as string | null,
    industry_id: (row.industry_id ?? null) as string | null,
    profession_id: (row.profession_id ?? null) as string | null,
    skill_ids: asStringArray(row.skill_ids),
    certificate_ids: asStringArray(row.certificate_ids),
    language_ids: asStringArray(row.language_ids),
    weekly_hours: asNum(row.weekly_hours),
    daily_hours: asNum(row.daily_hours),
    shift_start: (row.shift_start ?? null) as string | null,
    shift_end: (row.shift_end ?? null) as string | null,
    includes_night_work: row.includes_night_work as boolean | null | undefined,
    is_hazardous_work: row.is_hazardous_work as boolean | null | undefined,
  };
}

function eligibilityJobInput(job: JobMatchInput): ApplyEligibilityJobInput {
  return {
    title: job.title,
    job_type: job.job_type,
    work_type: job.work_type,
    short_summary: job.short_summary,
    requirements: job.requirements,
    requirement_lines: job.requirement_lines,
    job_requirements: job.job_requirements,
    required_skills: job.required_skills,
    keywords: job.keywords,
    certificate_requirements: job.certificate_requirements,
    weekly_hours: job.weekly_hours,
    daily_hours: job.daily_hours,
    shift_start: job.shift_start,
    shift_end: job.shift_end,
    includes_night_work: job.includes_night_work,
    is_hazardous_work: job.is_hazardous_work,
  };
}

function parseMatchInputRows(raw: unknown): Map<string, JobMatchInput> {
  const out = new Map<string, JobMatchInput>();
  const rows = Array.isArray(raw) ? raw : [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = (row.job_id ?? row.id ?? "").toString();
    if (!id) continue;
    out.set(id, buildJobMatchInput(row));
  }
  return out;
}

function rpcMissing(message: string | undefined) {
  return /function|schema cache|does not exist|get_job_match_inputs/i.test(message ?? "");
}

async function loadCompactJobMatchInputs(
  supabase: SupabaseClient,
  jobIds: string[],
): Promise<Map<string, JobMatchInput>> {
  const ids = Array.from(new Set(jobIds.filter(Boolean))).slice(0, JOB_MATCH_ID_CAP);
  if (!ids.length) return new Map();

  const rpc = await supabase.rpc("get_job_match_inputs", { p_job_ids: ids });
  if (!rpc.error) return parseMatchInputRows(rpc.data);

  const compact = await supabase
    .from("job_posts")
    .select(COMPACT_JOB_MATCH_SELECT)
    .eq("status", "published")
    .in("id", ids);
  if (!compact.error) return parseMatchInputRows(compact.data);
  if (!rpcMissing(rpc.error.message) && !/job_requirements|requirement_lines|column/i.test(compact.error.message ?? "")) {
    return new Map();
  }

  const legacy = await supabase
    .from("job_posts")
    .select(
      "id,title,location,work_type,job_type,short_summary,required_skills,keywords,certificate_requirements,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,requirements",
    )
    .eq("status", "published")
    .in("id", ids);
  return parseMatchInputRows(legacy.data);
}

function toCompactMatch(args: {
  jobId: string;
  seeker: SeekerMatchInput;
  certs: SeekerCertificateInput[];
  job: JobMatchInput;
  legal: SeekerMatchContext["legal"];
  includeExplanation: boolean;
  maxCriteria: number | null;
}): CompactJobMatch {
  const { score, breakdown } = calculateJobMatch(args.seeker, args.certs, args.job);
  const eligibility = evaluateApplyEligibility(
    {
      skills: args.seeker.skills,
      about: args.seeker.about,
      profile_title: args.seeker.profile_title,
      languages: args.seeker.languages ?? null,
      has_b_category_drivers_license: args.seeker.has_b_category_drivers_license,
      pref_desired_weekly_hours: args.seeker.pref_desired_weekly_hours,
      pref_min_weekly_hours: args.seeker.pref_min_weekly_hours,
      pref_max_weekly_hours: args.seeker.pref_max_weekly_hours,
      pref_full_time: args.seeker.pref_full_time,
      pref_part_time: args.seeker.pref_part_time,
      certificates: args.certs,
      legal: args.legal,
    },
    eligibilityJobInput(args.job),
  );

  const compact: CompactJobMatch = {
    jobId: args.jobId,
    matchScore: score,
    mandatoryMet: breakdown.requirementsMandatoryMatched,
    mandatoryTotal: breakdown.requirementsMandatoryTotal,
    preferredMet: breakdown.requirementsRecommendedMatched,
    preferredTotal: breakdown.requirementsRecommendedTotal,
    reqsMet: breakdown.requirementsMatched,
    reqsTotal: breakdown.requirementsTotal,
    eligibilityStatus: eligibility.status,
  };

  if (!args.includeExplanation) return compact;

  const explanation = buildMatchExplanation({
    breakdown,
    job: args.job,
    seeker: args.seeker,
    certs: args.certs,
  });
  compact.reasonIds = (breakdown.reason_codes ?? []).slice(0, 8);
  compact.explanation = {
    ...explanation,
    mandatoryFilled: breakdown.requirementsMandatoryMatched,
    mandatoryTotal: breakdown.requirementsMandatoryTotal,
    recommendedFilled: breakdown.requirementsRecommendedMatched,
    recommendedTotal: breakdown.requirementsRecommendedTotal,
    criteria: args.maxCriteria === null ? explanation.criteria : explanation.criteria.slice(0, args.maxCriteria),
  };
  return compact;
}

/**
 * Server-only matching service: compact results for a seeker × job id list.
 * Scoring stays in `calculateJobMatch` (same rules). Age/disability/health
 * are never score inputs; legal eligibility is a separate status field.
 */
export async function getJobMatchesForSeeker(opts: {
  supabase: SupabaseClient;
  userId: string;
  jobIds: string[];
  context?: SeekerMatchContext;
  /** Preloaded compact rows skip the match-input RPC. */
  jobInputs?: ReadonlyMap<string, Record<string, unknown>>;
  /** Lists omit criteria. Job detail / why-panel fetch pass true. */
  includeExplanation?: boolean;
  /** Card why-panel uses 8; job detail passes null for the full explanation. */
  maxCriteria?: number | null;
}): Promise<GetJobMatchesForSeekerResult> {
  const context = opts.context ?? (opts.userId ? await loadSeekerMatchContext(opts.userId) : emptySeekerMatchContext);
  const matchSortAvailable = seekerCanUseMatchRanking(context.seeker);
  const empty: GetJobMatchesForSeekerResult = {
    matches: [],
    byId: new Map(),
    matchSortAvailable,
    context,
  };
  if (!matchSortAvailable || !context.seeker) return empty;

  const ids = Array.from(new Set(opts.jobIds.filter(Boolean))).slice(0, JOB_MATCH_ID_CAP);
  if (!ids.length) return empty;

  const inputs = new Map<string, JobMatchInput>();
  if (opts.jobInputs) {
    for (const id of ids) {
      const raw = opts.jobInputs.get(id);
      if (!raw) continue;
      inputs.set(id, buildJobMatchInput(raw as Record<string, unknown>));
    }
  }
  const missing = ids.filter((id) => !inputs.has(id));
  if (missing.length) {
    const fetched = await loadCompactJobMatchInputs(opts.supabase, missing);
    for (const [id, job] of fetched) inputs.set(id, job);
  }

  const matches: CompactJobMatch[] = [];
  const byId = new Map<string, CompactJobMatch>();
  const includeExplanation = Boolean(opts.includeExplanation);
  const maxCriteria = opts.maxCriteria === undefined ? MATCH_EXPLANATION_CRITERIA_CAP : opts.maxCriteria;
  for (const id of ids) {
    const job = inputs.get(id);
    if (!job) continue;
    const compact = toCompactMatch({
      jobId: id,
      seeker: context.seeker,
      certs: context.certs,
      job,
      legal: context.legal,
      includeExplanation,
      maxCriteria,
    });
    matches.push(compact);
    byId.set(id, compact);
  }

  return { matches, byId, matchSortAvailable: true, context };
}

export function applyCompactJobMatches(jobs: Job[], byId: Map<string, CompactJobMatch>): Job[] {
  if (!byId.size) return jobs;
  return jobs.map((job) => {
    const match = byId.get(job.id);
    if (!match) return job;
    return {
      ...job,
      matchScore: match.matchScore,
      matchReqsFilled: match.reqsTotal > 0 ? match.reqsMet : null,
      matchReqsTotal: match.reqsTotal > 0 ? match.reqsTotal : null,
    };
  });
}
