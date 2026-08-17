import {
  applicationAnswersFromUnknown,
  earliestAvailabilityDate,
  type ApplicationAnswers,
  type AvailabilityStart,
} from "@/lib/jobs/applicationAnswers";
import { parseMatchBreakdown } from "@/lib/employer/parseMatchBreakdown";
import {
  parseCertificateVerificationStatus,
  resolveCertificateEffectiveStatus,
} from "@/lib/seeker/certificateVerification";

export type ApplicantInboxJobOption = {
  id: string;
  title: string;
  applicantCount: number;
};

export type ApplicantApplicationRow = {
  id: string;
  created_at: string | null;
  status?: string | null;
  status_updated_at?: string | null;
  cover_letter?: string | null;
  match_score: number | null;
  match_breakdown: unknown;
  shared_profile: unknown;
  application_answers?: unknown;
  resolved_cv_url?: string | null;
  live?: {
    languages: string[];
    experienceDurationYears: number | null;
    seekingFirstJob: boolean;
  } | null;
};

const AVAILABILITY_RANK: Record<AvailabilityStart, number> = {
  immediate: 0,
  within_1_week: 1,
  within_2_weeks: 2,
  within_1_month: 3,
  specific_date: 4,
  by_agreement: 5,
};

export function displayApplicantName(fullName: string | null | undefined) {
  const s = (fullName ?? "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const first = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1] ?? "";
  const initial = last.trim() ? `${last.trim()[0]!.toUpperCase()}.` : "";
  return initial ? `${first} ${initial}` : first;
}

export function applicantInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0]?.toUpperCase() ?? "") : "";
  return `${first}${last}` || "—";
}

export function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

export function answersFromApplicantRow(row: ApplicantApplicationRow): ApplicationAnswers | null {
  return applicationAnswersFromUnknown(
    (row.shared_profile as { answers?: unknown } | null)?.answers ?? row.application_answers ?? null,
  );
}

export function seekerFromApplicantRow(row: ApplicantApplicationRow): Record<string, unknown> {
  return (row.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
}

function certNames(seeker: Record<string, unknown>, verifiedOnly: boolean): string[] {
  const certRows = Array.isArray(seeker.certificates) ? seeker.certificates : [];
  const names: string[] = [];
  for (const c of certRows) {
    const row = c as {
      certificate_name?: string | null;
      certificate_valid_until?: string | null;
      verification_status?: string | null;
    };
    const name = (row.certificate_name ?? "").toString().trim();
    if (!name) continue;
    if (verifiedOnly) {
      const effective = resolveCertificateEffectiveStatus({
        verification_status: parseCertificateVerificationStatus(row.verification_status),
        certificate_valid_until: row.certificate_valid_until ?? null,
      });
      if (effective !== "verified") continue;
    }
    names.push(name);
  }
  return names;
}

/** Monthly-ish figure for salary filters. Hourly is approximated; negotiable is null. */
export function salaryMonthlyApprox(answers: ApplicationAnswers | null): number | null {
  if (!answers || answers.salaryMode === "negotiable") return null;
  const amount = answers.salary_expectation_max ?? answers.salary_expectation_min;
  if (amount === null || !Number.isFinite(amount)) return null;
  if (answers.salaryBasis === "bruto_hourly") return amount * 160;
  return amount;
}

export function salarySortValue(answers: ApplicationAnswers | null): number {
  const n = salaryMonthlyApprox(answers);
  return n === null ? Number.POSITIVE_INFINITY : n;
}

export function availabilitySortValue(answers: ApplicationAnswers | null, asOf: Date = new Date()): number {
  if (!answers) return Number.POSITIVE_INFINITY;
  if (answers.availability_start === "specific_date") {
    const d = earliestAvailabilityDate(answers, asOf);
    return d ? d.getTime() : Number.POSITIVE_INFINITY;
  }
  const rank = AVAILABILITY_RANK[answers.availability_start] ?? 9;
  return rank * 86_400_000 * 40;
}

export type ApplicantScan = {
  name: string;
  avatarUrl: string;
  profileTitle: string;
  score: number | null;
  reqMatched: number;
  reqTotal: number;
  answers: ApplicationAnswers | null;
  salaryMonthly: number | null;
  salarySort: number;
  startSort: number;
  appliedAtMs: number;
  certNamesAll: string[];
  certNamesVerified: string[];
  experienceLevel: string;
  years: number | null;
  firstJob: boolean;
  languages: string[];
  skills: string[];
  weeklyHours: number | null;
};

export function scanApplicantRow(row: ApplicantApplicationRow): ApplicantScan {
  const seeker = seekerFromApplicantRow(row);
  const answers = answersFromApplicantRow(row);
  const bd = parseMatchBreakdown(row.match_breakdown);
  const snapYearsRaw = seeker.experience_duration_years;
  const snapYears = snapYearsRaw === null || snapYearsRaw === undefined ? null : Number(snapYearsRaw);
  const years =
    row.live?.experienceDurationYears ?? (snapYears !== null && Number.isFinite(snapYears) ? snapYears : null);
  const firstJob =
    Boolean(row.live?.seekingFirstJob) || Boolean(seeker.seeking_first_job);
  const languages = [
    ...asStringArray(seeker.languages),
    ...(row.live?.languages ?? []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  return {
    name: displayApplicantName((seeker.full_name as string | undefined) ?? null),
    avatarUrl: ((seeker.avatar_url as string | undefined) ?? "").toString().trim(),
    profileTitle: ((seeker.profile_title as string | undefined) ?? "").trim(),
    score: typeof row.match_score === "number" ? row.match_score : null,
    reqMatched: bd?.requirementsMatched ?? 0,
    reqTotal: bd?.requirementsTotal ?? 0,
    answers,
    salaryMonthly: salaryMonthlyApprox(answers),
    salarySort: salarySortValue(answers),
    startSort: availabilitySortValue(answers),
    appliedAtMs: row.created_at ? new Date(row.created_at).getTime() : 0,
    certNamesAll: certNames(seeker, false),
    certNamesVerified: certNames(seeker, true),
    experienceLevel: ((seeker.experience_level as string | undefined) ?? "").trim(),
    years,
    firstJob,
    languages,
    skills: asStringArray(seeker.skills),
    weeklyHours:
      answers?.weeklyHoursDesired !== undefined && answers?.weeklyHoursDesired !== null
        ? answers.weeklyHoursDesired
        : null,
  };
}

export function uniqueCertificateNames(rows: ApplicantApplicationRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const name of scanApplicantRow(row).certNamesAll) {
      set.add(name);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
