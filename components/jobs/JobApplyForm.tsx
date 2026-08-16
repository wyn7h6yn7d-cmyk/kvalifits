"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";
import {
  AVAILABILITY_START_VALUES,
  INTERVIEW_PREFERENCE_VALUES,
  SALARY_BASIS_VALUES,
  SALARY_MODE_VALUES,
  SCHEDULE_FIT_VALUES,
  formatAvailabilityStartDisplay,
  formatInterviewPreferencesDisplay,
  formatSalaryExpectationScan,
  parseApplicationAnswers,
  type ApplicationAnswers,
  type AvailabilityStart,
  type InterviewPreference,
  type SalaryBasis,
  type SalaryMode,
  type ScheduleFit,
} from "@/lib/jobs/applicationAnswers";
import {
  buildQuickApplyDraft,
  formatWorkloadSummary,
  isQuickApplyReady,
  type QuickApplyProfileHints,
} from "@/lib/jobs/quickApply";
import { calculateJobMatch, type JobMatchInput } from "@/lib/matching/calculateJobMatch";
import {
  evaluateApplyEligibility,
  type ApplyEligibilityResult,
  type ApplyEligibilitySeekerInput,
} from "@/lib/jobs/evaluateApplyEligibility";
import { JobApplyEligibilityBanner } from "@/components/jobs/JobApplyEligibilityBanner";
import { FitScoreExplain } from "@/components/jobs/FitScoreExplain";
import { calculateAgeYears, isLearningObligationStatus, minorAgeBandFromAge } from "@/lib/seeker/age";
import { buildMatchReasonLines } from "@/lib/employer/matchReasonLines";
import type { MatchBreakdown } from "@/lib/matching/calculateJobMatch";

type PanelMode = "closed" | "quick" | "form";

type Props = {
  locale: string;
  jobPostId: string;
  /** Optional short schedule summary from the job post (hours / shifts). */
  scheduleHint?: string | null;
  /** Job fields for live fit preview in quick-apply summary. */
  jobMatch?: JobMatchInput | null;
  /** When false, apply UI is disabled (deadline/expiry). */
  acceptsApplications?: boolean;
  /** e.g. "Kandideeri kuni 31.08.2026" */
  applyUntilLabel?: string | null;
};

const selectClassName =
  "h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]";

export function JobApplyForm({
  locale,
  jobPostId,
  scheduleHint,
  jobMatch,
  acceptsApplications = true,
  applyUntilLabel = null,
}: Props) {
  const t = useTranslations("jobs");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelMode>("closed");

  const [profileHints, setProfileHints] = useState<QuickApplyProfileHints>({
    salaryExpectationText: null,
    preferredWeeklyHours: null,
    prefFullTime: false,
    prefPartTime: false,
    hasCv: false,
  });
  const [quickDraft, setQuickDraft] = useState<ApplicationAnswers | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchBreakdown, setMatchBreakdown] = useState<MatchBreakdown | null>(null);
  const [eligibilitySeeker, setEligibilitySeeker] = useState<ApplyEligibilitySeekerInput | null>(null);

  const [salaryMode, setSalaryMode] = useState<SalaryMode | "">("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryBasis, setSalaryBasis] = useState<SalaryBasis | "">("");
  const [availabilityStart, setAvailabilityStart] = useState<AvailabilityStart | "">("");
  const [availabilityStartDate, setAvailabilityStartDate] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [weeklyHoursDesired, setWeeklyHoursDesired] = useState("");
  const [scheduleFits, setScheduleFits] = useState<ScheduleFit | "">("");
  const [interviewPreferences, setInterviewPreferences] = useState<InterviewPreference[]>([]);
  const [preferFirstInterviewOnline, setPreferFirstInterviewOnline] = useState(false);
  const [noteForEmployer, setNoteForEmployer] = useState("");
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canQuickApply = isQuickApplyReady(quickDraft);

  const eligibility: ApplyEligibilityResult | null = useMemo(() => {
    if (!eligibilitySeeker || !jobMatch) return null;
    const liveHours = weeklyHoursDesired.trim() ? Number(weeklyHoursDesired) : null;
    const hasLiveAnswers = Boolean(
      scheduleFits || availabilityStart || (liveHours !== null && Number.isFinite(liveHours))
    );
    const answersFromForm = hasLiveAnswers
      ? {
          weeklyHoursDesired:
            liveHours !== null && Number.isFinite(liveHours)
              ? liveHours
              : (quickDraft?.weeklyHoursDesired ?? eligibilitySeeker.pref_desired_weekly_hours ?? null),
          scheduleFits: (scheduleFits || quickDraft?.scheduleFits || null) as ScheduleFit | null,
          availability_start: (availabilityStart ||
            quickDraft?.availability_start ||
            null) as AvailabilityStart | null,
        }
      : quickDraft
        ? {
            weeklyHoursDesired: quickDraft.weeklyHoursDesired,
            scheduleFits: quickDraft.scheduleFits,
            availability_start: quickDraft.availability_start,
          }
        : null;
    return evaluateApplyEligibility(eligibilitySeeker, jobMatch, { answers: answersFromForm });
  }, [
    eligibilitySeeker,
    jobMatch,
    quickDraft,
    weeklyHoursDesired,
    scheduleFits,
    availabilityStart,
  ]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;
        if (!user) {
          setAuthed(false);
          setRole(null);
          return;
        }
        setAuthed(true);
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        const roleVal = (prof?.role ?? user.user_metadata?.role ?? null) as string | null;
        setRole(roleVal);
        if (roleVal !== "seeker") return;

        const [{ data: seeker }, { data: lastApp }, { data: certs }] = await Promise.all([
          supabase
            .from("seeker_profiles")
            .select(
              "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,salary_expectation,cv_url,has_b_category_drivers_license,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,pref_full_time,pref_part_time,pref_remote_work,pref_hybrid_work,pref_on_site_work,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years,languages,date_of_birth,is_minor,minor_age_band,learning_obligation_status"
            )
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("job_applications")
            .select("application_answers,shared_profile")
            .eq("seeker_user_id", user.id)
            .neq("status", "withdrawn")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("seeker_certificates")
            .select("certificate_name,certificate_issuer,certificate_valid_until")
            .eq("user_id", user.id),
        ]);

        if (!mounted) return;

        const hoursRaw = seeker?.pref_desired_weekly_hours;
        const hoursNum =
          hoursRaw === null || hoursRaw === undefined ? null : Number(hoursRaw);
        const hints: QuickApplyProfileHints = {
          salaryExpectationText: (seeker?.salary_expectation ?? null) as string | null,
          preferredWeeklyHours: hoursNum !== null && Number.isFinite(hoursNum) ? hoursNum : null,
          prefFullTime: Boolean(seeker?.pref_full_time),
          prefPartTime: Boolean(seeker?.pref_part_time),
          hasCv: Boolean((seeker?.cv_url ?? "").toString().trim()),
        };
        setProfileHints(hints);

        const lastAnswers =
          (lastApp as { application_answers?: unknown } | null)?.application_answers ??
          (lastApp as { shared_profile?: { answers?: unknown } } | null)?.shared_profile?.answers ??
          null;

        const draft = buildQuickApplyDraft({
          lastAnswers,
          profile: hints,
          defaultNoticePeriod: t("applyNoticePeriodDefault"),
        });
        setQuickDraft(draft);

        if (seeker) {
          const dob = (seeker.date_of_birth ?? "").toString();
          const ageYears = dob ? calculateAgeYears(dob) : null;
          const learningRaw = seeker.learning_obligation_status ?? null;
          setEligibilitySeeker({
            skills: (seeker.skills as string[] | null) ?? null,
            about: seeker.about ?? null,
            profile_title: seeker.profile_title ?? null,
            languages: (seeker.languages as string[] | null) ?? null,
            has_b_category_drivers_license: Boolean(seeker.has_b_category_drivers_license),
            pref_desired_weekly_hours: hoursNum !== null && Number.isFinite(hoursNum) ? hoursNum : null,
            pref_min_weekly_hours:
              seeker.pref_min_weekly_hours === null || seeker.pref_min_weekly_hours === undefined
                ? null
                : Number(seeker.pref_min_weekly_hours),
            pref_max_weekly_hours:
              seeker.pref_max_weekly_hours === null || seeker.pref_max_weekly_hours === undefined
                ? null
                : Number(seeker.pref_max_weekly_hours),
            pref_full_time: Boolean(seeker.pref_full_time),
            pref_part_time: Boolean(seeker.pref_part_time),
            certificates: (certs ?? []).map((c) => ({
              certificate_name: (c as { certificate_name?: string | null }).certificate_name ?? null,
              certificate_issuer: (c as { certificate_issuer?: string | null }).certificate_issuer ?? null,
              certificate_valid_until:
                (c as { certificate_valid_until?: string | null }).certificate_valid_until ?? null,
            })),
            legal: {
              ageYears,
              isMinor: Boolean(seeker.is_minor) || (ageYears !== null && ageYears < 18),
              minorAgeBand:
                (seeker.minor_age_band as "under_15" | "age_15" | "age_16_17" | null) ??
                minorAgeBandFromAge(ageYears),
              learningObligationStatus: isLearningObligationStatus(learningRaw) ? learningRaw : null,
            },
          });
        }

        if (seeker && jobMatch) {
          const { score, breakdown } = calculateJobMatch(
            {
              profile_title: seeker.profile_title ?? null,
              full_name: seeker.full_name ?? null,
              location: seeker.location ?? null,
              about: seeker.about ?? null,
              skills: (seeker.skills as string[] | null) ?? null,
              experience_level: seeker.experience_level ?? null,
              preferred_job_types: (seeker.preferred_job_types as string[] | null) ?? null,
              preferred_locations: (seeker.preferred_locations as string[] | null) ?? null,
              has_b_category_drivers_license: Boolean(seeker.has_b_category_drivers_license),
              languages: (seeker.languages as string[] | null) ?? null,
              pref_desired_weekly_hours: hoursNum !== null && Number.isFinite(hoursNum) ? hoursNum : null,
              pref_min_weekly_hours:
                seeker.pref_min_weekly_hours === null || seeker.pref_min_weekly_hours === undefined
                  ? null
                  : Number(seeker.pref_min_weekly_hours),
              pref_max_weekly_hours:
                seeker.pref_max_weekly_hours === null || seeker.pref_max_weekly_hours === undefined
                  ? null
                  : Number(seeker.pref_max_weekly_hours),
              pref_full_time: Boolean(seeker.pref_full_time),
              pref_part_time: Boolean(seeker.pref_part_time),
              pref_remote_work: Boolean(seeker.pref_remote_work),
              pref_hybrid_work: Boolean(seeker.pref_hybrid_work),
              pref_on_site_work: Boolean(seeker.pref_on_site_work),
              experience_background: {
                seeking_first_job: Boolean(seeker.exp_seeking_first_job),
                is_student: Boolean(seeker.exp_is_student),
                has_internship: Boolean(seeker.exp_has_internship),
                has_volunteer: Boolean(seeker.exp_has_volunteer),
                has_project: Boolean(seeker.exp_has_project),
                has_prior_work: Boolean(seeker.exp_has_prior_work),
                experience_duration_years: seeker.experience_duration_years ?? null,
              },
            },
            (certs ?? []).map((c) => ({
              certificate_name: (c as { certificate_name?: string | null }).certificate_name ?? null,
              certificate_issuer: (c as { certificate_issuer?: string | null }).certificate_issuer ?? null,
              certificate_valid_until:
                (c as { certificate_valid_until?: string | null }).certificate_valid_until ?? null,
            })),
            jobMatch,
            draft
              ? {
                  answers: {
                    weeklyHoursDesired: draft.weeklyHoursDesired,
                    scheduleFits: draft.scheduleFits,
                    availability_start: draft.availability_start,
                    availability_start_date: draft.availability_start_date,
                  },
                }
              : null
          );
          if (mounted) {
            setMatchScore(score);
            setMatchBreakdown(breakdown);
          }
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [supabase, jobMatch, t]);

  function mapParseError(code: string): string {
    switch (code) {
      case "invalid_salary":
        return t("applyErrSalary");
      case "invalid_salary_mode":
        return t("applyErrSalaryMode");
      case "invalid_salary_range":
        return t("applyErrSalaryRange");
      case "invalid_salary_range_order":
        return t("applyErrSalaryRangeOrder");
      case "invalid_salary_basis":
        return t("applyErrSalaryBasis");
      case "missing_available_from":
      case "missing_availability_start":
        return t("applyErrAvailableFrom");
      case "invalid_availability_start_date":
        return t("applyErrAvailableFromDate");
      case "missing_notice_period":
        return t("applyErrNoticePeriod");
      case "invalid_weekly_hours":
        return t("applyErrWeeklyHours");
      case "invalid_schedule_fit":
        return t("applyErrScheduleFit");
      case "invalid_interview_preference":
        return t("applyErrInterview");
      default:
        return t("applyFailed");
    }
  }

  function prefillFromAnswers(a: ApplicationAnswers) {
    setSalaryMode(a.salaryMode);
    setSalaryBasis(a.salaryBasis);
    setSalaryMin(a.salary_expectation_min !== null ? String(a.salary_expectation_min) : "");
    setSalaryMax(a.salary_expectation_max !== null ? String(a.salary_expectation_max) : "");
    setAvailabilityStart(a.availability_start);
    setAvailabilityStartDate(a.availability_start_date ?? "");
    setNoticePeriod(a.noticePeriod);
    setWeeklyHoursDesired(String(a.weeklyHoursDesired));
    setScheduleFits(a.scheduleFits);
    setInterviewPreferences(a.interview_preferences);
    setPreferFirstInterviewOnline(a.prefer_first_interview_online);
    setNoteForEmployer(a.noteForEmployer ?? "");
  }

  function openQuickOrForm() {
    setError(null);
    setConsent(false);
    if (canQuickApply && quickDraft) {
      setPanel("quick");
      return;
    }
    if (quickDraft) prefillFromAnswers(quickDraft);
    setPanel("form");
  }

  async function submitAnswers(answers: ApplicationAnswers) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobPostId,
          locale,
          consentToShare: true,
          answers,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 409 && json.error === "duplicate_application") {
          setError(t("applyDuplicate"));
          return;
        }
        if (res.status === 410 && (json.error === "job_expired" || json.error === "job_closed_for_applications")) {
          setError(t("applyClosedBody"));
          return;
        }
        if (res.status === 400 && json.error === "seeker_profile_required") {
          setError(t("applyProfileRequired"));
          return;
        }
        if (res.status === 400 && json.error?.startsWith("answers_")) {
          setError(mapParseError(json.error.replace(/^answers_/, "")));
          return;
        }
        if (json.error === "missing_application_answers_column") {
          setError(`${t("applyFailed")}\n\n${t("applyAnswersFixHint")}`);
          return;
        }
        setError(t("applyFailed"));
        return;
      }
      setQuickDraft(answers);
      setSuccess(true);
      setPanel("closed");
    } catch {
      setError(t("applyFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function onQuickSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError(t("applyConsentRequired"));
      return;
    }
    if (!quickDraft) {
      setPanel("form");
      return;
    }
    await submitAnswers(quickDraft);
  }

  async function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError(t("applyConsentRequired"));
      return;
    }

    const parsed = parseApplicationAnswers({
      salaryMode,
      salaryBasis,
      salary_expectation_min: salaryMin,
      salary_expectation_max: salaryMax,
      availability_start: availabilityStart,
      availability_start_date: availabilityStartDate,
      noticePeriod,
      weeklyHoursDesired,
      scheduleFits,
      interview_preferences: interviewPreferences,
      prefer_first_interview_online: preferFirstInterviewOnline,
      noteForEmployer,
    });
    if (!parsed.ok) {
      setError(mapParseError(parsed.error));
      return;
    }
    await submitAnswers(parsed.value);
  }

  if (authLoading) {
    return <div className="text-sm text-white/60">{t("applyLoading")}</div>;
  }

  if (!acceptsApplications) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("applyTitle")}</div>
        <div className="mt-1 text-sm text-white/60">{t("applyClosedBody")}</div>
        {applyUntilLabel ? (
          <p className="mt-3 text-sm font-medium text-white/75">{applyUntilLabel}</p>
        ) : null}
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("applyTitle")}</div>
        <div className="mt-1 text-sm text-white/60">{t("applyLoginHint")}</div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link href="/auth/login" className="text-sm font-medium text-white/80 underline hover:text-white">
            {t("applyLogin")}
          </Link>
          <span className="hidden text-white/25 sm:inline">•</span>
          <Link href="/auth/register" className="text-sm font-medium text-white/80 underline hover:text-white">
            {t("applyRegister")}
          </Link>
        </div>
      </div>
    );
  }

  if (role !== "seeker") {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("applyTitle")}</div>
        <div className="mt-1 text-sm text-white/60">{t("applyOnlySeekers")}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("applySuccessTitle")}</div>
        <div className="mt-1 text-sm text-white/60">{t("applySuccessBody")}</div>
      </div>
    );
  }

  // One-step quick apply: summary + send (no intermediate “open” screen).
  if (canQuickApply && quickDraft && panel !== "form") {
    const salary = formatSalaryExpectationScan(quickDraft, {
      negotiable: t("applySalaryModeOption.negotiable"),
      brutoMonthly: t("applySalaryBasisOption.bruto_monthly"),
      brutoHourly: t("applySalaryBasisOption.bruto_hourly"),
    });
    const interview = formatInterviewPreferencesDisplay(
      quickDraft,
      (code) => t(`applyInterviewOption.${code}`),
      t("applyPreferFirstInterviewOnline")
    );
    const start = formatAvailabilityStartDisplay(quickDraft, (code) =>
      t(`applyAvailableFromOption.${code}`)
    );
    const workloadLine = formatWorkloadSummary(quickDraft.weeklyHoursDesired, profileHints, {
      hours: (n) => t("quickApplyHoursPerWeek", { hours: n }),
      fullTime: t("quickApplyFullTime"),
      partTime: t("quickApplyPartTime"),
    });
    const fitReasons = buildMatchReasonLines({
      breakdown: matchBreakdown,
      answers: quickDraft,
    }).map((r) => ({
      status: r.status,
      text: t(r.key as "matchReasonCertPass"),
    }));

    return (
      <div className="space-y-4">
        {eligibility ? <JobApplyEligibilityBanner result={eligibility} /> : null}
        <form
          onSubmit={onQuickSubmit}
          className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6"
        >
          <div className="text-sm font-medium text-white/85">{t("quickApplyTitle")}</div>
          <div className="mt-1 text-sm text-white/60">{t("quickApplySubtitle")}</div>

          <dl className="mt-4 space-y-3 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-4">
            <div>
              <FitScoreExplain
                score={matchScore}
                label={t("quickApplyFit")}
                whyLabel={
                  matchScore === null
                    ? t("fitWhyOpen", { score: 0 })
                    : t("fitWhyOpen", { score: matchScore })
                }
                hideLabel={t("fitWhyHide")}
                reasons={fitReasons}
              />
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {t("applySalary")}
              </dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-white/90">
                {salary.primary}{" "}
                <span className="text-sm font-normal text-white/55">{salary.basis}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {t("quickApplyStart")}
              </dt>
              <dd className="mt-1 text-sm text-white/80">{start}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {t("quickApplyWorkload")}
              </dt>
              <dd className="mt-1 text-sm text-white/80">{workloadLine}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {t("applyInterviewPreference")}
              </dt>
              <dd className="mt-1 text-sm text-white/80">
                {interview.formats}
                {interview.preferOnline ? (
                  <div className="mt-1 text-xs text-emerald-100/85">{interview.preferOnlineLabel}</div>
                ) : null}
              </dd>
            </div>
          </dl>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>{t("applyConsent")}</span>
          </label>

          {error ? (
            <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              loadingText={t("applySending")}
            >
              {t("applyCta")}
            </Button>
            <button
              type="button"
              className="text-sm text-white/55 underline-offset-4 hover:text-white/80 hover:underline"
              onClick={() => {
                prefillFromAnswers(quickDraft);
                setConsent(false);
                setError(null);
                setPanel("form");
              }}
              disabled={loading}
            >
              {t("quickApplyEditAnswers")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (panel === "closed") {
    return (
      <div className="space-y-4">
        {eligibility ? <JobApplyEligibilityBanner result={eligibility} /> : null}
        <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
          <div className="text-sm font-medium text-white/85">{t("applyTitle")}</div>
          <div className="mt-1 text-sm text-white/60">{t("applySubtitle")}</div>
          {applyUntilLabel ? (
            <p className="mt-2 text-sm font-medium text-white/80">{applyUntilLabel}</p>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-white/45">{t("quickApplyNoCvHint")}</p>
          <div className="mt-4">
            <Button type="button" variant="primary" size="lg" className="w-full" onClick={openQuickOrForm}>
              {t("applyOpenCta")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {eligibility ? <JobApplyEligibilityBanner result={eligibility} /> : null}
    <form onSubmit={onFormSubmit} className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
      <div className="text-sm font-medium text-white/85">{t("applyFormTitle")}</div>
      <div className="mt-1 text-sm text-white/60">{t("applyFormSubtitle")}</div>
      <p className="mt-2 text-xs leading-relaxed text-white/45">{t("quickApplyNoCvHint")}</p>

      <fieldset className="mt-4 space-y-3">
        <legend className="text-xs font-medium tracking-wide text-white/65">
          {t("applySalaryQuestion")}
        </legend>

        <div className="space-y-2">
          <label className="sr-only" htmlFor="apply-salary-mode">
            {t("applySalaryQuestion")}
          </label>
          <select
            id="apply-salary-mode"
            value={salaryMode}
            onChange={(e) => setSalaryMode(e.target.value as SalaryMode | "")}
            required
            className={selectClassName}
          >
            <option value="">{t("applySelectPlaceholder")}</option>
            {SALARY_MODE_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`applySalaryModeOption.${v}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="apply-salary-basis">
            {t("applySalaryBasis")}
          </label>
          <select
            id="apply-salary-basis"
            value={salaryBasis}
            onChange={(e) => setSalaryBasis(e.target.value as SalaryBasis | "")}
            required
            className={selectClassName}
          >
            <option value="">{t("applySelectPlaceholder")}</option>
            {SALARY_BASIS_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`applySalaryBasisOption.${v}`)}
              </option>
            ))}
          </select>
        </div>

        {salaryMode === "fixed" ? (
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="apply-salary-fixed">
              {t("applySalaryFixedAmount")}
            </label>
            <Input
              id="apply-salary-fixed"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              inputMode="decimal"
              required
              placeholder={t("applySalaryPlaceholder")}
            />
          </div>
        ) : null}

        {salaryMode === "range" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="apply-salary-min">
                {t("applySalaryMin")}
              </label>
              <Input
                id="apply-salary-min"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                inputMode="decimal"
                required
                placeholder={t("applySalaryPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="apply-salary-max">
                {t("applySalaryMax")}
              </label>
              <Input
                id="apply-salary-max"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                inputMode="decimal"
                required
                placeholder={t("applySalaryPlaceholder")}
              />
            </div>
          </div>
        ) : null}

        {salaryMode === "negotiable" ? (
          <p className="text-xs leading-relaxed text-white/45">{t("applySalaryNegotiableHint")}</p>
        ) : null}
      </fieldset>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="apply-start">
            {t("applyAvailableFrom")}
          </label>
          <select
            id="apply-start"
            value={availabilityStart}
            onChange={(e) => setAvailabilityStart(e.target.value as AvailabilityStart | "")}
            required
            className={selectClassName}
          >
            <option value="">{t("applySelectPlaceholder")}</option>
            {AVAILABILITY_START_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`applyAvailableFromOption.${v}`)}
              </option>
            ))}
          </select>
          {availabilityStart === "specific_date" ? (
            <Input
              id="apply-start-date"
              type="date"
              value={availabilityStartDate}
              onChange={(e) => setAvailabilityStartDate(e.target.value)}
              required
              aria-label={t("applyAvailableFromDate")}
            />
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="apply-notice">
            {t("applyNoticePeriod")}
          </label>
          <Input
            id="apply-notice"
            value={noticePeriod}
            onChange={(e) => setNoticePeriod(e.target.value)}
            required
            placeholder={t("applyNoticePeriodPlaceholder")}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="apply-hours">
          {t("applyWeeklyHours")}
        </label>
        <Input
          id="apply-hours"
          value={weeklyHoursDesired}
          onChange={(e) => setWeeklyHoursDesired(e.target.value)}
          inputMode="decimal"
          required
          placeholder={t("applyWeeklyHoursPlaceholder")}
        />
      </div>

      <div className="mt-3 space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="apply-schedule">
          {t("applyScheduleFit")}
        </label>
        {scheduleHint ? <p className="text-xs text-white/45">{scheduleHint}</p> : null}
        <select
          id="apply-schedule"
          value={scheduleFits}
          onChange={(e) => setScheduleFits(e.target.value as ScheduleFit | "")}
          required
          className={selectClassName}
        >
          <option value="">{t("applySelectPlaceholder")}</option>
          {SCHEDULE_FIT_VALUES.map((v) => (
            <option key={v} value={v}>
              {t(`applyScheduleFitOption.${v}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 space-y-3">
        <div className="text-xs font-medium tracking-wide text-white/65">{t("applyInterviewPreference")}</div>
        <p className="text-xs text-white/45">{t("applyInterviewPreferenceHint")}</p>
        <div className="flex flex-col gap-2">
          {INTERVIEW_PREFERENCE_VALUES.map((v) => {
            const checked = interviewPreferences.includes(v);
            return (
              <label
                key={v}
                className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-2.5 text-sm text-white/75"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setInterviewPreferences((prev) => {
                      if (v === "any") {
                        return prev.includes("any") ? [] : ["any"];
                      }
                      const withoutAny = prev.filter((x) => x !== "any");
                      if (withoutAny.includes(v)) {
                        return withoutAny.filter((x) => x !== v);
                      }
                      return [...withoutAny, v];
                    });
                  }}
                  className="mt-0.5"
                />
                <span>{t(`applyInterviewOption.${v}`)}</span>
              </label>
            );
          })}
        </div>
        <label className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-2.5 text-sm text-white/75">
          <input
            type="checkbox"
            checked={preferFirstInterviewOnline}
            onChange={(e) => setPreferFirstInterviewOnline(e.target.checked)}
            className="mt-0.5"
          />
          <span>{t("applyPreferFirstInterviewOnline")}</span>
        </label>
      </div>

      <div className="mt-3 space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="apply-note">
          {t("applyNoteLabel")}
        </label>
        <textarea
          id="apply-note"
          value={noteForEmployer}
          onChange={(e) => setNoteForEmployer(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          placeholder={t("applyNotePlaceholder")}
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>{t("applyConsent")}</span>
      </label>

      {error ? (
        <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => {
            setError(null);
            setConsent(false);
            setPanel(canQuickApply ? "quick" : "closed");
          }}
          disabled={loading}
        >
          {t("applyCancel")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full flex-1"
          loading={loading}
          loadingText={t("applySending")}
        >
          {t("applyCta")}
        </Button>
      </div>
    </form>
    </div>
  );
}
