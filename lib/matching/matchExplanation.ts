import type { ApplicationAnswers } from "@/lib/jobs/applicationAnswers";
import { resolveJobRequirements } from "@/lib/jobs/jobRequirements";
import type {
  JobMatchInput,
  MatchBreakdown,
  SeekerCertificateInput,
  SeekerMatchInput,
} from "@/lib/matching/calculateJobMatch";
import {
  normalizeMatchBlob,
  overlapJaccard,
  tokenizeToCanonSet,
} from "@/lib/matching/normalization";
import { jobExperienceOpenToBeginners } from "@/lib/matching/profileRules";
import { isCertificateValidForMatching } from "@/lib/seeker/certificateVerification";

export type MatchCriterionStatus = "pass" | "partial" | "gap";
export type MatchCriterionPriority = "mandatory" | "preferred";

export type MatchCriterion = {
  id: string;
  status: MatchCriterionStatus;
  priority: MatchCriterionPriority;
  messageKey: string;
  values?: Record<string, string | number>;
};

export type MatchExplanation = {
  criteria: MatchCriterion[];
  mandatoryFilled: number;
  mandatoryTotal: number;
  recommendedFilled: number;
  recommendedTotal: number;
};

/** Card “why” panel and list payloads. Job/employer detail may use a higher cap. */
export const MATCH_EXPLANATION_CRITERIA_CAP = 8;

function isCriterionStatus(v: unknown): v is MatchCriterionStatus {
  return v === "pass" || v === "partial" || v === "gap";
}

function isCriterionPriority(v: unknown): v is MatchCriterionPriority {
  return v === "mandatory" || v === "preferred";
}

export function parseMatchExplanation(raw: unknown): MatchExplanation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const criteria: MatchCriterion[] = [];
  if (Array.isArray(o.criteria)) {
    for (const item of o.criteria) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const id = (row.id ?? "").toString().trim();
      const messageKey = (row.messageKey ?? "").toString().trim();
      if (!id || !messageKey || !isCriterionStatus(row.status) || !isCriterionPriority(row.priority)) continue;
      const values =
        row.values && typeof row.values === "object" && !Array.isArray(row.values)
          ? (row.values as Record<string, string | number>)
          : undefined;
      criteria.push({ id, status: row.status, priority: row.priority, messageKey, ...(values ? { values } : {}) });
    }
  }
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  return {
    criteria,
    mandatoryFilled: n(o.mandatoryFilled),
    mandatoryTotal: n(o.mandatoryTotal),
    recommendedFilled: n(o.recommendedFilled),
    recommendedTotal: n(o.recommendedTotal),
  };
}

export function emptyMatchExplanation(): MatchExplanation {
  return {
    criteria: [],
    mandatoryFilled: 0,
    mandatoryTotal: 0,
    recommendedFilled: 0,
    recommendedTotal: 0,
  };
}

/** Display-only typical years for a job level. Not the scoring formula. */
const TYPICAL_YEARS: Record<string, number> = {
  entry: 1,
  mid: 3,
  senior: 5,
  lead: 8,
  executive: 10,
};

const LANG_CATALOG: { id: string; re: RegExp }[] = [
  { id: "et", re: /eesti|estonian|эстон/i },
  { id: "en", re: /inglise|english|англий/i },
  { id: "ru", re: /vene|russian|русск/i },
  { id: "fi", re: /soome|finnish|финск/i },
  { id: "de", re: /saksa|german|немец/i },
  { id: "fr", re: /prantsuse|french|француз/i },
  { id: "es", re: /hispaania|spanish|испан/i },
  { id: "sv", re: /rootsi|swedish|швед/i },
  { id: "lv", re: /läti|latvian|латыш/i },
  { id: "lt", re: /leedu|lithuanian|литov/i },
];

const LANG_HINT =
  /\b(eesti|inglise|vene|soome|saksa|prantsuse|hispaania|rootsi|läti|leedu|estonian|english|russian|finnish|german|french|spanish|swedish|latvian|lithuanian|keeleoskus|language|язык|эстон|англий|русск)\b/i;

type ExplainAnswers = {
  scheduleFits?: ApplicationAnswers["scheduleFits"] | null;
  availability_start?: ApplicationAnswers["availability_start"] | null;
  weeklyHoursDesired?: number | null;
} | null;

export type MatchExplanationInput = {
  breakdown: Partial<MatchBreakdown> | null | undefined;
  job?: JobMatchInput | Record<string, unknown> | null;
  seeker?: SeekerMatchInput | null;
  certs?: SeekerCertificateInput[] | null;
  answers?: ExplainAnswers;
};

function shortLabel(text: string, max = 72): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

function statusFromRaw(raw: number, passAt: number, partialAt: number): MatchCriterionStatus {
  if (raw >= passAt) return "pass";
  if (raw >= partialAt) return "partial";
  return "gap";
}

function parseCertificateSlots(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[,;\n\r]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 14);
}

function lineMatches(line: string, seekerTokenSet: Set<string>): boolean {
  const lineSet = tokenizeToCanonSet([line]);
  if (!lineSet.size) return false;
  return overlapJaccard(lineSet, seekerTokenSet) >= 0.34;
}

function slotMatches(slot: string, seekerBlob: string, seekerCertSet: Set<string>): boolean {
  const slotNorm = normalizeMatchBlob([slot]);
  if (!slotNorm) return false;
  if (seekerBlob.includes(slotNorm)) return true;
  return overlapJaccard(tokenizeToCanonSet([slot]), seekerCertSet) >= 0.34;
}

function asJob(raw: JobMatchInput | Record<string, unknown> | null | undefined): JobMatchInput | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  return {
    title: (r.title ?? null) as string | null,
    location: (r.location ?? null) as string | null,
    work_type: (r.work_type ?? null) as string | null,
    job_type: (r.job_type ?? null) as string | null,
    short_summary: (r.short_summary ?? null) as string | null,
    description: (r.description ?? null) as string | null,
    requirements: (r.requirements ?? null) as string | null,
    requirement_lines: (r.requirement_lines as string[] | null) ?? null,
    job_requirements: r.job_requirements,
    required_skills: (r.required_skills as string[] | null) ?? null,
    keywords: (r.keywords as string[] | null) ?? null,
    experience_level_required: (r.experience_level_required ?? null) as string | null,
    certificate_requirements: (r.certificate_requirements ?? null) as string | null,
    industry_id: (r.industry_id ?? null) as string | null,
    profession_id: (r.profession_id ?? null) as string | null,
    skill_ids: (r.skill_ids as string[] | null) ?? null,
    certificate_ids: (r.certificate_ids as string[] | null) ?? null,
    language_ids: (r.language_ids as string[] | null) ?? null,
    weekly_hours: r.weekly_hours as number | null | undefined,
    daily_hours: r.daily_hours as number | null | undefined,
    shift_start: (r.shift_start ?? null) as string | null,
    shift_end: (r.shift_end ?? null) as string | null,
    includes_night_work: r.includes_night_work as boolean | null | undefined,
    is_hazardous_work: r.is_hazardous_work as boolean | null | undefined,
  };
}

function jobLanguageHints(job: JobMatchInput): string[] {
  return [
    ...(job.language_ids ?? []).map(String),
    ...(job.requirement_lines ?? []).map(String),
    ...(job.required_skills ?? []).map(String),
    ...(job.keywords ?? []).map(String),
    String(job.certificate_requirements ?? ""),
    String(job.short_summary ?? ""),
    String(job.title ?? ""),
  ].filter(Boolean);
}

function detectLanguageIds(texts: string[], jobLangIds?: string[] | null): string[] {
  const out: string[] = [];
  for (const id of jobLangIds ?? []) {
    if (id && !out.includes(id)) out.push(id);
  }
  const hay = texts.join(" ");
  for (const lang of LANG_CATALOG) {
    if (lang.re.test(hay) && !out.includes(lang.id)) out.push(lang.id);
  }
  return out;
}

function seekerHasLanguage(seekerLangs: string[] | null | undefined, id: string, seekerLangIds?: string[] | null): boolean {
  if ((seekerLangIds ?? []).includes(id)) return true;
  const spec = LANG_CATALOG.find((l) => l.id === id);
  if (!spec) return false;
  for (const raw of seekerLangs ?? []) {
    const n = String(raw).trim().toLowerCase();
    if (n === id) return true;
    if (spec.re.test(String(raw))) return true;
  }
  return false;
}

function activeCerts(
  seeker: SeekerMatchInput | null | undefined,
  certs: SeekerCertificateInput[] | null | undefined,
): SeekerCertificateInput[] {
  const list: SeekerCertificateInput[] = [...(certs ?? [])];
  if (seeker?.has_b_category_drivers_license) {
    list.push({
      certificate_name: "B-kategooria juhiluba",
      certificate_issuer: "juhiluba",
    });
  }
  return list.filter((c) => isCertificateValidForMatching(c.certificate_valid_until ?? null));
}

function sortCriteria(items: MatchCriterion[]): MatchCriterion[] {
  const statusRank: Record<MatchCriterionStatus, number> = { pass: 0, partial: 1, gap: 2 };
  return [...items].sort((a, b) => {
    const s = statusRank[a.status] - statusRank[b.status];
    if (s !== 0) return s;
    if (a.priority === b.priority) return 0;
    return a.priority === "mandatory" ? -1 : 1;
  });
}

/**
 * Human-readable match explanation. Does not change scoring.
 * Age, disability, work-capacity, and health are never included.
 */
export function buildMatchExplanation(args: MatchExplanationInput): MatchExplanation {
  const bd = args.breakdown;
  if (!bd) return emptyMatchExplanation();

  const job = asJob(args.job ?? null);
  const seeker = args.seeker ?? null;
  const answers = args.answers ?? null;
  const items: MatchCriterion[] = [];
  const push = (row: MatchCriterion) => items.push(row);

  const mandTotal = bd.requirementsMandatoryTotal ?? 0;
  const mandFilled = bd.requirementsMandatoryMatched ?? 0;
  const recTotal = bd.requirementsRecommendedTotal ?? 0;
  const recFilled = bd.requirementsRecommendedMatched ?? 0;

  const certs = activeCerts(seeker, args.certs);
  const seekerBlob = normalizeMatchBlob(
    certs.map((c) => `${c.certificate_name ?? ""} ${c.certificate_issuer ?? ""}`),
  );
  const seekerCertSet = tokenizeToCanonSet(
    certs.map((c) => `${c.certificate_name ?? ""} ${c.certificate_issuer ?? ""}`),
  );
  const seekerTokenSet = tokenizeToCanonSet([
    seeker?.profile_title,
    seeker?.about,
    ...(seeker?.skills ?? []).map(String),
    ...(seeker?.languages ?? []).map(String),
  ]);

  const certSlots = job ? parseCertificateSlots(job.certificate_requirements) : [];
  if (certSlots.length) {
    certSlots.forEach((slot, i) => {
      const ok = slotMatches(slot, seekerBlob, seekerCertSet);
      push({
        id: `cert-${i}`,
        status: ok ? "pass" : "gap",
        priority: "mandatory",
        messageKey: ok ? "matchExplainCertPass" : "matchExplainCertGap",
        values: { name: shortLabel(slot) },
      });
    });
  } else if ((bd.certificate_slots_required ?? 0) > 0) {
    const st = statusFromRaw(bd.certificate_raw ?? 0, 0.72, 0.42);
    push({
      id: "cert",
      status: st,
      priority: "mandatory",
      messageKey:
        st === "pass" ? "matchReasonCertPass" : st === "partial" ? "matchReasonCertPartial" : "matchReasonCertGap",
    });
  }

  const reqItems = job
    ? resolveJobRequirements({
        job_requirements: job.job_requirements,
        requirement_lines: job.requirement_lines,
        requirements: job.requirements,
      }).slice(0, 16)
    : [];
  if (reqItems.length && seeker) {
    for (const [i, item] of reqItems.entries()) {
      const ok = lineMatches(item.text, seekerTokenSet);
      const mandatory = item.priority === "mandatory";
      push({
        id: `req-${i}`,
        status: ok ? "pass" : "gap",
        priority: mandatory ? "mandatory" : "preferred",
        messageKey: ok
          ? mandatory
            ? "matchExplainMandReqPass"
            : "matchExplainRecReqPass"
          : mandatory
            ? "matchExplainMandReqGap"
            : "matchExplainRecReqGap",
        values: { name: shortLabel(item.text) },
      });
    }
  } else {
    if (mandTotal > 0 && bd.requirements_mandatory_raw !== undefined) {
      const st = statusFromRaw(bd.requirements_mandatory_raw, 0.7, 0.35);
      push({
        id: "mand",
        status: st,
        priority: "mandatory",
        messageKey:
          st === "pass"
            ? "matchReasonMandReqPass"
            : st === "partial"
              ? "matchReasonMandReqPartial"
              : "matchReasonMandReqGap",
      });
    }
    if (recTotal > 0 && bd.requirements_recommended_raw !== undefined) {
      const st = statusFromRaw(bd.requirements_recommended_raw, 0.7, 0.35);
      push({
        id: "rec",
        status: st,
        priority: "preferred",
        messageKey:
          st === "pass"
            ? "matchReasonRecReqPass"
            : st === "partial"
              ? "matchReasonRecReqPartial"
              : "matchReasonRecReqGap",
      });
    }
  }

  const locRaw = bd.location_raw ?? 0;
  {
    const st = statusFromRaw(locRaw, 0.72, 0.45);
    push({
      id: "loc",
      status: st,
      priority: "preferred",
      messageKey:
        st === "pass" ? "matchReasonLocPass" : st === "partial" ? "matchReasonLocPartial" : "matchReasonLocGap",
    });
  }

  if (bd.workload_raw !== undefined) {
    const st = statusFromRaw(bd.workload_raw, 0.72, 0.4);
    push({
      id: "load",
      status: st,
      priority: "preferred",
      messageKey:
        st === "pass"
          ? "matchReasonWorkloadPass"
          : st === "partial"
            ? "matchReasonWorkloadPartial"
            : "matchReasonWorkloadGap",
    });
  }

  const hints = job ? jobLanguageHints(job) : [];
  const langRelevant = Boolean(job?.language_ids?.length) || hints.some((h) => LANG_HINT.test(h));
  const namedLangs = detectLanguageIds(hints, job?.language_ids);
  if (namedLangs.length) {
    for (const id of namedLangs) {
      const ok = seekerHasLanguage(seeker?.languages, id, seeker?.language_ids);
      push({
        id: `lang-${id}`,
        status: ok ? "pass" : "gap",
        priority: "preferred",
        messageKey: ok ? "matchExplainLangPass" : "matchExplainLangGap",
        values: { language: id },
      });
    }
  } else if (langRelevant || (bd.languages_raw !== undefined && hints.length > 0)) {
    const st = statusFromRaw(bd.languages_raw ?? 0, 0.72, 0.4);
    push({
      id: "lang",
      status: st,
      priority: "preferred",
      messageKey:
        st === "pass" ? "matchReasonLangPass" : st === "partial" ? "matchReasonLangPartial" : "matchReasonLangGap",
    });
  }

  const hasAvailability = Boolean(answers?.availability_start);
  if (hasAvailability && bd.availability_raw !== undefined) {
    const st = statusFromRaw(bd.availability_raw, 0.85, 0.55);
    push({
      id: "start",
      status: st,
      priority: "preferred",
      messageKey:
        st === "pass"
          ? "matchExplainStartPass"
          : st === "partial"
            ? "matchReasonStartPartial"
            : "matchReasonStartGap",
    });
  }

  const jobExp = (job?.experience_level_required ?? "").trim() || null;
  const expNotRequired = jobExp === "not_required";
  const expRaw = bd.experience_raw ?? 0;
  const duration = seeker?.experience_background?.experience_duration_years;
  const years =
    duration !== null && duration !== undefined && Number.isFinite(Number(duration)) ? Number(duration) : null;
  const firstJob = Boolean(seeker?.experience_background?.seeking_first_job) || (years !== null && years <= 0);
  const openToBeginners = jobExperienceOpenToBeginners(jobExp);
  const want = jobExp && jobExp !== "not_required" ? TYPICAL_YEARS[jobExp] : undefined;

  if (expNotRequired) {
    push({
      id: "exp",
      status: "pass",
      priority: "preferred",
      messageKey: "matchExplainExpNotRequired",
    });
  } else if (openToBeginners && firstJob) {
    push({
      id: "exp",
      status: "pass",
      priority: "preferred",
      messageKey: "matchExplainExpFirstJobOk",
    });
  } else {
    const st = expRaw >= 0.75 ? "pass" : expRaw >= 0.45 ? "partial" : "gap";
    if (years !== null && want !== undefined && st !== "pass") {
      push({
        id: "exp",
        status: st,
        priority: "preferred",
        messageKey: "matchExplainExpYearsPartial",
        values: { have: years, want },
      });
    } else if (years !== null && st === "pass") {
      push({
        id: "exp",
        status: "pass",
        priority: "preferred",
        messageKey: "matchExplainExpYearsPass",
        values: { have: years },
      });
    } else {
      push({
        id: "exp",
        status: st,
        priority: "preferred",
        messageKey:
          st === "pass" ? "matchReasonExpPass" : st === "partial" ? "matchReasonExpPartial" : "matchReasonExpGap",
      });
    }
  }

  if (bd.skills_keywords_raw !== undefined) {
    const st = statusFromRaw(bd.skills_keywords_raw, 0.72, 0.38);
    push({
      id: "skills",
      status: st,
      priority: "preferred",
      messageKey:
        st === "pass"
          ? "matchReasonSkillsPass"
          : st === "partial"
            ? "matchReasonSkillsPartial"
            : "matchReasonSkillsGap",
    });
  }

  if (bd.work_mode_raw !== undefined) {
    const st = statusFromRaw(bd.work_mode_raw, 0.72, 0.4);
    push({
      id: "mode",
      status: st,
      priority: "preferred",
      messageKey:
        st === "pass"
          ? "matchReasonWorkModePass"
          : st === "partial"
            ? "matchReasonWorkModePartial"
            : "matchReasonWorkModeGap",
    });
  }

  if (answers?.scheduleFits) {
    const st =
      answers.scheduleFits === "yes" ? "pass" : answers.scheduleFits === "partial" ? "partial" : "gap";
    push({
      id: "schedule",
      status: st,
      priority: "preferred",
      messageKey:
        st === "pass"
          ? "matchReasonSchedulePass"
          : st === "partial"
            ? "matchReasonSchedulePartial"
            : "matchReasonScheduleGap",
    });
  }

  if (!items.length) {
    push({
      id: "fallback",
      status: statusFromRaw((bd.skills_keywords_raw ?? 0.5) * 0.5 + (bd.location_raw ?? 0.5) * 0.5, 0.72, 0.4),
      priority: "preferred",
      messageKey: "matchExplainFallback",
    });
  }

  return {
    criteria: sortCriteria(items),
    mandatoryFilled: mandFilled,
    mandatoryTotal: mandTotal,
    recommendedFilled: recFilled,
    recommendedTotal: recTotal,
  };
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

/** Employer application snapshot → explanation (no fake scores). */
export function buildMatchExplanationFromSharedProfile(args: {
  breakdown: Partial<MatchBreakdown> | null | undefined;
  sharedProfile: unknown;
  applicationAnswers?: unknown;
}): MatchExplanation {
  const shared = args.sharedProfile && typeof args.sharedProfile === "object" ? (args.sharedProfile as Record<string, unknown>) : {};
  const seekerRaw = (shared.seeker && typeof shared.seeker === "object" ? shared.seeker : {}) as Record<string, unknown>;
  const jobRaw = (shared.job && typeof shared.job === "object" ? shared.job : {}) as Record<string, unknown>;
  const answersRaw = shared.answers ?? args.applicationAnswers ?? null;
  const answers =
    answersRaw && typeof answersRaw === "object"
      ? (answersRaw as {
          scheduleFits?: ApplicationAnswers["scheduleFits"];
          availability_start?: ApplicationAnswers["availability_start"];
          weeklyHoursDesired?: number | null;
        })
      : null;

  const certRows = seekerRaw.certificates;
  const certs: SeekerCertificateInput[] = Array.isArray(certRows)
    ? certRows.map((c) => {
        const row = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
        return {
          certificate_name: (row.certificate_name ?? null) as string | null,
          certificate_issuer: (row.certificate_issuer ?? null) as string | null,
          certificate_valid_until: (row.certificate_valid_until ?? null) as string | null,
        };
      })
    : [];

  const yearsRaw = seekerRaw.experience_duration_years;
  const years = yearsRaw === null || yearsRaw === undefined ? null : Number(yearsRaw);

  const seeker: SeekerMatchInput = {
    profile_title: (seekerRaw.profile_title ?? null) as string | null,
    full_name: (seekerRaw.full_name ?? null) as string | null,
    location: (seekerRaw.location ?? null) as string | null,
    about: (seekerRaw.about ?? null) as string | null,
    skills: asStringArray(seekerRaw.skills),
    experience_level: (seekerRaw.experience_level ?? null) as string | null,
    preferred_job_types: asStringArray(seekerRaw.preferred_job_types),
    preferred_locations: asStringArray(seekerRaw.preferred_locations),
    has_b_category_drivers_license: Boolean(seekerRaw.has_b_category_drivers_license),
    languages: asStringArray(seekerRaw.languages),
    experience_background: {
      seeking_first_job: Boolean(seekerRaw.seeking_first_job ?? seekerRaw.exp_seeking_first_job),
      is_student: Boolean(seekerRaw.exp_is_student),
      has_internship: Boolean(seekerRaw.exp_has_internship),
      has_volunteer: Boolean(seekerRaw.exp_has_volunteer),
      has_project: Boolean(seekerRaw.exp_has_project),
      has_prior_work: Boolean(seekerRaw.exp_has_prior_work),
      experience_duration_years: years !== null && Number.isFinite(years) ? years : null,
    },
  };

  return buildMatchExplanation({
    breakdown: args.breakdown,
    job: jobRaw,
    seeker,
    certs,
    answers,
  });
}
