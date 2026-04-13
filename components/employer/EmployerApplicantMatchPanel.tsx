"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import type { MatchBreakdown } from "@/lib/matching/calculateJobMatch";
import { MATCH_MODEL_VERSION, MATCH_WEIGHTS } from "@/lib/matching/calculateJobMatch";
import { cn } from "@/lib/utils";

export type EmployerApplicantMatchPanelProps = {
  score: number | null;
  breakdown: Partial<MatchBreakdown> | null;
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
    default:
      return code;
  }
}

export function EmployerApplicantMatchPanel({
  score,
  breakdown,
  variant = "full",
  seeker,
  job,
}: EmployerApplicantMatchPanelProps) {
  const t = useTranslations("jobs");
  const explainId = useId();
  const [active, setActive] = useState<Segment>("fit");

  const bd = breakdown ?? {};
  const isLegacyModel = (bd.modelVersion ?? MATCH_MODEL_VERSION) !== MATCH_MODEL_VERSION;
  const scoreLabel = score == null ? "—" : `${score}%`;

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
    "border-white/[0.18] bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_18px_60px_-34px_rgba(0,0,0,0.75)]";
  const inactiveTopBlock =
    "border-white/[0.10] bg-white/[0.05] hover:border-white/[0.14] hover:bg-white/[0.06]";

  function bar(points: number, max: number) {
    const pct = max > 0 ? Math.min(100, Math.round((points / max) * 100)) : 0;
    return { pct, points, max };
  }

  const W = bd.weights ?? MATCH_WEIGHTS;
  const skillsBar = bar(bd.skills_keywords_contribution ?? 0, W.skillsKeywords);
  const certBar = bar(bd.certificate_contribution ?? 0, W.certificates);
  const expBar = bar(bd.experience_contribution ?? 0, W.experience);
  const roleBar = bar(bd.role_title_contribution ?? 0, W.roleTitle);
  const locBar = bar(bd.location_contribution ?? 0, W.location);
  const wjtBar = bar(bd.work_job_type_contribution ?? 0, W.workJobType);

  if (variant === "breakdownOnly") {
    const scoreLabelSimple = score == null ? "—" : `${score}%`;
    const penaltyPoints = bd.penalty_points ?? 0;
    const penaltyCodes = (bd.penalty_codes ?? []) as string[];
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              {t("applicantMatchScoreBreakdown")}
            </div>
            <div className="mt-2 text-sm leading-relaxed text-white/60">{t("applicantMatchExplainBreakdownText")}</div>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/[0.10] bg-black/25 px-4 py-3 text-right shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              {t("applicantMatchFit")}
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-white">{scoreLabelSimple}</div>
            {penaltyPoints > 0 ? (
              <div className="mt-1 text-[11px] text-amber-200/70">
                −{penaltyPoints}p
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <BreakRow label={t("applicantMatchAxisSkillsKeywords")} {...skillsBar} />
          <BreakRow label={t("applicantMatchAxisCertificates")} {...certBar} />
          <BreakRow label={t("applicantMatchAxisExperience")} {...expBar} />
          <BreakRow label={t("applicantMatchAxisRoleTitle")} {...roleBar} />
          <BreakRow label={t("applicantMatchAxisLocation")} {...locBar} />
          <BreakRow label={t("applicantMatchAxisWorkJobType")} {...wjtBar} />
        </div>

        <div className="mt-5 space-y-2 border-t border-white/[0.08] pt-4 text-[12px] text-white/60">
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

          {Array.isArray(penaltyCodes) && penaltyCodes.length ? (
            <div className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[12px] leading-relaxed text-amber-100/90">
              {t("applicantMatchPenaltyHint")}
            </div>
          ) : null}

          {Array.isArray(bd.weak_areas) && bd.weak_areas.length ? (
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                {t("applicantMatchWeakAreas")}
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-white/60">
                {bd.weak_areas.map((code) => (
                  <li key={code}>{weakAreaLabel(code, t)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,820px)]">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[48px] bg-[conic-gradient(from_140deg_at_50%_50%,rgba(168,85,247,0.45),transparent_42%,rgba(227,31,141,0.22),transparent_78%)] opacity-90 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -inset-px rounded-[34px] bg-gradient-to-br from-white/[0.18] via-white/[0.04] to-transparent opacity-80"
      />

      <div className="relative overflow-hidden rounded-[32px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] via-black/40 to-black/70 p-px shadow-[0_32px_120px_-40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(168,85,247,0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_100%,rgba(227,31,141,0.1),transparent_50%)]" />

        <div className="relative flex flex-col gap-7 p-8 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.33em] text-white/50">
                {t("applicantMatchBadge")}
              </span>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-300/90">
                {t("applicantMatchSnapshot")}
              </span>
            </div>
          </div>

          {isLegacyModel ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[12px] leading-relaxed text-amber-100/90">
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
                <div className="whitespace-nowrap text-[10.5px] font-medium uppercase leading-snug tracking-[0.10em] text-white/50">
                  {t("applicantMatchCandidate")}
                </div>
                <div className="mt-0.5 text-pretty text-[13.5px] font-semibold leading-snug text-white/92 sm:text-[14.5px] md:text-[16px]">
                  {seeker.profileTitle || seeker.displayName}
                </div>
                <div className="mt-1 text-pretty text-[11px] leading-snug text-white/55">
                  {seeker.displayName}
                  {seeker.location ? ` · ${seeker.location}` : ""}
                </div>
                <div className="mt-1 text-[11px] text-white/45">{seeker.experienceLabel}</div>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={active === "fit"}
              aria-controls={explainId}
              onMouseEnter={() => setActive("fit")}
              onFocus={() => setActive("fit")}
              onClick={() => setActive("fit")}
              className="group flex flex-col items-center gap-1 rounded-2xl px-1 text-center outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(168,85,247,0.75)] focus-visible:outline-offset-2"
            >
              <div className="relative hidden h-px w-full min-w-[2.5rem] bg-gradient-to-r from-transparent via-white/35 to-transparent sm:block" />
              <div
                className={cn(
                  "flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-2xl border bg-gradient-to-b text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]",
                  active === "fit"
                    ? "border-white/[0.22] from-white/[0.14] to-white/[0.04]"
                    : "border-white/[0.12] from-white/[0.07] to-white/[0.02] group-hover:border-white/[0.18]"
                )}
              >
                <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/45">
                  {t("applicantMatchFit")}
                </div>
                <div className="mt-0.5 text-[22px] font-semibold tabular-nums tracking-tight text-white">
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
                <div className="whitespace-nowrap text-[10.5px] font-medium uppercase leading-snug tracking-[0.10em] text-white/50">
                  {t("applicantMatchRole")}
                </div>
                <div className="mt-0.5 text-pretty text-[13.5px] font-semibold leading-snug text-white/92 sm:text-[14.5px] md:text-[16px]">
                  {job.title}
                </div>
                <div className="mt-1 text-pretty text-[11px] leading-snug text-white/55">
                  {job.location} · {job.metaLine}
                </div>
                <div className="mt-1 text-[11px] text-white/45">{job.experienceLabel}</div>
              </div>
            </button>
          </div>

          <div
            id={explainId}
            className="rounded-2xl border border-white/[0.10] bg-black/25 px-4 py-4 sm:px-5"
          >
            <div className="text-[12px] font-semibold text-white/85">{explain[active].title}</div>
            <div className="mt-2 text-[13px] leading-relaxed text-white/65">{explain[active].text}</div>
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
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
              {t("applicantMatchScoreBreakdown")}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <BreakRow label={t("applicantMatchAxisSkillsKeywords")} {...skillsBar} />
              <BreakRow label={t("applicantMatchAxisCertificates")} {...certBar} />
              <BreakRow label={t("applicantMatchAxisExperience")} {...expBar} />
              <BreakRow label={t("applicantMatchAxisRoleTitle")} {...roleBar} />
              <BreakRow label={t("applicantMatchAxisLocation")} {...locBar} />
              <BreakRow label={t("applicantMatchAxisWorkJobType")} {...wjtBar} />
            </div>
            <div className="mt-4 space-y-2 border-t border-white/[0.08] pt-4 text-[12px] text-white/60">
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
              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  {t("applicantMatchWeakAreas")}
                </div>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-white/65">
                  {(bd.weak_areas ?? []).map((code) => (
                    <li key={code}>{weakAreaLabel(code, t)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </button>

          {job.shortSummary ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-white/70">
              {job.shortSummary}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {t("applicantMatchSeekerSkills")}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {seeker.skills.length ? (
                  seeker.skills.slice(0, 14).map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-white/75"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-white/45">{t("applicantMatchNoSkills")}</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {t("applicantMatchJobRequirements")}
              </div>
              <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-white/70">
                {job.requirementLines.slice(0, 8).map((line) => (
                  <li key={line} className="text-pretty [text-wrap:pretty]">
                    {line}
                  </li>
                ))}
                {!job.requirementLines.length ? (
                  <li className="list-none text-white/45">{t("applicantMatchNoRequirementLines")}</li>
                ) : null}
              </ul>
            </div>
          </div>

          {job.requiredSkills.length ? (
            <div className="rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {t("applicantMatchRequiredSkills")}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2.5 py-0.5 text-[11px] text-fuchsia-100/90"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {job.certRequirements ? (
            <div className="rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {t("applicantMatchCertExpectations")}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">{job.certRequirements}</p>
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
      <div className="flex items-baseline justify-between gap-2 text-[11px] text-white/55">
        <span>{label}</span>
        <span className="tabular-nums text-white/70">
          {points}/{max}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-400/80 to-violet-400/80"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
