"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, FileText } from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/routing";
import { parseMatchBreakdown } from "@/lib/employer/parseMatchBreakdown";
import { buildMatchReasonLines } from "@/lib/employer/matchReasonLines";
import {
  normalizeApplicationStatus,
  type ApplicationPipelineStatus,
} from "@/lib/employer/applicationPipeline";
import { EmployerApplicationStatusSelect } from "@/components/employer/EmployerApplicationStatusSelect";
import { EmployerApplicationPipeline } from "@/components/employer/EmployerApplicationPipeline";
import {
  applicationAnswersFromUnknown,
  formatAvailabilityStartDisplay,
  formatInterviewPreferencesDisplay,
  formatSalaryExpectationScan,
} from "@/lib/jobs/applicationAnswers";
import {
  parseCertificateVerificationStatus,
  resolveCertificateEffectiveStatus,
} from "@/lib/seeker/certificateVerification";

import { cn, safeHttpUrl } from "@/lib/utils";

type ApplicationRow = {
  id: string;
  created_at: string | null;
  status?: string | null;
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

function displayName(fullName: string | null | undefined) {
  const s = (fullName ?? "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const first = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1] ?? "";
  const initial = last.trim() ? `${last.trim()[0]!.toUpperCase()}.` : "";
  return initial ? `${first} ${initial}` : first;
}

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0]?.toUpperCase() ?? "") : "";
  return `${first}${last}` || "—";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function MetaCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/38">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium leading-snug text-white/85">{children}</div>
    </div>
  );
}

export function EmployerApplicantList({
  locale: _locale,
  jobPostId,
  applications,
}: {
  locale: string;
  jobPostId: string;
  applications: ApplicationRow[];
}) {
  const t = useTranslations("jobs");
  const tOnb = useTranslations("onboarding");

  const [filter, setFilter] = useState<ApplicationPipelineStatus | "all">("all");
  const [statusById, setStatusById] = useState<Record<string, ApplicationPipelineStatus>>(() => {
    const init: Record<string, ApplicationPipelineStatus> = {};
    for (const a of applications) {
      init[a.id] = normalizeApplicationStatus(a.status);
    }
    return init;
  });

  const counts = useMemo(() => {
    const c: Record<ApplicationPipelineStatus, number> = {
      new: 0,
      reviewing: 0,
      interview: 0,
      interview_2: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0,
    };
    for (const a of applications) {
      const s = statusById[a.id] ?? normalizeApplicationStatus(a.status);
      c[s] += 1;
    }
    return c;
  }, [applications, statusById]);

  const sorted = useMemo(() => {
    const list = [...applications].filter((a) => {
      const s = statusById[a.id] ?? normalizeApplicationStatus(a.status);
      if (filter === "all") return true;
      return s === filter;
    });
    list.sort((a, b) => {
      const sa = typeof a.match_score === "number" ? a.match_score : -1;
      const sb = typeof b.match_score === "number" ? b.match_score : -1;
      return sb - sa;
    });
    return list;
  }, [applications, filter, statusById]);

  if (!applications.length) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] px-6 py-10 text-center sm:px-8">
        <div className="text-sm font-medium text-white/85">{t("noApplicationsYet")}</div>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">{t("applicantsEmptySubtitle")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EmployerApplicationPipeline
        total={applications.length}
        counts={counts}
        filter={filter}
        onFilterChange={setFilter}
      />

      <p className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] leading-snug text-white/55">
        {t("applicantsSortedHint")}
      </p>

      {!sorted.length ? (
        <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] px-6 py-8 text-center text-sm text-white/55">
          {t("applicationPipelineEmptyFilter")}
        </div>
      ) : null}

      <ul className="list-none space-y-3 p-0">
        {sorted.map((a, index) => {
          const seeker = (a.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
          const jobSnap = (a.shared_profile as { job?: Record<string, unknown> } | null)?.job ?? {};
          const answers = applicationAnswersFromUnknown(
            (a.shared_profile as { answers?: unknown } | null)?.answers ?? a.application_answers ?? null
          );
          const salaryScan = answers
            ? formatSalaryExpectationScan(answers, {
                negotiable: t("applySalaryModeOption.negotiable"),
                brutoMonthly: t("applySalaryBasisOption.bruto_monthly"),
                brutoHourly: t("applySalaryBasisOption.bruto_hourly"),
              })
            : null;
          const interviewScan = answers
            ? formatInterviewPreferencesDisplay(
                answers,
                (code) => t(`applyInterviewOption.${code}`),
                t("applyPreferFirstInterviewOnline")
              )
            : null;
          const startLabel = answers
            ? formatAvailabilityStartDisplay(answers, (code) => t(`applyAvailableFromOption.${code}`))
            : null;

          const name = displayName((seeker.full_name as string | undefined) ?? null);
          const avatarUrl = ((seeker.avatar_url as string | undefined) ?? "").toString().trim();
          const profileTitle = ((seeker.profile_title as string | undefined) ?? "").trim() || "—";
          const cvUrl = a.resolved_cv_url ?? safeHttpUrl(seeker.cv_url);
          const score = typeof a.match_score === "number" ? a.match_score : null;
          const bd = parseMatchBreakdown(a.match_breakdown);
          const reqTotal = bd?.requirementsTotal ?? 0;
          const reqMatched = bd?.requirementsMatched ?? 0;

          const skills = asStringArray(seeker.skills).slice(0, 6);
          const certRows = Array.isArray(seeker.certificates) ? seeker.certificates : [];
          // Employer card: verified & still valid only — never health / work-capacity.
          const verifiedCertNames = certRows
            .map((c) => {
              const row = c as {
                certificate_name?: string | null;
                certificate_valid_until?: string | null;
                verification_status?: string | null;
              };
              const name = (row.certificate_name ?? "").toString().trim();
              if (!name) return null;
              const effective = resolveCertificateEffectiveStatus({
                verification_status: parseCertificateVerificationStatus(row.verification_status),
                certificate_valid_until: row.certificate_valid_until ?? null,
              });
              return effective === "verified" ? name : null;
            })
            .filter((n): n is string => Boolean(n));
          const languages = [
            ...asStringArray((seeker as { languages?: unknown }).languages),
            ...(a.live?.languages ?? []),
          ].filter((v, i, arr) => arr.indexOf(v) === i);

          const jobLanguageHints = [
            ...asStringArray(jobSnap.keywords),
            ...asStringArray(jobSnap.required_skills),
            ...asStringArray(jobSnap.requirement_lines),
            ...asStringArray(jobSnap.certificate_requirements),
            String(jobSnap.short_summary ?? "").trim(),
            String(jobSnap.title ?? "").trim(),
          ].filter(Boolean);

          const reasonLines = buildMatchReasonLines({
            breakdown: bd,
            answers: answers
              ? { scheduleFits: answers.scheduleFits, availability_start: answers.availability_start }
              : null,
            languages,
            jobLanguageHints,
          });

          const expLevel = ((seeker.experience_level as string | undefined) ?? "").trim();
          const snapYearsRaw = (seeker as { experience_duration_years?: unknown }).experience_duration_years;
          const snapYears =
            snapYearsRaw === null || snapYearsRaw === undefined ? null : Number(snapYearsRaw);
          const years =
            a.live?.experienceDurationYears ??
            (snapYears !== null && Number.isFinite(snapYears) ? snapYears : null);
          const firstJob =
            Boolean(a.live?.seekingFirstJob) || Boolean((seeker as { seeking_first_job?: unknown }).seeking_first_job);
          let experienceLabel = "—";
          if (firstJob) {
            experienceLabel = t("applicantCardFirstJob");
          } else if (expLevel) {
            const known = ["entry", "mid", "senior", "lead", "executive", "not_required"] as const;
            experienceLabel = (known as readonly string[]).includes(expLevel)
              ? tOnb(`experienceLevelOption.${expLevel as (typeof known)[number]}`)
              : expLevel;
            if (years !== null && Number.isFinite(years)) {
              experienceLabel = `${experienceLabel} · ${t("applicantCardExperienceYears", { years })}`;
            }
          } else if (years !== null && Number.isFinite(years)) {
            experienceLabel = t("applicantCardExperienceYears", { years });
          }

          const workload =
            answers?.weeklyHoursDesired !== undefined && answers?.weeklyHoursDesired !== null
              ? t("applicantCardHoursPerWeek", { hours: answers.weeklyHoursDesired })
              : null;

          const pipelineStatus = statusById[a.id] ?? normalizeApplicationStatus(a.status);
          const showRank = score != null && index < 5 && filter === "all";
          const isTop = index === 0 && score != null && filter === "all";
          const requirementsLabel =
            reqTotal > 0
              ? t("applicantCardRequirementsFilled", { matched: reqMatched, total: reqTotal })
              : t("applicantCardRequirementsUnknown");

          return (
            <li key={a.id}>
              <div
                className={cn(
                  "group relative flex overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] outline-none transition-[border-color,background-color] duration-200",
                  "hover:border-white/[0.16] hover:bg-white/[0.05]"
                )}
              >
                <div className="relative flex min-w-0 flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="order-1 flex w-full shrink-0 flex-col items-stretch gap-2 sm:order-2 sm:w-[15.5rem]">
                    <EmployerApplicationStatusSelect
                      applicationId={a.id}
                      status={pipelineStatus}
                      compact
                      onUpdated={(next) => setStatusById((prev) => ({ ...prev, [a.id]: next }))}
                    />
                    <ScoreBadge
                      score={score}
                      label={t("applicantsSuitabilityPercent")}
                      reasons={reasonLines.map((r) => ({
                        status: r.status,
                        text: t(r.key as "matchReasonCertPass"),
                      }))}
                    />
                  </div>

                  <Link
                    href={`/account/employer/jobs/${jobPostId}/applicants/${a.id}`}
                    className={cn(
                      "order-2 min-w-0 flex-1 space-y-3.5 outline-none sm:order-1",
                      "focus-visible:ring-2 focus-visible:ring-violet-400/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "active:scale-[0.997]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {showRank ? (
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-md border px-1.5 text-[10px] font-semibold tabular-nums text-white/55",
                            index === 0
                              ? "border-violet-400/25 bg-violet-500/10 text-violet-100/90"
                              : "border-white/[0.10] bg-white/[0.04]"
                          )}
                        >
                          {index + 1}
                        </span>
                      ) : null}

                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.03]">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white/55">
                            {initialsFromName(name)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold leading-snug tracking-tight text-white/95">
                            {name}
                          </span>
                          {isTop ? (
                            <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-200/90">
                              {t("applicantsTopMatch")}
                            </span>
                          ) : null}
                        </div>
                        <div
                          className={cn(
                            "mt-0.5 text-sm leading-snug text-white/68",
                            profileTitle === "—" && "text-white/40 italic"
                          )}
                        >
                          {profileTitle === "—" ? t("applicantsNoTitle") : profileTitle}
                        </div>
                      </div>
                    </div>

                    {/* Snapshot: essentials without opening the profile. No health / work-capacity. */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                      <MetaCell label={t("applicantCardRequirements")}>
                        <span className="tabular-nums">{requirementsLabel}</span>
                      </MetaCell>
                      <MetaCell label={t("applicantCardSalary")}>
                        {salaryScan ? (
                          <span className="tabular-nums">
                            {salaryScan.primary}
                            <span className="ml-1 text-[11px] font-normal text-white/50">{salaryScan.basis}</span>
                          </span>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </MetaCell>
                      <MetaCell label={t("applicantCardStart")}>
                        {startLabel ?? <span className="text-white/40">—</span>}
                      </MetaCell>
                      <MetaCell label={t("applicantCardWorkload")}>
                        {workload ?? <span className="text-white/40">—</span>}
                      </MetaCell>
                      <MetaCell label={t("applicantCardExperience")}>{experienceLabel}</MetaCell>
                      <MetaCell label={t("applicantCardLanguages")}>
                        {languages.length ? (
                          languages.slice(0, 4).join(" · ")
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </MetaCell>
                      <MetaCell label={t("applicantCardVerifiedCertificates")}>
                        {verifiedCertNames.length ? (
                          <span>
                            {verifiedCertNames.slice(0, 3).join(" · ")}
                            {verifiedCertNames.length > 3 ? ` +${verifiedCertNames.length - 3}` : ""}
                          </span>
                        ) : (
                          <span className="text-white/40">{t("applicantCardNoVerifiedCertificates")}</span>
                        )}
                      </MetaCell>
                      <MetaCell label={t("applicantCardInterview")}>
                        {interviewScan ? (
                          <span>
                            {interviewScan.formats}
                            {interviewScan.preferOnline ? (
                              <span className="mt-0.5 block text-[11px] font-normal text-emerald-200/80">
                                {t("applicantCardPreferOnlineShort")}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </MetaCell>
                    </div>

                    {skills.length ? (
                      <div>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/38">
                          {t("applicantCardSkills")}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {skills.map((s) => (
                            <span
                              key={s}
                              className="rounded-full border border-white/[0.10] bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/70"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-1 text-[11px] font-medium text-white/40 transition-colors group-hover:text-white/55">
                      <span>{t("applicantsViewDetail")}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </div>
                  </Link>
                </div>

                {cvUrl ? (
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-[1] flex w-[3.25rem] shrink-0 flex-col items-center justify-center gap-1 border-t border-white/[0.10] bg-white/[0.02] px-1.5 py-3 text-center transition-colors hover:bg-violet-500/10 sm:w-12 sm:border-l sm:border-t-0"
                    aria-label={t("applicantDetailViewCv")}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-violet-200/90" aria-hidden />
                    <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-violet-200/85">
                      {t("applicantDetailCv")}
                    </span>
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ScoreBadge({
  score,
  label,
  reasons,
}: {
  score: number | null;
  label: string;
  reasons: { status: "pass" | "partial" | "gap"; text: string }[];
}) {
  const has = score != null;
  return (
    <div className="relative w-full max-w-[16.5rem] shrink-0 sm:w-[15.5rem]">
      <div
        className={cn(
          "relative rounded-2xl border bg-gradient-to-b px-3.5 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]",
          has ? "border-white/[0.14] from-white/[0.10] to-black/35" : "border-white/[0.10] from-white/[0.05] to-black/40"
        )}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</span>
            <div
              className={cn(
                "mt-0.5 tabular-nums tracking-tight text-white",
                has ? "text-[1.65rem] font-semibold leading-none" : "text-lg font-medium text-white/45"
              )}
            >
              {has ? `${score}` : "—"}
              {has ? <span className="ml-0.5 text-sm font-semibold text-white/70">%</span> : null}
            </div>
          </div>
          {has ? (
            <div className="mb-1 h-0.5 w-10 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400/85 to-fuchsia-400/75"
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
          ) : null}
        </div>

        {reasons.length ? (
          <ul className="mt-3 space-y-1.5 border-t border-white/[0.08] pt-2.5">
            {reasons.map((r) => (
              <li key={`${r.status}-${r.text}`} className="flex items-start gap-1.5 text-[11px] leading-snug">
                <span
                  className={cn(
                    "mt-px shrink-0 font-semibold tabular-nums",
                    r.status === "pass" && "text-emerald-300/90",
                    r.status === "partial" && "text-amber-200/80",
                    r.status === "gap" && "text-white/35"
                  )}
                  aria-hidden
                >
                  {r.status === "pass" ? "✓" : "○"}
                </span>
                <span
                  className={cn(
                    r.status === "pass" && "text-white/78",
                    r.status === "partial" && "text-white/62",
                    r.status === "gap" && "text-white/45"
                  )}
                >
                  {r.text}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
