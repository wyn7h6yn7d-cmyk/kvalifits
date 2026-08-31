"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetTrigger } from "@/components/ui/sheet";
import { QuickApplySheet, scrollApplyFieldIntoView } from "@/components/jobs/QuickApplySheet";
import { ApplyFormSkeleton } from "@/components/skeletons/ApplyFormSkeleton";
import { Link } from "@/i18n/routing";
import { reportException } from "@/lib/monitoring/report";
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
  buildApplyFormPrefill,
  buildQuickApplyDraft,
  formatWorkloadSummary,
  isQuickApplyReady,
  noticePeriodRelevant,
  resolvedNoticePeriod,
  type ApplyFormPrefill,
  type QuickApplyProfileHints,
} from "@/lib/jobs/quickApply";
import {
  calculateJobMatch,
  type JobMatchInput,
  type SeekerCertificateInput,
  type SeekerMatchInput,
} from "@/lib/matching/calculateJobMatch";
import { buildMatchExplanation, type MatchExplanation } from "@/lib/matching/matchExplanation";
import {
  evaluateApplyEligibility,
  type ApplyEligibilityResult,
  type ApplyEligibilitySeekerInput,
} from "@/lib/jobs/evaluateApplyEligibility";
import { computeSeekerProfileCompletenessFromProfile } from "@/lib/seeker/profileCompleteness";
import { JobApplyEligibilityBanner } from "@/components/jobs/JobApplyEligibilityBanner";
import { FitScoreExplain } from "@/components/jobs/FitScoreExplain";
import { hasCvStorageRef } from "@/lib/seeker/cvStorage";
import { calculateAgeYears, isLearningObligationStatus, minorAgeBandFromAge } from "@/lib/seeker/age";
import { cn } from "@/lib/utils";

type PanelMode = "closed" | "answers" | "review";

type Props = {
  locale: string;
  jobPostId: string;
  scheduleHint?: string | null;
  jobMatch?: JobMatchInput | null;
  jobTitle?: string | null;
  employerName?: string | null;
  acceptsApplications?: boolean;
  applyUntilLabel?: string | null;
};

function ChoiceButton({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-[10px] border px-3.5 py-2.5 text-left text-[0.9375rem] font-medium leading-snug transition-[color,background-color,border-color,box-shadow] duration-200 ease-out",
        selected
          ? "border-[rgba(37,99,235,0.34)] bg-white text-foreground shadow-[inset_0_0_0_1px_rgba(227,31,141,0.12)]"
          : "border-[rgba(37,99,235,0.16)] bg-white text-body hover:border-[rgba(37,99,235,0.28)] hover:bg-surface",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function JobApplyForm({
  locale,
  jobPostId,
  scheduleHint,
  jobMatch,
  jobTitle = null,
  employerName = null,
  acceptsApplications = true,
  applyUntilLabel = null,
}: Props) {
  const t = useTranslations("jobs");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [profileCoreComplete, setProfileCoreComplete] = useState<boolean | null>(null);
  const [panel, setPanel] = useState<PanelMode>("closed");

  const [profileHints, setProfileHints] = useState<QuickApplyProfileHints>({
    salaryExpectationText: null,
    preferredWeeklyHours: null,
    prefFullTime: false,
    prefPartTime: false,
    hasCv: false,
  });
  const [quickDraft, setQuickDraft] = useState<ApplicationAnswers | null>(null);
  const [formPrefill, setFormPrefill] = useState<ApplyFormPrefill | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchExplanation, setMatchExplanation] = useState<MatchExplanation | null>(null);
  const [eligibilitySeeker, setEligibilitySeeker] = useState<ApplyEligibilitySeekerInput | null>(null);
  const [seekerMatchInput, setSeekerMatchInput] = useState<SeekerMatchInput | null>(null);
  const [certInputs, setCertInputs] = useState<SeekerCertificateInput[]>([]);

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
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const canQuickApply = isQuickApplyReady(quickDraft);
  const showNotice = noticePeriodRelevant(availabilityStart);
  const displayTitle = (jobTitle ?? jobMatch?.title ?? "").trim();
  const displayEmployer = (employerName ?? "").trim();

  const eligibility: ApplyEligibilityResult | null = useMemo(() => {
    if (!eligibilitySeeker || !jobMatch) return null;
    const liveHours = weeklyHoursDesired.trim() ? Number(weeklyHoursDesired) : null;
    const hasLiveAnswers = Boolean(
      scheduleFits || availabilityStart || (liveHours !== null && Number.isFinite(liveHours)),
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
              "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,salary_expectation,cv_url,has_b_category_drivers_license,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,pref_full_time,pref_part_time,pref_remote_work,pref_hybrid_work,pref_on_site_work,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years,languages,date_of_birth,is_minor,minor_age_band,learning_obligation_status",
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

        setProfileCoreComplete(
          computeSeekerProfileCompletenessFromProfile({
            avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
            seeker: seeker ?? null,
          }).coreComplete,
        );

        const hoursRaw = seeker?.pref_desired_weekly_hours;
        const hoursNum = hoursRaw === null || hoursRaw === undefined ? null : Number(hoursRaw);
        const hints: QuickApplyProfileHints = {
          salaryExpectationText: (seeker?.salary_expectation ?? null) as string | null,
          preferredWeeklyHours: hoursNum !== null && Number.isFinite(hoursNum) ? hoursNum : null,
          prefFullTime: Boolean(seeker?.pref_full_time),
          prefPartTime: Boolean(seeker?.pref_part_time),
          hasCv: hasCvStorageRef(seeker?.cv_url),
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
        setFormPrefill(buildApplyFormPrefill({ lastAnswers, profile: hints }));

        const mappedCerts: SeekerCertificateInput[] = (certs ?? []).map((c) => ({
          certificate_name: (c as { certificate_name?: string | null }).certificate_name ?? null,
          certificate_issuer: (c as { certificate_issuer?: string | null }).certificate_issuer ?? null,
          certificate_valid_until:
            (c as { certificate_valid_until?: string | null }).certificate_valid_until ?? null,
        }));
        setCertInputs(mappedCerts);

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
            certificates: mappedCerts,
            legal: {
              ageYears,
              isMinor: Boolean(seeker.is_minor) || (ageYears !== null && ageYears < 18),
              minorAgeBand:
                (seeker.minor_age_band as "under_15" | "age_15" | "age_16_17" | null) ??
                minorAgeBandFromAge(ageYears),
              learningObligationStatus: isLearningObligationStatus(learningRaw) ? learningRaw : null,
            },
          });

          const seekerInput: SeekerMatchInput = {
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
          };
          setSeekerMatchInput(seekerInput);

          if (jobMatch) {
            const answers = draft
              ? {
                  weeklyHoursDesired: draft.weeklyHoursDesired,
                  scheduleFits: draft.scheduleFits,
                  availability_start: draft.availability_start,
                  availability_start_date: draft.availability_start_date,
                }
              : null;
            const { score, breakdown } = calculateJobMatch(
              seekerInput,
              mappedCerts,
              jobMatch,
              answers ? { answers } : null,
            );
            if (mounted) {
              setMatchScore(score);
              setMatchExplanation(
                buildMatchExplanation({
                  breakdown,
                  job: jobMatch,
                  seeker: seekerInput,
                  certs: mappedCerts,
                  answers,
                }),
              );
            }
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

  function applyPrefill(source: ApplyFormPrefill | ApplicationAnswers) {
    if ("salary_expectation_min" in source) {
      const a = source as ApplicationAnswers;
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
      return;
    }
    const p = source;
    setSalaryMode(p.salaryMode);
    setSalaryBasis(p.salaryBasis);
    setSalaryMin(p.salaryMin);
    setSalaryMax(p.salaryMax);
    setAvailabilityStart(p.availabilityStart);
    setAvailabilityStartDate(p.availabilityStartDate);
    setNoticePeriod(p.noticePeriod);
    setWeeklyHoursDesired(p.weeklyHoursDesired);
    setScheduleFits(p.scheduleFits);
    setInterviewPreferences(p.interviewPreferences);
    setPreferFirstInterviewOnline(p.preferFirstInterviewOnline);
    setNoteForEmployer(p.noteForEmployer);
  }

  function openApply() {
    if (success) return;
    setError(null);
    setConsent(false);
    if (canQuickApply && quickDraft) {
      applyPrefill(quickDraft);
      setPanel("review");
      return;
    }
    if (formPrefill) applyPrefill(formPrefill);
    else if (quickDraft) applyPrefill(quickDraft);
    setPanel("answers");
  }

  function closeApply() {
    setError(null);
    setConsent(false);
    setPanel("closed");
  }

  useEffect(() => {
    if (authLoading || success || !acceptsApplications) return;
    if (!authed || role !== "seeker") return;

    function openFromHashOrEvent() {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#kandideeri") openApply();
    }

    function onOpenEvent() {
      openApply();
    }

    openFromHashOrEvent();
    window.addEventListener("hashchange", openFromHashOrEvent);
    window.addEventListener("kvalifits:open-apply", onOpenEvent);
    return () => {
      window.removeEventListener("hashchange", openFromHashOrEvent);
      window.removeEventListener("kvalifits:open-apply", onOpenEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, authed, role, acceptsApplications, success]);

  function onSheetOpenChange(next: boolean) {
    if (next) openApply();
    else closeApply();
  }

  function refreshMatch(answers: ApplicationAnswers) {
    if (!seekerMatchInput || !jobMatch) return;
    const ctx = {
      weeklyHoursDesired: answers.weeklyHoursDesired,
      scheduleFits: answers.scheduleFits,
      availability_start: answers.availability_start,
      availability_start_date: answers.availability_start_date,
    };
    const { score, breakdown } = calculateJobMatch(seekerMatchInput, certInputs, jobMatch, {
      answers: ctx,
    });
    setMatchScore(score);
    setMatchExplanation(
      buildMatchExplanation({
        breakdown,
        job: jobMatch,
        seeker: seekerMatchInput,
        certs: certInputs,
        answers: ctx,
      }),
    );
  }

  function parseCurrentAnswers() {
    const notice = resolvedNoticePeriod(availabilityStart, noticePeriod, {
      none: t("applyNoticeNone"),
      agreement: t("applyNoticePeriodDefault"),
    });
    return parseApplicationAnswers({
      salaryMode,
      salaryBasis,
      salary_expectation_min: salaryMin,
      salary_expectation_max: salaryMax,
      availability_start: availabilityStart,
      availability_start_date: availabilityStartDate,
      noticePeriod: notice,
      weeklyHoursDesired,
      scheduleFits,
      interview_preferences: interviewPreferences,
      prefer_first_interview_online: preferFirstInterviewOnline,
      noteForEmployer,
    });
  }

  function goToReview(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseCurrentAnswers();
    if (!parsed.ok) {
      setError(mapParseError(parsed.error));
      return;
    }
    setQuickDraft(parsed.value);
    refreshMatch(parsed.value);
    setPanel("review");
  }

  async function submitAnswers(answers: ApplicationAnswers) {
    if (profileCoreComplete === false) {
      setError(t("applyProfileRequired"));
      return;
    }
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
      const json = (await res.json().catch(() => ({}))) as { error?: string; alreadyApplied?: boolean };
      if (!res.ok) {
        if (res.status === 409 && json.error === "duplicate_application") {
          setAlreadyApplied(true);
          setSuccess(true);
          setPanel("closed");
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
    } catch (err) {
      reportException(err, { area: "job_application", code: "apply_network_error" });
      setError(t("applyFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function onReviewSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError(t("applyConsentRequired"));
      return;
    }
    if (!quickDraft) {
      setPanel("answers");
      return;
    }
    await submitAnswers(quickDraft);
  }

  function toggleInterview(v: InterviewPreference) {
    setInterviewPreferences((prev) => {
      if (v === "any") return prev.includes("any") ? [] : ["any"];
      const withoutAny = prev.filter((x) => x !== "any");
      if (withoutAny.includes(v)) return withoutAny.filter((x) => x !== v);
      return [...withoutAny, v];
    });
  }

  const advertisedHours = jobMatch?.weekly_hours;

  if (authLoading) {
    return <ApplyFormSkeleton label={t("applyLoading")} />;
  }

  if (!acceptsApplications) {
    return (
      <div className="rounded-xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="text-base font-semibold leading-snug text-foreground">{t("applyTitle")}</div>
        <div className="mt-1 text-base leading-[1.65] text-muted">{t("applyClosedBody")}</div>
        {applyUntilLabel ? <p className="mt-3 text-base font-medium text-muted">{applyUntilLabel}</p> : null}
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="rounded-xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="text-base font-semibold leading-snug text-foreground">{t("applyTitle")}</div>
        <div className="mt-1 text-base leading-[1.65] text-muted">{t("applyLoginHint")}</div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link href="/auth/login" className="text-[0.9375rem] font-medium text-foreground underline hover:text-foreground">
            {t("applyLogin")}
          </Link>
          <span className="hidden text-muted sm:inline">•</span>
          <Link href="/auth/register" className="text-[0.9375rem] font-medium text-foreground underline hover:text-foreground">
            {t("applyRegister")}
          </Link>
        </div>
      </div>
    );
  }

  if (role !== "seeker") {
    return (
      <div className="rounded-xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="text-base font-semibold leading-snug text-foreground">{t("applyTitle")}</div>
        <div className="mt-1 text-base leading-[1.65] text-muted">{t("applyOnlySeekers")}</div>
      </div>
    );
  }

  if (profileCoreComplete === false) {
    return (
      <div className="rounded-xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="text-base font-semibold leading-snug text-foreground">{t("applyTitle")}</div>
        <div className="mt-1 text-base leading-[1.65] text-muted">{t("applyProfileRequired")}</div>
        <Link
          href="/account/seeker/profile"
          className="mt-4 inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-foreground underline hover:text-foreground"
        >
          {t("applyCompleteProfile")}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="text-base font-semibold leading-snug text-foreground">
          {alreadyApplied ? t("applyDuplicate") : t("applySuccessTitle")}
        </div>
        <div className="mt-1 text-base leading-[1.65] text-muted">
          {alreadyApplied ? t("applyDuplicateBody") : t("applySuccessBody")}
        </div>
      </div>
    );
  }

  const reviewAnswers = quickDraft;
  const salaryScan = reviewAnswers
    ? formatSalaryExpectationScan(reviewAnswers, {
        negotiable: t("applySalaryModeOption.negotiable"),
        brutoMonthly: t("applySalaryBasisChip.bruto_monthly"),
        brutoHourly: t("applySalaryBasisChip.bruto_hourly"),
      })
    : null;
  const interviewScan = reviewAnswers
    ? formatInterviewPreferencesDisplay(
        reviewAnswers,
        (code) => t(`applyInterviewOption.${code}`),
        t("applyPreferFirstInterviewOnline"),
      )
    : null;
  const startScan = reviewAnswers
    ? formatAvailabilityStartDisplay(reviewAnswers, (code) => t(`applyAvailableFromOption.${code}`))
    : null;
  const workloadScan = reviewAnswers
    ? formatWorkloadSummary(reviewAnswers.weeklyHoursDesired, profileHints, {
        hours: (n) => t("quickApplyHoursPerWeek", { hours: n }),
        fullTime: t("quickApplyFullTime"),
        partTime: t("quickApplyPartTime"),
      })
    : null;

  const sheetOpen = panel !== "closed";

  const answersBody = (
    <form onSubmit={goToReview} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4 pt-1 sm:px-5">
        {eligibility ? <JobApplyEligibilityBanner result={eligibility} /> : null}

        <p className="text-[0.9375rem] leading-[1.6] text-muted">{t("quickApplyNoCvHint")}</p>

        <fieldset className="space-y-3">
          <legend className="text-[0.9375rem] font-medium leading-snug text-foreground">
            {t("applySalaryQuestion")}
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SALARY_MODE_VALUES.map((v) => (
              <ChoiceButton key={v} selected={salaryMode === v} onClick={() => setSalaryMode(v)}>
                {t(`applySalaryModeOption.${v}`)}
              </ChoiceButton>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SALARY_BASIS_VALUES.map((v) => (
              <ChoiceButton key={v} selected={salaryBasis === v} onClick={() => setSalaryBasis(v)}>
                {t(`applySalaryBasisChip.${v}`)}
              </ChoiceButton>
            ))}
          </div>
          {salaryMode === "fixed" ? (
            <Input
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="next"
              placeholder={t("applySalaryPlaceholder")}
              aria-label={t("applySalaryFixedAmount")}
              onFocus={scrollApplyFieldIntoView}
            />
          ) : null}
          {salaryMode === "range" ? (
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="next"
                placeholder={t("applySalaryMin")}
                aria-label={t("applySalaryMin")}
                onFocus={scrollApplyFieldIntoView}
              />
              <Input
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="next"
                placeholder={t("applySalaryMax")}
                aria-label={t("applySalaryMax")}
                onFocus={scrollApplyFieldIntoView}
              />
            </div>
          ) : null}
          {salaryMode === "negotiable" ? (
            <p className="text-[0.9375rem] leading-[1.6] text-muted">{t("applySalaryNegotiableHint")}</p>
          ) : null}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-[0.9375rem] font-medium leading-snug text-foreground">
            {t("quickApplyStart")}
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AVAILABILITY_START_VALUES.map((v) => (
              <ChoiceButton
                key={v}
                selected={availabilityStart === v}
                onClick={() => setAvailabilityStart(v)}
              >
                {t(`applyAvailableFromOption.${v}`)}
              </ChoiceButton>
            ))}
          </div>
          {availabilityStart === "specific_date" ? (
            <Input
              type="date"
              value={availabilityStartDate}
              onChange={(e) => setAvailabilityStartDate(e.target.value)}
              aria-label={t("applyAvailableFromDate")}
              className="min-h-12 [color-scheme:light]"
              onFocus={scrollApplyFieldIntoView}
            />
          ) : null}
        </fieldset>

        {showNotice ? (
          <div className="space-y-2">
            <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="apply-notice">
              {t("applyNoticePeriod")}
            </label>
            <p className="text-[0.9375rem] leading-[1.6] text-muted">{t("applyNoticeHint")}</p>
            <Input
              id="apply-notice"
              value={noticePeriod}
              onChange={(e) => setNoticePeriod(e.target.value)}
              placeholder={t("applyNoticePeriodPlaceholder")}
              onFocus={scrollApplyFieldIntoView}
            />
          </div>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="text-[0.9375rem] font-medium leading-snug text-foreground">
            {t("quickApplyWorkload")}
          </legend>
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="apply-hours">
            {t("applyWeeklyHours")}
          </label>
          {advertisedHours ? (
            <p className="text-[0.9375rem] leading-[1.6] text-muted">{t("applyAdvertisedHours", { hours: advertisedHours })}</p>
          ) : null}
          <Input
            id="apply-hours"
            value={weeklyHoursDesired}
            onChange={(e) => setWeeklyHoursDesired(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="next"
            placeholder={t("applyWeeklyHoursPlaceholder")}
            onFocus={scrollApplyFieldIntoView}
          />
          <div className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("applyScheduleFit")}</div>
          {scheduleHint ? <p className="text-[0.9375rem] leading-[1.6] text-muted">{scheduleHint}</p> : null}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SCHEDULE_FIT_VALUES.map((v) => (
              <ChoiceButton key={v} selected={scheduleFits === v} onClick={() => setScheduleFits(v)}>
                {t(`applyScheduleFitOption.${v}`)}
              </ChoiceButton>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-[0.9375rem] font-medium leading-snug text-foreground">
            {t("applyInterviewPreference")}
          </legend>
          <p className="text-[0.9375rem] leading-[1.6] text-muted">{t("applyInterviewPreferenceHint")}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {INTERVIEW_PREFERENCE_VALUES.map((v) => (
              <ChoiceButton key={v} selected={interviewPreferences.includes(v)} onClick={() => toggleInterview(v)}>
                {t(`applyInterviewOption.${v}`)}
              </ChoiceButton>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="apply-note">
            {t("applyNoteLabel")}
          </label>
          <textarea
            id="apply-note"
            value={noteForEmployer}
            onChange={(e) => setNoteForEmployer(e.target.value)}
            rows={3}
            maxLength={500}
            className="min-h-[6.5rem] w-full rounded-2xl border border-border bg-white px-4 py-3 text-base leading-[1.6] text-foreground placeholder:text-muted-2 outline-none transition-colors focus:border-[rgba(37,99,235,0.35)]"
            placeholder={t("applyNotePlaceholder")}
            onFocus={scrollApplyFieldIntoView}
          />
        </div>

        {error ? (
          <div className="whitespace-pre-wrap rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-base leading-[1.65] text-muted">
            {error}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
        <Button type="submit" variant="primary" size="lg" className="h-12 w-full">
          {t("applyContinueToReview")}
        </Button>
      </div>
    </form>
  );

  const reviewBody = reviewAnswers ? (
    <form onSubmit={onReviewSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4 pt-1 sm:px-5">
        {eligibility ? <JobApplyEligibilityBanner result={eligibility} /> : null}

        <dl className="space-y-3 rounded-2xl border border-border bg-[#f8fafc] px-4 py-4">
          {displayTitle ? (
            <div>
              <dt className="text-[0.9375rem] font-medium leading-snug text-muted">{t("applyReviewJob")}</dt>
              <dd className="mt-1 text-base font-semibold leading-snug text-foreground">{displayTitle}</dd>
            </div>
          ) : null}
          {displayEmployer ? (
            <div>
              <dt className="text-[0.9375rem] font-medium leading-snug text-muted">
                {t("applyReviewEmployer")}
              </dt>
              <dd className="mt-1 text-base leading-[1.6] text-foreground">{displayEmployer}</dd>
            </div>
          ) : null}
          <div>
            <FitScoreExplain
              score={matchScore}
              explanation={matchExplanation}
              label={t("quickApplyFit")}
              showCountsWhenCollapsed
            />
          </div>
          {salaryScan ? (
            <div>
              <dt className="text-[0.9375rem] font-medium leading-snug text-muted">{t("applySalary")}</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-foreground">
                {salaryScan.primary}{" "}
                <span className="text-[0.9375rem] font-normal text-muted">{salaryScan.basis}</span>
              </dd>
            </div>
          ) : null}
          {startScan ? (
            <div>
              <dt className="text-[0.9375rem] font-medium leading-snug text-muted">{t("quickApplyStart")}</dt>
              <dd className="mt-1 text-base leading-[1.6] text-foreground">{startScan}</dd>
            </div>
          ) : null}
          {workloadScan ? (
            <div>
              <dt className="text-[0.9375rem] font-medium leading-snug text-muted">
                {t("quickApplyWorkload")}
              </dt>
              <dd className="mt-1 text-base leading-[1.6] text-foreground">
                {workloadScan}
                {reviewAnswers.scheduleFits ? (
                  <span className="mt-1 block text-[0.9375rem] leading-[1.6] text-muted">
                    {t("applyScheduleFit")}: {t(`applyScheduleFitOption.${reviewAnswers.scheduleFits}`)}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
          {interviewScan ? (
            <div>
              <dt className="text-[0.9375rem] font-medium leading-snug text-muted">
                {t("applyInterviewPreference")}
              </dt>
              <dd className="mt-1 text-base leading-[1.6] text-foreground">{interviewScan.formats}</dd>
            </div>
          ) : null}
          {reviewAnswers.noteForEmployer ? (
            <div>
              <dt className="text-[0.9375rem] font-medium leading-snug text-muted">{t("applyNoteLabel")}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-base leading-[1.6] text-muted">{reviewAnswers.noteForEmployer}</dd>
            </div>
          ) : null}
        </dl>

        <p className="text-[0.9375rem] leading-[1.6] text-muted">
          {profileHints.hasCv ? t("quickApplyCvFromProfile") : t("quickApplyNoCvRequired")}
        </p>

        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-base leading-[1.6] text-body">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-white"
          />
          <span>{t("applyConsent")}</span>
        </label>

        {error ? (
          <div className="whitespace-pre-wrap rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-base leading-[1.65] text-muted">
            {error}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 space-y-2 border-t border-border bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
        <Button type="submit" variant="primary" size="lg" className="h-12 w-full" loading={loading} loadingText={t("applySending")}>
          {t("applyCta")}
        </Button>
        <button
          type="button"
          className="w-full text-center text-[0.9375rem] text-muted underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => {
            applyPrefill(reviewAnswers);
            setConsent(false);
            setError(null);
            setPanel("answers");
          }}
          disabled={loading}
        >
          {t("quickApplyEditAnswers")}
        </button>
      </div>
    </form>
  ) : null;

  return (
    <QuickApplySheet
      open={sheetOpen}
      onOpenChange={onSheetOpenChange}
      title={panel === "review" ? t("applyReviewTitle") : t("quickApplyTitle")}
      description={panel === "review" ? t("quickApplySummarySubtitle") : t("quickApplySubtitle")}
      closeLabel={t("applySheetClose")}
      trigger={
        <div className={cn("rounded-xl border border-border bg-[#f8fafc] p-5 sm:p-6", sheetOpen && "lg:hidden")}>
          <div className="text-base font-semibold leading-snug text-foreground">{t("applyTitle")}</div>
          <div className="mt-1 text-base leading-[1.65] text-muted">{t("applySubtitle")}</div>
          <p className="mt-3 text-[0.9375rem] leading-[1.6] text-muted">{t("quickApplyNoCvHint")}</p>
          <div className="mt-4">
            <SheetTrigger asChild>
              <Button type="button" variant="primary" size="lg" className="w-full" data-testid="quick-apply-open">
                {t("applyOpenCta")}
              </Button>
            </SheetTrigger>
          </div>
        </div>
      }
    >
      {panel === "answers" ? answersBody : reviewBody}
    </QuickApplySheet>
  );
}
