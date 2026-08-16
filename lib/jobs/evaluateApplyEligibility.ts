/**
 * Pre-apply eligibility for a seeker viewing a job.
 *
 * Separate from match score:
 * - Match score ranks / recommends only (see `calculateJobMatch`).
 * - Eligibility surfaces legal work-condition conflicts and soft fit tips.
 * - Only mandatory *legal* work-condition conflicts use severity `block`
 *   → status `blocked`. That is never derived from match score.
 * - Missing skills/certs/preferences affect score and may be `attention`/`info`,
 *   but must not alone block applying or auto-reject a candidate.
 * - Recommended requirement gaps are info-only.
 * - Age is used only via legal employment-rules checks (minors).
 */
import { evaluateMinorJobEligibility } from "@/lib/employmentRules/evaluateMinorJobEligibility";
import type {
  EligibilityIssueCode,
  JobWorkConditionsInput,
  MinorJobEligibilityResult,
  SeekerEligibilityInput,
} from "@/lib/employmentRules/types";
import type { ApplicationAnswers, ScheduleFit } from "@/lib/jobs/applicationAnswers";
import { resolveJobRequirements } from "@/lib/jobs/jobRequirements";
import {
  normalizeMatchBlob,
  overlapJaccard,
  tokenizeToCanonSet,
} from "@/lib/matching/normalization";
import { isCertificateValidForMatching } from "@/lib/seeker/certificateVerification";

export type ApplyEligibilityStatus = "eligible" | "attention" | "blocked";

export type ApplyEligibilityIssueSeverity = "block" | "attention" | "info";

export type ApplyEligibilityIssueCode =
  | "legal_schedule_not_suitable"
  | "legal_needs_review"
  | "missing_mandatory_certificates"
  | "partial_mandatory_certificates"
  | "missing_mandatory_requirements"
  | "partial_mandatory_requirements"
  | "missing_recommended_requirements"
  | "workload_mismatch"
  | "workload_incompatible"
  | "hours_outside_preference"
  | "hours_incompatible"
  | "schedule_does_not_fit"
  | "schedule_partial_fit"
  | "availability_late";

export type ApplyEligibilityIssue = {
  code: ApplyEligibilityIssueCode;
  severity: ApplyEligibilityIssueSeverity;
};

export type ApplyEligibilityResult = {
  status: ApplyEligibilityStatus;
  issues: ApplyEligibilityIssue[];
  /**
   * True when status is driven by mandatory legal work conditions
   * (not by match score or soft preference gaps).
   */
  legalBlock: boolean;
  /**
   * Detailed employment-rules outcome for minors (especially 16–17).
   * UI maps `issues` + `limits` — does not hardcode legislation.
   */
  legalDetail: MinorJobEligibilityResult | null;
};

export type ApplyEligibilitySeekerInput = {
  skills: string[] | null;
  about: string | null;
  profile_title: string | null;
  languages: string[] | null;
  has_b_category_drivers_license?: boolean | null;
  pref_desired_weekly_hours?: number | null;
  pref_min_weekly_hours?: number | null;
  pref_max_weekly_hours?: number | null;
  pref_full_time?: boolean | null;
  pref_part_time?: boolean | null;
  certificates: {
    certificate_name: string | null;
    certificate_issuer: string | null;
    certificate_valid_until?: string | null;
  }[];
  legal?: SeekerEligibilityInput | null;
};

export type ApplyEligibilityJobInput = {
  title: string | null;
  job_type: string | null;
  work_type: string | null;
  short_summary: string | null;
  requirements: string | null;
  requirement_lines: string[] | null;
  job_requirements?: unknown;
  required_skills: string[] | null;
  keywords: string[] | null;
  certificate_requirements: string | null;
  weekly_hours?: number | null;
  daily_hours?: number | null;
  shift_start?: string | null;
  shift_end?: string | null;
  includes_night_work?: boolean | null;
  is_hazardous_work?: boolean | null;
};

export type ApplyEligibilityContext = {
  answers?: {
    weeklyHoursDesired?: number | null;
    scheduleFits?: ScheduleFit | null;
    availability_start?: ApplicationAnswers["availability_start"] | null;
  } | null;
};

/** Codes that represent mandatory legal work-condition conflicts (not fit score). */
export const LEGAL_APPLY_BLOCK_CODES: readonly ApplyEligibilityIssueCode[] = [
  "legal_schedule_not_suitable",
] as const;

function parseCertificateSlots(text: string | null): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[,;\n\r]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 14);
}

function certificateMatchCount(
  slots: string[],
  certs: ApplyEligibilitySeekerInput["certificates"],
  hasB: boolean
): number {
  const rows = certs.filter((c) =>
    isCertificateValidForMatching(c.certificate_valid_until ?? null)
  );
  if (hasB) {
    rows.push({ certificate_name: "B-kategooria juhiluba", certificate_issuer: "juhiluba" });
  }
  const seekerBlob = normalizeMatchBlob(rows.map((c) => `${c.certificate_name ?? ""} ${c.certificate_issuer ?? ""}`));
  const seekerSet = tokenizeToCanonSet(rows.map((c) => `${c.certificate_name ?? ""} ${c.certificate_issuer ?? ""}`));
  let matched = 0;
  for (const slot of slots) {
    const slotNorm = normalizeMatchBlob([slot]);
    if (!slotNorm) continue;
    if (seekerBlob.includes(slotNorm)) {
      matched++;
      continue;
    }
    if (overlapJaccard(tokenizeToCanonSet([slot]), seekerSet) >= 0.34) matched++;
  }
  return matched;
}

function expectedJobWeeklyHours(job: ApplyEligibilityJobInput): number | null {
  const wh = job.weekly_hours;
  if (wh !== null && wh !== undefined && Number.isFinite(Number(wh)) && Number(wh) > 0) {
    return Number(wh);
  }
  const jt = (job.job_type ?? "").toLowerCase();
  if (jt === "full_time") return 40;
  if (jt === "part_time") return 20;
  return null;
}

function lineEvidence(line: string, seekerTokenSet: Set<string>): boolean {
  const lineSet = tokenizeToCanonSet([line]);
  if (!lineSet.size) return false;
  return overlapJaccard(lineSet, seekerTokenSet) >= 0.34;
}

/**
 * Deterministic pre-apply eligibility.
 * Never uses match score. Never auto-rejects. Apply UI must remain submitable.
 */
export function evaluateApplyEligibility(
  seeker: ApplyEligibilitySeekerInput,
  job: ApplyEligibilityJobInput,
  context?: ApplyEligibilityContext | null
): ApplyEligibilityResult {
  const issues: ApplyEligibilityIssue[] = [];
  const answers = context?.answers ?? null;
  let legalDetail: MinorJobEligibilityResult | null = null;

  // 1) Age-related legal limits (minors only) — only place that may `block`.
  // Uses configurable employmentRules (hours, day length, shift, nature, learning obligation).
  if (seeker.legal?.isMinor && seeker.legal.ageYears !== null) {
    const jobConditions: JobWorkConditionsInput = {
      jobType: job.job_type ?? null,
      weeklyHours: job.weekly_hours ?? null,
      dailyHours: job.daily_hours ?? null,
      shiftStart: job.shift_start ?? null,
      shiftEnd: job.shift_end ?? null,
      includesNightWork: job.includes_night_work ?? null,
      isHazardousWork: job.is_hazardous_work ?? null,
    };
    const legal = evaluateMinorJobEligibility(seeker.legal, jobConditions);
    legalDetail = legal;
    if (legal?.status === "schedule_not_suitable") {
      issues.push({ code: "legal_schedule_not_suitable", severity: "block" });
    } else if (legal?.status === "needs_review") {
      issues.push({ code: "legal_needs_review", severity: "attention" });
    }
  }

  // 2) Mandatory certificates — soft eligibility tip + reflected in match score; never blocks apply.
  const certSlots = parseCertificateSlots(job.certificate_requirements);
  if (certSlots.length) {
    const matched = certificateMatchCount(
      certSlots,
      seeker.certificates,
      Boolean(seeker.has_b_category_drivers_license)
    );
    if (matched === 0) {
      issues.push({ code: "missing_mandatory_certificates", severity: "attention" });
    } else if (matched < certSlots.length) {
      issues.push({ code: "partial_mandatory_certificates", severity: "attention" });
    }
  }

  // 3) Structured requirements — never block apply; score ranks these separately.
  const reqItems = resolveJobRequirements({
    job_requirements: job.job_requirements,
    requirement_lines: job.requirement_lines,
    requirements: job.requirements,
  });
  const seekerTokenSet = tokenizeToCanonSet([
    seeker.profile_title,
    seeker.about,
    ...(seeker.skills ?? []).map(String),
    ...(seeker.languages ?? []).map(String),
    ...seeker.certificates.map((c) => `${c.certificate_name ?? ""} ${c.certificate_issuer ?? ""}`),
  ]);

  const mandatory = reqItems.filter((r) => r.priority === "mandatory");
  const recommended = reqItems.filter((r) => r.priority === "recommended");
  if (mandatory.length) {
    const hit = mandatory.filter((r) => lineEvidence(r.text, seekerTokenSet)).length;
    if (hit === 0) {
      issues.push({ code: "missing_mandatory_requirements", severity: "attention" });
    } else if (hit < mandatory.length) {
      issues.push({ code: "partial_mandatory_requirements", severity: "attention" });
    }
  }
  if (recommended.length) {
    const hit = recommended.filter((r) => lineEvidence(r.text, seekerTokenSet)).length;
    if (hit < recommended.length) {
      issues.push({ code: "missing_recommended_requirements", severity: "info" });
    }
  }

  // 4) Workload + hours — preference signals only (also in score); never legal block.
  const jobHours = expectedJobWeeklyHours(job);
  const desired =
    answers?.weeklyHoursDesired !== null &&
    answers?.weeklyHoursDesired !== undefined &&
    Number.isFinite(Number(answers.weeklyHoursDesired))
      ? Number(answers.weeklyHoursDesired)
      : seeker.pref_desired_weekly_hours !== null &&
          seeker.pref_desired_weekly_hours !== undefined &&
          Number.isFinite(Number(seeker.pref_desired_weekly_hours))
        ? Number(seeker.pref_desired_weekly_hours)
        : null;
  const minH =
    seeker.pref_min_weekly_hours !== null && seeker.pref_min_weekly_hours !== undefined
      ? Number(seeker.pref_min_weekly_hours)
      : null;
  const maxH =
    seeker.pref_max_weekly_hours !== null && seeker.pref_max_weekly_hours !== undefined
      ? Number(seeker.pref_max_weekly_hours)
      : null;

  if (jobHours !== null && desired !== null) {
    const delta = Math.abs(desired - jobHours);
    if (delta > 20) {
      issues.push({ code: "workload_incompatible", severity: "attention" });
    } else if (delta > 10) {
      issues.push({ code: "workload_mismatch", severity: "attention" });
    }
  }

  if (jobHours !== null && (minH !== null || maxH !== null)) {
    const lo = minH !== null && Number.isFinite(minH) ? minH : 0;
    const hi = maxH !== null && Number.isFinite(maxH) ? maxH : 60;
    if (jobHours > hi + 8 || jobHours < lo - 8) {
      issues.push({ code: "hours_incompatible", severity: "attention" });
    } else if (jobHours > hi || jobHours < lo) {
      issues.push({ code: "hours_outside_preference", severity: "attention" });
    }
  } else if (jobHours !== null) {
    const jt = (job.job_type ?? "").toLowerCase();
    if (jt === "full_time" && seeker.pref_part_time && !seeker.pref_full_time) {
      issues.push({ code: "workload_mismatch", severity: "attention" });
    }
    if (jt === "part_time" && seeker.pref_full_time && !seeker.pref_part_time) {
      issues.push({ code: "workload_mismatch", severity: "attention" });
    }
  }

  // 5) Schedule / availability from apply answers — soft tips only.
  const scheduleFits = answers?.scheduleFits as ScheduleFit | undefined;
  if (scheduleFits === "no") {
    issues.push({ code: "schedule_does_not_fit", severity: "attention" });
  } else if (scheduleFits === "partial") {
    issues.push({ code: "schedule_partial_fit", severity: "attention" });
  }

  const start = answers?.availability_start;
  if (start === "specific_date" || start === "within_1_month") {
    issues.push({ code: "availability_late", severity: "attention" });
  }

  const legalBlock = issues.some(
    (i) => i.severity === "block" && (LEGAL_APPLY_BLOCK_CODES as readonly string[]).includes(i.code)
  );
  const hasAttention = issues.some((i) => i.severity === "attention");
  // Info (recommended) never alone decides status. Score never decides status.
  const status: ApplyEligibilityStatus = legalBlock
    ? "blocked"
    : hasAttention
      ? "attention"
      : "eligible";

  return { status, issues, legalBlock, legalDetail };
}

/** Issues that should be explained to the user (skip pure noise). */
export function applyEligibilityIssuesForDisplay(
  result: ApplyEligibilityResult
): ApplyEligibilityIssue[] {
  if (result.status === "eligible") {
    return result.issues.filter((i) => i.severity === "info").slice(0, 2);
  }
  // Legal blocks first, then other attention; at most one recommended tip.
  const legal = result.issues.filter((i) => i.severity === "block");
  const hard = result.issues.filter((i) => i.severity === "attention");
  const info = result.issues.filter((i) => i.severity === "info").slice(0, 1);
  return [...legal, ...hard, ...info].slice(0, 6);
}

/** Employment-rules detail codes for minors (prefer these over generic legal_* labels). */
export function applyEligibilityLegalDetailCodes(
  result: ApplyEligibilityResult
): EligibilityIssueCode[] {
  return result.legalDetail?.issues ?? [];
}
