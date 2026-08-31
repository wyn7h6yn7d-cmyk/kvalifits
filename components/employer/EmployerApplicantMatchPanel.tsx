"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import type { MatchBreakdown } from "@/lib/matching/calculateJobMatch";
import { MATCH_MODEL_VERSION, MATCH_WEIGHTS } from "@/lib/matching/calculateJobMatch";
import { FitScoreExplain } from "@/components/jobs/FitScoreExplain";
import type { MatchExplanation } from "@/lib/matching/matchExplanation";
import { buildMatchExplanation } from "@/lib/matching/matchExplanation";
import { cn } from "@/lib/utils";

export type EmployerApplicantMatchPanelProps = {
  score: number | null;
  breakdown: Partial<MatchBreakdown> | null;
  explanation?: MatchExplanation | null;
  /** Render full interactive panel (default) or a breakdown-only card for detail sections. */
  variant?: "full" | "breakdownOnly";
  seeker: {
    displayName: string;
    profileTitle: string;
    location: string;
    experienceLabel: string;
    skills: string[];
  };
  job: {
    title: string;
    location: string;
    metaLine: string;
    experienceLabel: string;
    requirementLines: string[];
    requiredSkills: string[];
    certRequirements: string | null;
    shortSummary: string | null;
  };
};

type Segment = "seeker" | "fit" | "employer" | "breakdown";

function weakAreaLabel(code: string, t: (key: string) => string) {
  switch (code) {
    case "skills_keywords":
      return t("applicantMatchWeak_skills_keywords");
    case "certificates":
      return t("applicantMatchWeak_certificates");
    case "experience":
      return t("applicantMatchWeak_experience");
    case "role_title":
      return t("applicantMatchWeak_role_title");
    case "location":
      return t("applicantMatchWeak_location");
    case "work_job_type":
      return t("applicantMatchWeak_work_job_type");
    case "requirements_mandatory":
      return t("applicantMatchWeak_requirements_mandatory");
    case "languages":
      return t("applicantMatchWeak_languages");
    case "work_mode":
      return t("applicantMatchWeak_work_mode");
    case "arrangement":
      return t("applicantMatchWeak_arrangement");
    case "workload":
      return t("applicantMatchWeak_workload");
    case "availability":
      return t("applicantMatchWeak_availability");
    default:
      return "";
  }
}

function penaltyLabel(code: string, t: (key: string) => string) {
  switch (code) {
    case "no_skill_requirements_overlap":
      return t("applicantMatchPenalty_no_skill_requirements_overlap");
    case "weak_skill_requirements_overlap":
      return t("applicantMatchPenalty_weak_skill_requirements_overlap");
    case "role_title_mismatch":
      return t("applicantMatchPenalty_role_title_mismatch");
    case "weak_role_title_alignment":
      return t("applicantMatchPenalty_weak_role_title_alignment");
    case "missing_required_certificates":
      return t("applicantMatchPenalty_missing_required_certificates");
    case "partial_certificates":
      return t("applicantMatchPenalty_partial_certificates");
    case "missing_mandatory_requirements":
      return t("applicantMatchPenalty_missing_mandatory_requirements");
    case "partial_mandatory_requirements":
      return t("applicantMatchPenalty_partial_mandatory_requirements");
    case "missing_recommended_requirements":
      return t("applicantMatchPenalty_missing_recommended_requirements");
    case "cap_missing_mandatory_requirements":
      return t("applicantMatchPenalty_cap_missing_mandatory_requirements");
    case "requirements_mismatch":
      return t("applicantMatchPenalty_requirements_mismatch");
    case "professional_alignment_missing":
      return t("applicantMatchPenalty_professional_alignment_missing");
    case "cap_no_skill_overlap":
      return t("applicantMatchPenalty_cap_no_skill_overlap");
    case "cap_role_title_mismatch":
      return t("applicantMatchPenalty_cap_role_title_mismatch");
    case "cap_missing_required_certificates":
      return t("applicantMatchPenalty_cap_missing_required_certificates");
    case "cap_professional_alignment_missing":
      return t("applicantMatchPenalty_cap_professional_alignment_missing");
    default:
      return code;
  }
}

const PENALTY_IMPLIES_WEAK_SKILLS = new Set([
  "no_skill_requirements_overlap",
  "weak_skill_requirements_overlap",
  "requirements_mismatch",
  "cap_no_skill_overlap",
]);
const PENALTY_IMPLIES_WEAK_CERTS = new Set([
  "missing_required_certificates",
  "partial_certificates",
  "cap_missing_required_certificates",
]);
const PENALTY_IMPLIES_WEAK_MANDATORY = new Set([
  "missing_mandatory_requirements",
  "partial_mandatory_requirements",
  "cap_missing_mandatory_requirements",
]);
const PENALTY_IMPLIES_WEAK_ROLE = new Set([
  "role_title_mismatch",
  "weak_role_title_alignment",
  "cap_role_title_mismatch",
]);
const PENALTY_IMPLIES_WEAK_BOTH = new Set(["professional_alignment_missing", "cap_professional_alignment_missing"]);

function filterWeakAreasAgainstPenalties(weakAreas: string[], penaltyCodes: string[]): string[] {
  const hide = new Set<string>();
  for (const c of penaltyCodes) {
    if (PENALTY_IMPLIES_WEAK_SKILLS.has(c) || PENALTY_IMPLIES_WEAK_BOTH.has(c)) hide.add("skills_keywords");
    if (PENALTY_IMPLIES_WEAK_CERTS.has(c)) hide.add("certificates");
    if (PENALTY_IMPLIES_WEAK_MANDATORY.has(c)) hide.add("requirements_mandatory");
    if (PENALTY_IMPLIES_WEAK_ROLE.has(c) || PENALTY_IMPLIES_WEAK_BOTH.has(c)) hide.add("role_title");
  }
  return weakAreas.filter((w) => !hide.has(w));
}

function scoreBandLabel(score: number | null, t: (key: string) => string): string | null {
  if (score == null || score < 0) return null;
  if (score < 25) return t("applicantMatchBandWeak");
  if (score < 45) return t("applicantMatchBandPartial");
  if (score < 70) return t("applicantMatchBandGood");
  return t("applicantMatchBandStrong");
}

function highlightLabel(code: string, t: (key: string) => string) {
  switch (code) {
    case "skillsStrong":
      return t("applicantHighlight_skillsStrong");
    case "skillsPartial":
      return t("applicantHighlight_skillsPartial");
    case "requirementsStrong":
      return t("applicantHighlight_requirementsStrong");
    case "requirementsPartial":
      return t("applicantHighlight_requirementsPartial");
    case "experienceFit":
      return t("applicantHighlight_experienceFit");
    case "locationFit":
      return t("applicantHighlight_locationFit");
    case "certificatesSignal":
      return t("applicantHighlight_certificatesSignal");
    case "certificatesStrong":
      return t("applicantHighlight_certificatesStrong");
    case "certificateGap":
      return t("applicantHighlight_certificateGap");
    case "roleAlignment":
      return t("applicantHighlight_roleAlignment");
    default:
      return "";
  }
}

export function EmployerApplicantMatchPanel({
  score,
  breakdown,
  explanation,
  variant = "full",
  seeker,
  job,
}: EmployerApplicantMatchPanelProps) {
  const t = useTranslations("jobs");
  const explainId = useId();
  const [active, setActive] = useState<Segment>("fit");

  const bd = breakdown ?? {};
  const isLegacyModel = (bd.modelVersion ?? MATCH_MODEL_VERSION) < 2;
  const scoreLabel = score == null ? "—" : `${score}%`;
  const resolvedExplanation =
    explanation ??
    buildMatchExplanation({
      breakdown,
    });

  const explain: Record<Segment, { title: string; text: string }> = {
    seeker: {
      title: t("applicantMatchExplainSeekerTitle"),
      text: t("applicantMatchExplainSeekerText", {
        name: seeker.displayName,
        title: seeker.profileTitle || "—",
        location: seeker.location || "—",
      }),
    },
    fit: {
      title: t("applicantMatchExplainFitTitle"),
      text: t("applicantMatchExplainFitText", { scoreLabel }),
    },
    employer: {
      title: t("applicantMatchExplainJobTitle"),
      text: t("applicantMatchExplainJobText", { title: job.title }),
    },
    breakdown: {
      title: t("applicantMatchExplainBreakdownTitle"),
      text: t("applicantMatchExplainBreakdownText"),
    },
  };

  const activeTopBlock =
    "border-border-strong bg-[#f8fafc] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_18px_60px_-34px_rgba(0,0,0,0.75)]";
  const inactiveTopBlock =
    "border-border bg-[#f8fafc] hover:border-border-strong hover:bg-[#f5f7fb]";

  function bar(points: number, max: number) {
    const pct = max > 0 ? Math.min(100, Math.round((points / max) * 100)) : 0;
    return { pct, points, max };
  }

  const W = bd.weights ?? MATCH_WEIGHTS;
  const skillsBar = bar(bd.skills_keywords_contribution ?? 0, W.skillsKeywords);
  const certBar = bar(bd.certificate_contribution ?? 0, W.certificates);
  const mandBar = bar(bd.requirements_mandatory_contribution ?? 0, W.requirementsMandatory);
  const recBar = bar(bd.requirements_recommended_contribution ?? 0, W.requirementsRecommended);
  const expBar = bar(bd.experience_contribution ?? 0, W.experience);
  const locBar = bar(bd.location_contribution ?? 0, W.location);
  const langBar = bar(bd.languages_contribution ?? 0, W.languages);
  const modeBar = bar(bd.work_mode_contribution ?? 0, W.workMode);
  const arrBar = bar(bd.arrangement_contribution ?? 0, W.arrangement);
  const loadBar = bar(bd.workload_contribution ?? 0, W.workload);
  const hoursBar = bar(bd.work_hours_contribution ?? 0, W.workHours);
  const availBar = bar(bd.availability_contribution ?? 0, W.availability);

  if (variant === "breakdownOnly") {
    const penaltyCodes = (bd.penalty_codes ?? []) as string[];
    const highlights = Array.isArray(bd.highlights)
      ? (bd.highlights.filter((x): x is string => typeof x === "string") as string[])
      : [];
    const bandLabel = scoreBandLabel(score, t);
    const weakFiltered = filterWeakAreasAgainstPenalties(
      Array.isArray(bd.weak_areas) ? bd.weak_areas : [],
      penaltyCodes
    );
    const highlightLines = highlights
      .map((c) => highlightLabel(c, t))
      .filter(Boolean)
      .slice(0, 5);

    return (
      <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-2">
              {t("applicantMatchScoreBreakdown")}
            </div>
            <div className="mt-2 text-sm leading-relaxed text-muted">{t("applicantMatchExplainBreakdownTextCalm")}</div>
          </div>
        </div>

        <div className="mt-5">
          <FitScoreExplain
            score={score}
            explanation={resolvedExplanation}
            label={t("applicantMatchFit")}
            defaultOpen
            showCountsWhenCollapsed
          />
          {bandLabel ? (
            <div className="mt-3 inline-block rounded-full border border-border bg-[#f8fafc] px-2.5 py-0.5 text-[10px] font-medium leading-snug text-muted">
              {bandLabel}
            </div>
          ) : null}
        </div>

        {highlightLines.length ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/22 bg-emerald-500/[0.09] px-4 py-4 sm:px-5 sm:py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
              {t("applicantMatchStrengthsHeading")}
            </div>
            <div className="mt-2 text-[12px] leading-relaxed text-emerald-800">{t("applicantMatchPositiveSignalsIntro")}</div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-emerald-50/95">
              {highlightLines.map((line, i) => (
                <li key={`${i}-${line.slice(0, 16)}`}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {Array.isArray(penaltyCodes) && penaltyCodes.length ? (
          <div className="mt-5 rounded-2xl border border-border bg-white px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-2">{t("applicantMatchReducingReasons")}</div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[12px] leading-relaxed text-muted">
              {penaltyCodes.map((c) => (
                <li key={c}>{penaltyLabel(c, t)}</li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-2">{t("applicantMatchReducingHint")}</p>
          </div>
        ) : null}

        {weakFiltered.length ? (
          <div className="mt-4 rounded-2xl border border-border bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-2">{t("applicantMatchAxisCheckpoints")}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-body">
              {weakFiltered.map((code) => (
                <li key={code}>{weakAreaLabel(code, t)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,820px)]">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[48px] bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.06),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -inset-px rounded-[34px] bg-gradient-to-br from-white via-[#f8fafc] to-transparent opacity-80"
      />

      <div className="relative overflow-hidden rounded-[32px] border border-border-strong bg-gradient-to-b from-white via-[#f5f7fb] to-white p-px shadow-[0_16px_40px_-20px_rgba(15,23,42,0.16)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(37,99,235,0.05),transparent_55%)]" />

        <div className="relative flex flex-col gap-7 p-8 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.33em] text-muted-2">
                {t("applicantMatchBadge")}
              </span>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-700">
                {t("applicantMatchSnapshot")}
              </span>
            </div>
          </div>

          {isLegacyModel ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[12px] leading-relaxed text-amber-800">
              {t("applicantMatchLegacyModel")}
            </div>
          ) : null}

          <div className="flex flex-col items-stretch gap-4 sm:grid sm:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] sm:items-center sm:gap-4 md:gap-6">
            <button
              type="button"
              aria-pressed={active === "seeker"}
              aria-controls={explainId}
              onMouseEnter={() => setActive("seeker")}
              onFocus={() => setActive("seeker")}
              onClick={() => setActive("seeker")}
              className={cn(
                "flex min-h-[104px] min-w-0 items-center rounded-2xl border px-4 py-4 text-left transition-colors sm:min-h-[110px] sm:px-4",
                active === "seeker" ? activeTopBlock : inactiveTopBlock
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="whitespace-nowrap text-[10.5px] font-medium uppercase leading-snug tracking-[0.10em] text-muted-2">
                  {t("applicantMatchCandidate")}
                </div>
                <div className="mt-0.5 text-pretty text-[13.5px] font-semibold leading-snug text-foreground sm:text-[14.5px] md:text-[16px]">
                  {seeker.profileTitle || seeker.displayName}
                </div>
                <div className="mt-1 text-pretty text-[11px] leading-snug text-muted-2">
                  {seeker.displayName}
                  {seeker.location ? ` · ${seeker.location}` : ""}
                </div>
                <div className="mt-1 text-[11px] text-muted-2">{seeker.experienceLabel}</div>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={active === "fit"}
              aria-controls={explainId}
              onMouseEnter={() => setActive("fit")}
              onFocus={() => setActive("fit")}
              onClick={() => setActive("fit")}
              className="group flex flex-col items-center gap-1 rounded-2xl px-1 text-center outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(37,99,235,0.55)] focus-visible:outline-offset-2"
            >
              <div className="relative hidden h-px w-full min-w-[2.5rem] bg-gradient-to-r from-transparent via-white/35 to-transparent sm:block" />
              <div
                className={cn(
                  "flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-2xl border bg-gradient-to-b text-center shadow-[inset_0_0_0_1px_rgba(37,99,235,0.12)]",
                  active === "fit"
                    ? "border-border-strong from-white to-[#f8fafc]"
                    : "border-border from-white to-white group-hover:border-[rgba(37,99,235,0.26)]"
                )}
              >
                <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-2">
                  {t("applicantMatchFit")}
                </div>
                <div className="mt-0.5 text-[22px] font-semibold tabular-nums tracking-tight text-foreground">
                  {scoreLabel}
                </div>
              </div>
              <div className="relative hidden h-px w-full min-w-[2.5rem] bg-gradient-to-r from-transparent via-white/35 to-transparent sm:block" />
            </button>

            <button
              type="button"
              aria-pressed={active === "employer"}
              aria-controls={explainId}
              onMouseEnter={() => setActive("employer")}
              onFocus={() => setActive("employer")}
              onClick={() => setActive("employer")}
              className={cn(
                "flex min-h-[104px] min-w-0 items-center rounded-2xl border px-4 py-4 text-left transition-colors sm:min-h-[110px] sm:px-4",
                active === "employer" ? activeTopBlock : inactiveTopBlock
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="whitespace-nowrap text-[10.5px] font-medium uppercase leading-snug tracking-[0.10em] text-muted-2">
                  {t("applicantMatchRole")}
                </div>
                <div className="mt-0.5 text-pretty text-[13.5px] font-semibold leading-snug text-foreground sm:text-[14.5px] md:text-[16px]">
                  {job.title}
                </div>
                <div className="mt-1 text-pretty text-[11px] leading-snug text-muted-2">
                  {job.location} · {job.metaLine}
                </div>
                <div className="mt-1 text-[11px] text-muted-2">{job.experienceLabel}</div>
              </div>
            </button>
          </div>

          <div
            id={explainId}
            className="rounded-2xl border border-border bg-[#f8fafc] px-4 py-4 sm:px-5"
          >
            <div className="text-[12px] font-semibold text-foreground/80">{explain[active].title}</div>
            <div className="mt-2 text-[13px] leading-relaxed text-muted">{explain[active].text}</div>
          </div>

          <button
            type="button"
            aria-pressed={active === "breakdown"}
            aria-controls={explainId}
            onMouseEnter={() => setActive("breakdown")}
            onFocus={() => setActive("breakdown")}
            onClick={() => setActive("breakdown")}
            className={cn(
              "-mx-1 rounded-2xl border px-4 py-4 text-left transition-colors sm:px-5",
              active === "breakdown" ? activeTopBlock : inactiveTopBlock
            )}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-2">
              {t("applicantMatchScoreBreakdown")}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <BreakRow label={`${t("applicantMatchAxisSkillsKeywords")} (${W.skillsKeywords})`} {...skillsBar} />
              <BreakRow label={`${t("applicantMatchAxisCertificates")} (${W.certificates})`} {...certBar} />
              <BreakRow label={`${t("applicantMatchAxisReqMandatory")} (${W.requirementsMandatory})`} {...mandBar} />
              <BreakRow label={`${t("applicantMatchAxisReqRecommended")} (${W.requirementsRecommended})`} {...recBar} />
              <BreakRow label={`${t("applicantMatchAxisExperience")} (${W.experience})`} {...expBar} />
              <BreakRow label={`${t("applicantMatchAxisLocation")} (${W.location})`} {...locBar} />
              <BreakRow label={`${t("applicantMatchAxisLanguages")} (${W.languages})`} {...langBar} />
              <BreakRow label={`${t("applicantMatchAxisWorkMode")} (${W.workMode})`} {...modeBar} />
              <BreakRow label={`${t("applicantMatchAxisArrangement")} (${W.arrangement})`} {...arrBar} />
              <BreakRow label={`${t("applicantMatchAxisWorkload")} (${W.workload})`} {...loadBar} />
              <BreakRow label={`${t("applicantMatchAxisWorkHours")} (${W.workHours})`} {...hoursBar} />
              <BreakRow label={`${t("applicantMatchAxisAvailability")} (${W.availability})`} {...availBar} />
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-[12px] text-muted">
              <div>
                {t("applicantMatchRequirementsCount", {
                  matched: bd.requirementsMatched ?? 0,
                  total: bd.requirementsTotal ?? 0,
                })}
              </div>
              {(bd.tag_total ?? 0) > 0 ? (
                <div>
                  {t("applicantMatchTagSummary", {
                    full: bd.tag_matched_full ?? 0,
                    partial: bd.tag_matched_partial ?? 0,
                    total: bd.tag_total ?? 0,
                  })}
                </div>
              ) : null}
              {(bd.certificate_slots_required ?? 0) > 0 ? (
                <div>
                  {t("applicantMatchCertSlotSummary", {
                    matched: bd.certificate_slots_matched ?? 0,
                    total: bd.certificate_slots_required ?? 0,
                  })}
                </div>
              ) : null}
            </div>
            {(bd.weak_areas?.length ?? 0) > 0 ? (
              <div className="mt-4 rounded-2xl border border-border bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-2">
                  {t("applicantMatchAxisCheckpoints")}
                </div>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-muted">
                  {(bd.weak_areas ?? []).map((code) => (
                    <li key={code}>{weakAreaLabel(code, t)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </button>

          {job.shortSummary ? (
            <div className="rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-[13px] leading-relaxed text-body">
              {job.shortSummary}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-2">
                {t("applicantMatchSeekerSkills")}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {seeker.skills.length ? (
                  seeker.skills.slice(0, 14).map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border bg-[#f8fafc] px-2.5 py-0.5 text-[11px] text-muted"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-muted-2">{t("applicantMatchNoSkills")}</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-2">
                {t("applicantMatchJobRequirements")}
              </div>
              <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-body">
                {job.requirementLines.slice(0, 8).map((line) => (
                  <li key={line} className="text-pretty [text-wrap:pretty]">
                    {line}
                  </li>
                ))}
                {!job.requirementLines.length ? (
                  <li className="list-none text-muted-2">{t("applicantMatchNoRequirementLines")}</li>
                ) : null}
              </ul>
            </div>
          </div>

          {job.requiredSkills.length ? (
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-2">
                {t("applicantMatchRequiredSkills")}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-[rgba(227,31,141,0.18)] bg-[rgba(227,31,141,0.06)] px-2.5 py-0.5 text-[11px] text-[#c21875]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {job.certRequirements ? (
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-2">
                {t("applicantMatchCertExpectations")}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-body">{job.certRequirements}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BreakRow({
  label,
  pct,
  points,
  max,
  className,
}: {
  label: string;
  pct: number;
  points: number;
  max: number;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-2 text-[11px] text-muted-2">
        <span>{label}</span>
        <span className="tabular-nums text-body">
          {points}/{max}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f8fafc]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#60a5fa]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
