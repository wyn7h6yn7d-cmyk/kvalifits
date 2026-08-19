/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { authGateJson, requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { clientIpFromHeaders, consumeApiRateLimit, rateLimitResponse } from "@/lib/auth/apiRateLimit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmailViaResend } from "@/lib/email/resend";
import {
  deliverEmployerApplicationEmail,
  jsonForApplicationSubmit,
  resultFromApplicationInsert,
  safeEmployerNotifyFailLog,
} from "@/lib/jobs/applicationSubmitOutcome";
import { calculateJobMatch } from "@/lib/matching/calculateJobMatch";
import { seekerCoreComplete } from "@/lib/seeker/profileCompleteness";
import { isSeekerAvatarFromStorageUpload } from "@/lib/seeker/seekerAvatarUpload";
import { persistCvStorageRef } from "@/lib/seeker/cvStorage";
import { SITE_ORIGIN } from "@/lib/seo/site";
import {
  calculateAgeYears,
  isLegalRepresentativeConsentStatus,
  requiresLegalRepresentativeConsentNotice,
} from "@/lib/seeker/age";
import { buildSharedWorkplaceNeeds, type WorkplaceNeedsRow } from "@/lib/seeker/workplaceNeeds";
import {
  formatAvailabilityStartDisplay,
  formatInterviewPreferencesDisplay,
  formatSalaryExpectationPlain,
  parseApplicationAnswers,
  type ApplicationAnswers,
  type ApplicationAnswersInput,
  type AvailabilityStart,
  type InterviewPreference,
  type ScheduleFit,
} from "@/lib/jobs/applicationAnswers";
import { getTranslations } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";
import { isListingExpired, jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import { reportException, reportMessage } from "@/lib/monitoring/report";
import {
  coerceEducationRows,
  educationSnapshotForShare,
  isEducationTableMissing,
} from "@/lib/seeker/education";

type Body = {
  jobPostId?: string;
  /** UI locale for employer notification email (defaults to et). */
  locale?: string;
  /** @deprecated Prefer structured `answers`. Kept for older clients as optional note fallback. */
  coverLetter?: string;
  consentToShare?: boolean;
  answers?: ApplicationAnswers | ApplicationAnswersInput;
};

export async function POST(req: Request) {
  try {
    const gate = await requireAuthenticatedUser();
    if (!gate.ok) return authGateJson(gate, { unauthenticatedError: "not_authed" });
    const { user } = gate;

    const ip = clientIpFromHeaders(req.headers);
    const rate = await consumeApiRateLimit({
      action: "job_application",
      ip,
      userId: user.id,
    });
    if (!rate.ok) return rateLimitResponse(rate.retryAfterSeconds);

    const body = (await req.json()) as Body;
    const jobPostId = (body.jobPostId ?? "").toString().trim();
    const consentToShare = Boolean(body.consentToShare);

    if (!jobPostId) return NextResponse.json({ error: "missing_job_post_id" }, { status: 400 });
    if (!consentToShare) return NextResponse.json({ error: "missing_consent" }, { status: 400 });

    const rawAnswers = body.answers;
    const answersInput: ApplicationAnswersInput =
      rawAnswers && typeof rawAnswers === "object"
        ? {
            salaryMode: String((rawAnswers as ApplicationAnswersInput).salaryMode ?? ""),
            salaryBasis: String((rawAnswers as ApplicationAnswersInput).salaryBasis ?? ""),
            salary_expectation_min: String(
              (rawAnswers as ApplicationAnswersInput).salary_expectation_min ??
                (rawAnswers as ApplicationAnswersInput).salaryAmount ??
                ""
            ),
            salary_expectation_max: String(
              (rawAnswers as ApplicationAnswersInput).salary_expectation_max ?? ""
            ),
            salaryAmount: String((rawAnswers as ApplicationAnswersInput).salaryAmount ?? ""),
            availability_start: String((rawAnswers as ApplicationAnswersInput).availability_start ?? ""),
            availability_start_date: String(
              (rawAnswers as ApplicationAnswersInput).availability_start_date ?? ""
            ),
            availableFrom: String((rawAnswers as ApplicationAnswersInput).availableFrom ?? ""),
            noticePeriod: String((rawAnswers as ApplicationAnswersInput).noticePeriod ?? ""),
            weeklyHoursDesired: String((rawAnswers as ApplicationAnswersInput).weeklyHoursDesired ?? ""),
            scheduleFits: String((rawAnswers as ApplicationAnswersInput).scheduleFits ?? ""),
            interview_preferences: Array.isArray(
              (rawAnswers as ApplicationAnswersInput).interview_preferences
            )
              ? ((rawAnswers as ApplicationAnswersInput).interview_preferences as string[])
              : String((rawAnswers as ApplicationAnswersInput).interview_preferences ?? ""),
            interviewPreference: String((rawAnswers as ApplicationAnswersInput).interviewPreference ?? ""),
            prefer_first_interview_online: (rawAnswers as ApplicationAnswersInput)
              .prefer_first_interview_online,
            noteForEmployer: String(
              (rawAnswers as ApplicationAnswersInput).noteForEmployer ?? body.coverLetter ?? ""
            ),
          }
        : {
            salaryMode: "",
            salaryBasis: "",
            salary_expectation_min: "",
            salary_expectation_max: "",
            availability_start: "",
            availability_start_date: "",
            noticePeriod: "",
            weeklyHoursDesired: "",
            scheduleFits: "",
            interview_preferences: [],
            prefer_first_interview_online: false,
            noteForEmployer: String(body.coverLetter ?? ""),
          };
    const answersParsed = parseApplicationAnswers(answersInput);
    if (!answersParsed.ok) {
      return NextResponse.json({ error: `answers_${answersParsed.error}` }, { status: 400 });
    }
    const answers = answersParsed.value;

    const admin = createSupabaseAdminClient();
    if (!admin) {
      reportMessage("missing_service_role_key", {
        area: "job_application",
        code: "missing_service_role_key",
      });
      return NextResponse.json({ error: "missing_service_role_key" }, { status: 500 });
    }

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role,email")
      .eq("id", user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile || profile.role !== "seeker") return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const { data: seeker, error: seekerErr } = await admin
      .from("seeker_profiles")
      .select(
        "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,cv_url,has_b_category_drivers_license,date_of_birth,learning_obligation_status,is_minor,legal_representative_consent_status,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years,languages,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,pref_full_time,pref_part_time,pref_remote_work,pref_hybrid_work,pref_on_site_work"
      )
      .eq("user_id", user.id)
      .maybeSingle();
    if (seekerErr) throw seekerErr;
    if (!seeker) {
      return NextResponse.json({ error: "seeker_profile_required" }, { status: 400 });
    }

    let { data: certs, error: certErr } = await admin
      .from("seeker_certificates")
      .select(
        "certificate_name,certificate_issuer,certificate_valid_until,verification_status,verified_at,verification_source,verified_by"
      )
      .eq("user_id", user.id);
    if (certErr && /verification_|column/i.test(certErr.message ?? "")) {
      const fallback = await admin
        .from("seeker_certificates")
        .select("certificate_name,certificate_issuer,certificate_valid_until")
        .eq("user_id", user.id);
      certs = fallback.data as typeof certs;
      certErr = fallback.error;
    }
    if (certErr) throw certErr;

    const eduQuery = await admin
      .from("seeker_education")
      .select(
        "id,seeker_user_id,institution,field_of_study,degree_or_level,start_year,end_year,currently_studying,description,created_at,updated_at",
      )
      .eq("seeker_user_id", user.id);
    if (eduQuery.error && !isEducationTableMissing(eduQuery.error.message)) {
      throw eduQuery.error;
    }
    const educationRows = eduQuery.error ? [] : coerceEducationRows(eduQuery.data);

    const { data: workplaceNeedsRow } = await admin
      .from("seeker_workplace_needs")
      .select(
        "accessible_workplace,flexible_hours,extra_breaks,adapted_tools,adapted_arrangement,remote_option,other_need,other_note,shared_with_employer,share_practical_needs_with_employer"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    // Intentionally do NOT load seeker_work_capacity into the application snapshot.
    // Work-capacity status stays private (owner-only RLS) and is never sent to employers.

    const avatarOk = isSeekerAvatarFromStorageUpload(user.user_metadata?.avatar_url as string | undefined);
    const profileReady = seekerCoreComplete({
      avatarOk,
      seeker,
    });
    if (!profileReady) {
      return NextResponse.json({ error: "seeker_profile_required" }, { status: 400 });
    }

    let job: any = null;
    {
      const full = await admin
        .from("job_posts")
        .select(
          "id,title,location,work_type,job_type,employer_profile_id,status,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,weekly_hours,daily_hours,application_deadline,expires_at,published_at"
        )
        .eq("id", jobPostId)
        .maybeSingle();

      if (full.error && /application_deadline|expires_at|published_at|column/i.test(full.error.message ?? "")) {
        const legacy = await admin
          .from("job_posts")
          .select(
            "id,title,location,work_type,job_type,employer_profile_id,status,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,weekly_hours,daily_hours"
          )
          .eq("id", jobPostId)
          .maybeSingle();
        if (legacy.error) throw legacy.error;
        job = legacy.data;
      } else if (full.error) {
        throw full.error;
      } else {
        job = full.data;
      }
    }

    if (!job || job.status !== "published") {
      return NextResponse.json({ error: "job_not_found" }, { status: 404 });
    }

    const lifecycle = {
      status: job.status,
      published_at: job.published_at ?? null,
      application_deadline: job.application_deadline ?? null,
      expires_at: job.expires_at ?? null,
    };
    if (isListingExpired(lifecycle)) {
      return NextResponse.json({ error: "job_expired" }, { status: 410 });
    }
    if (!jobAcceptsApplications(lifecycle)) {
      return NextResponse.json({ error: "job_closed_for_applications" }, { status: 410 });
    }

    const { data: employer, error: empErr } = await admin
      .from("employer_profiles")
      .select("company_name,contact_email")
      .eq("id", job.employer_profile_id)
      .maybeSingle();
    if (empErr) throw empErr;
    const toEmail = (employer?.contact_email ?? "").toString().trim();
    if (!toEmail) return NextResponse.json({ error: "missing_employer_email" }, { status: 400 });

    // Match score is ranking/recommendation only — never gates apply or auto-rejects.
    // Legal work-condition eligibility is separate (client banner / employment-rules).
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
        languages: ((seeker as { languages?: string[] | null }).languages ?? null) as string[] | null,
        pref_desired_weekly_hours:
          (seeker as { pref_desired_weekly_hours?: number | null }).pref_desired_weekly_hours ?? null,
        pref_min_weekly_hours: (seeker as { pref_min_weekly_hours?: number | null }).pref_min_weekly_hours ?? null,
        pref_max_weekly_hours: (seeker as { pref_max_weekly_hours?: number | null }).pref_max_weekly_hours ?? null,
        pref_full_time: Boolean((seeker as { pref_full_time?: boolean | null }).pref_full_time),
        pref_part_time: Boolean((seeker as { pref_part_time?: boolean | null }).pref_part_time),
        pref_remote_work: Boolean((seeker as { pref_remote_work?: boolean | null }).pref_remote_work),
        pref_hybrid_work: Boolean((seeker as { pref_hybrid_work?: boolean | null }).pref_hybrid_work),
        pref_on_site_work: Boolean((seeker as { pref_on_site_work?: boolean | null }).pref_on_site_work),
        experience_background: {
          seeking_first_job: Boolean((seeker as { exp_seeking_first_job?: boolean }).exp_seeking_first_job),
          is_student: Boolean((seeker as { exp_is_student?: boolean }).exp_is_student),
          has_internship: Boolean((seeker as { exp_has_internship?: boolean }).exp_has_internship),
          has_volunteer: Boolean((seeker as { exp_has_volunteer?: boolean }).exp_has_volunteer),
          has_project: Boolean((seeker as { exp_has_project?: boolean }).exp_has_project),
          has_prior_work: Boolean((seeker as { exp_has_prior_work?: boolean }).exp_has_prior_work),
          experience_duration_years:
            (seeker as { experience_duration_years?: number | null }).experience_duration_years ?? null,
        },
      },
      (certs ?? []).map((c) => ({
        certificate_name: (c as { certificate_name?: string | null }).certificate_name ?? null,
        certificate_issuer: (c as { certificate_issuer?: string | null }).certificate_issuer ?? null,
        certificate_valid_until:
          (c as { certificate_valid_until?: string | null }).certificate_valid_until ?? null,
      })),
      {
        title: job.title ?? null,
        location: job.location ?? null,
        work_type: job.work_type ?? null,
        job_type: job.job_type ?? null,
        short_summary: job.short_summary ?? null,
        description: job.description ?? null,
        requirements: job.requirements ?? null,
        requirement_lines: (job.requirement_lines as string[] | null) ?? null,
        job_requirements: job.job_requirements ?? null,
        required_skills: (job.required_skills as string[] | null) ?? null,
        keywords: (job.keywords as string[] | null) ?? null,
        experience_level_required: job.experience_level_required ?? null,
        certificate_requirements: job.certificate_requirements ?? null,
        weekly_hours: (job as { weekly_hours?: number | null }).weekly_hours ?? null,
        daily_hours: (job as { daily_hours?: number | null }).daily_hours ?? null,
      },
      {
        answers: {
          weeklyHoursDesired: answers.weeklyHoursDesired,
          scheduleFits: answers.scheduleFits,
          availability_start: answers.availability_start,
          availability_start_date: answers.availability_start_date,
        },
      }
    );

    const shared = {
      seeker: {
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        email: (profile?.email ?? user.email ?? "").toString(),
        full_name: seeker.full_name ?? null,
        profile_title: seeker.profile_title ?? null,
        phone: seeker.phone ?? null,
        location: seeker.location ?? null,
        about: seeker.about ?? null,
        skills: seeker.skills ?? null,
        experience_level: seeker.experience_level ?? null,
        preferred_job_types: seeker.preferred_job_types ?? null,
        preferred_locations: seeker.preferred_locations ?? null,
        cv_url: persistCvStorageRef(seeker.cv_url) ?? null,
        // Employer-safe flag only — no DOB, consent status detail, or guardian PII.
        requires_legal_representative_consent: requiresLegalRepresentativeConsentNotice({
          isMinor:
            Boolean((seeker as { is_minor?: boolean | null }).is_minor) ||
            (() => {
              const dob = (seeker.date_of_birth ?? "").toString();
              const age = dob ? calculateAgeYears(dob) : null;
              return age !== null && age < 18;
            })(),
          consentStatus: isLegalRepresentativeConsentStatus(
            (seeker as { legal_representative_consent_status?: unknown }).legal_representative_consent_status
          )
            ? (seeker as { legal_representative_consent_status: "required" | "pending" | "confirmed" })
                .legal_representative_consent_status
            : "required",
        }),
        // Only needs the seeker opted to share — never full private row / medical data.
        workplace_needs: buildSharedWorkplaceNeeds((workplaceNeedsRow as WorkplaceNeedsRow | null) ?? null),
        languages: ((seeker as { languages?: string[] | null }).languages ?? null) as string[] | null,
        experience_duration_years:
          (seeker as { experience_duration_years?: number | null }).experience_duration_years ?? null,
        seeking_first_job: Boolean((seeker as { exp_seeking_first_job?: boolean }).exp_seeking_first_job),
        certificates: (certs ?? []).map((c) => ({
          certificate_name: (c as { certificate_name?: string | null }).certificate_name ?? null,
          certificate_issuer: (c as { certificate_issuer?: string | null }).certificate_issuer ?? null,
          certificate_valid_until:
            (c as { certificate_valid_until?: string | null }).certificate_valid_until ?? null,
          verification_status: (c as { verification_status?: string | null }).verification_status ?? "submitted",
          verified_at: (c as { verified_at?: string | null }).verified_at ?? null,
          verification_source: (c as { verification_source?: string | null }).verification_source ?? null,
          verified_by: (c as { verified_by?: string | null }).verified_by ?? null,
        })),
        education: educationSnapshotForShare(educationRows),
      },
      job: {
        id: job.id,
        title: job.title,
        location: job.location,
        work_type: job.work_type,
        job_type: job.job_type,
        short_summary: job.short_summary,
        requirement_lines: job.requirement_lines,
        job_requirements: job.job_requirements ?? null,
        required_skills: job.required_skills,
        keywords: job.keywords,
        experience_level_required: job.experience_level_required,
        certificate_requirements: job.certificate_requirements,
      },
      employer: {
        company_name: employer?.company_name ?? null,
      },
      answers,
    };

    // Match/snapshot/consent are server-controlled. Authenticated PostgREST INSERT is revoked.
    const { data: inserted, error: insErr } = await admin
      .from("job_applications")
      .insert({
        job_post_id: job.id,
        seeker_user_id: user.id,
        cover_letter: answers.noteForEmployer,
        application_answers: answers,
        consent_to_share: true,
        shared_profile: shared,
        match_score: score,
        match_breakdown: breakdown,
        status: "new",
      })
      .select("id,created_at,match_score,employer_notified_at")
      .single();

    let submit = resultFromApplicationInsert({ error: insErr, row: inserted });
    if (
      submit.kind === "insert_failed" &&
      insErr &&
      /employer_notified_at/i.test(insErr.message ?? "")
    ) {
      const retry = await admin
        .from("job_applications")
        .insert({
          job_post_id: job.id,
          seeker_user_id: user.id,
          cover_letter: answers.noteForEmployer,
          application_answers: answers,
          consent_to_share: true,
          shared_profile: shared,
          match_score: score,
          match_breakdown: breakdown,
          status: "new",
        })
        .select("id,created_at,match_score")
        .single();
      submit = resultFromApplicationInsert({ error: retry.error, row: retry.data });
    }

    if (submit.kind === "insert_failed") {
      reportMessage("job_application_insert_failed", {
        area: "job_application",
        code: submit.error,
      });
      const json = jsonForApplicationSubmit(submit);
      return NextResponse.json(json.body, { status: json.status });
    }

    let applicationId = submit.kind === "created" ? submit.id : submit.id;
    let notifiedAt: string | null = inserted?.employer_notified_at ?? null;
    let createdAt = submit.kind === "created" ? submit.createdAt : "";
    let matchScore = submit.kind === "created" ? submit.matchScore : score;

    if (submit.kind === "already_applied") {
      const existing = await loadExistingActiveApplication(admin, job.id, user.id);
      applicationId = existing?.id ?? null;
      notifiedAt = existing?.employer_notified_at ?? null;
      createdAt = existing?.created_at ?? "";
      matchScore = existing?.match_score ?? score;
      submit = { kind: "already_applied", id: applicationId };
    }

    if (applicationId) {
      await notifyEmployerBestEffort({
        admin,
        applicationId,
        notifiedAt,
        locale: (body.locale ?? "").toString().trim(),
        job,
        employer,
        seeker,
        profile,
        userEmail: user.email,
        answers,
        score,
        toEmail,
      });
    }

    const json = jsonForApplicationSubmit(
      submit.kind === "created"
        ? { kind: "created", id: applicationId as string, createdAt, matchScore }
        : { kind: "already_applied", id: applicationId },
    );
    return NextResponse.json(json.body, { status: json.status });
  } catch (err) {
    reportException(err, { area: "job_application", code: "server_error" });
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

async function loadExistingActiveApplication(
  admin: AdminClient,
  jobPostId: string,
  seekerUserId: string,
): Promise<{
  id: string;
  created_at: string;
  match_score: number | null;
  employer_notified_at: string | null;
} | null> {
  const full = await admin
    .from("job_applications")
    .select("id,created_at,match_score,employer_notified_at")
    .eq("job_post_id", jobPostId)
    .eq("seeker_user_id", seekerUserId)
    .neq("status", "withdrawn")
    .maybeSingle();
  if (!full.error && full.data?.id) {
    return {
      id: full.data.id,
      created_at: full.data.created_at,
      match_score: full.data.match_score ?? null,
      employer_notified_at: full.data.employer_notified_at ?? null,
    };
  }
  const legacy = await admin
    .from("job_applications")
    .select("id,created_at,match_score")
    .eq("job_post_id", jobPostId)
    .eq("seeker_user_id", seekerUserId)
    .neq("status", "withdrawn")
    .maybeSingle();
  if (!legacy.data?.id) return null;
  return {
    id: legacy.data.id,
    created_at: legacy.data.created_at,
    match_score: legacy.data.match_score ?? null,
    employer_notified_at: null,
  };
}

async function notifyEmployerBestEffort(args: {
  admin: AdminClient;
  applicationId: string;
  notifiedAt: string | null;
  locale: string;
  job: { id: string; title?: string | null; location?: string | null };
  employer: { company_name?: string | null } | null;
  seeker: { full_name?: string | null; phone?: string | null; location?: string | null; cv_url?: string | null };
  profile: { email?: string | null } | null;
  userEmail: string | null | undefined;
  answers: ApplicationAnswers;
  score: number;
  toEmail: string;
}): Promise<void> {
  try {
    const delivery = await deliverEmployerApplicationEmail({
      applicationId: args.applicationId,
      notifiedAt: args.notifiedAt,
      send: async (idempotencyKey) => {
        const locale: AppLocale = routing.locales.includes(args.locale as AppLocale)
          ? (args.locale as AppLocale)
          : routing.defaultLocale;
        const t = await getTranslations({ locale, namespace: "jobs" });
        const from = process.env.EMAIL_FROM || "no-reply@kvalifits.ee";
        const html = buildEmployerApplicationHtml({
          t,
          locale,
          job: args.job,
          employer: args.employer,
          seeker: args.seeker,
          profile: args.profile,
          userEmail: args.userEmail,
          answers: args.answers,
          score: args.score,
          applicationId: args.applicationId,
        });
        return sendEmailViaResend({
          from,
          to: args.toEmail,
          subject: t("applicationEmailSubject", { title: args.job.title ?? "—" }),
          html,
          idempotencyKey,
        });
      },
      markNotified: async (applicationId) => {
        const stamped = new Date().toISOString();
        await args.admin
          .from("job_applications")
          .update({ employer_notified_at: stamped })
          .eq("id", applicationId);
      },
    });
    if (delivery === "failed") {
      const payload = safeEmployerNotifyFailLog(args.applicationId);
      console.error(JSON.stringify(payload));
      reportMessage("employer_application_notify_failed", {
        area: "email",
        code: "employer_notify_failed",
        extras: { applicationId: payload.applicationId },
      });
    }
  } catch (err) {
    const payload = safeEmployerNotifyFailLog(args.applicationId);
    console.error(JSON.stringify(payload));
    reportException(err, {
      area: "email",
      code: "employer_notify_failed",
      extras: { applicationId: payload.applicationId },
    });
  }
}

function buildEmployerApplicationHtml(args: {
  t: Awaited<ReturnType<typeof getTranslations>>;
  locale: AppLocale;
  job: { id: string; title?: string | null; location?: string | null };
  employer: { company_name?: string | null } | null;
  seeker: { full_name?: string | null; phone?: string | null; location?: string | null; cv_url?: string | null };
  profile: { email?: string | null } | null;
  userEmail: string | null | undefined;
  answers: ApplicationAnswers;
  score: number;
  applicationId: string;
}): string {
  const { t, locale, job, answers } = args;
  const companyName = (args.employer?.company_name ?? "—").toString();
  const seekerName = (args.seeker.full_name ?? "—").toString();
  const seekerEmail = (args.profile?.email ?? args.userEmail ?? "—").toString();
  const seekerPhone = (args.seeker.phone ?? "—").toString();
  const seekerLocation = (args.seeker.location ?? "—").toString();
  const seekerCv = persistCvStorageRef(args.seeker.cv_url);
  const applicantInboxUrl = `${SITE_ORIGIN}/${locale}/account/employer/jobs/${job.id}/applicants/${args.applicationId}`;
  const salaryPlain = formatSalaryExpectationPlain(answers, {
    negotiable: t("applySalaryModeOption.negotiable"),
    brutoMonthly: t("applySalaryBasisOption.bruto_monthly"),
    brutoHourly: t("applySalaryBasisOption.bruto_hourly"),
  });
  const startPlain = formatAvailabilityStartDisplay(answers, (code: AvailabilityStart) =>
    t(`applyAvailableFromOption.${code}`),
  );
  const schedulePlain = t(`applyScheduleFitOption.${answers.scheduleFits as ScheduleFit}`);
  const interviewPlain = (() => {
    const iv = formatInterviewPreferencesDisplay(
      answers,
      (code: InterviewPreference) => t(`applyInterviewOption.${code}`),
      t("applyPreferFirstInterviewOnline"),
    );
    return iv.preferOnline ? `${iv.formats} · ${iv.preferOnlineLabel}` : iv.formats;
  })();

  return `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #111;">
        <h2 style="margin: 0 0 12px 0;">${escapeHtml(t("applicationEmailHeading"))}</h2>
        <p style="margin: 0 0 10px 0;"><strong>${escapeHtml(t("applicationEmailCompany"))}:</strong> ${escapeHtml(companyName)}</p>
        <p style="margin: 0 0 10px 0;"><strong>${escapeHtml(t("applicationEmailJob"))}:</strong> ${escapeHtml(job.title ?? "—")} (${escapeHtml(job.location ?? "—")})</p>
        <p style="margin: 0 0 10px 0;"><strong>${escapeHtml(t("applicationEmailMatchScore"))}:</strong> ${args.score}%</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 14px 0;" />
        <p style="margin: 0 0 10px 0;"><strong>${escapeHtml(t("applicationEmailCandidate"))}:</strong> ${escapeHtml(seekerName)}</p>
        <p style="margin: 0 0 10px 0;"><strong>${escapeHtml(t("applicationEmailEmail"))}:</strong> ${escapeHtml(seekerEmail)}</p>
        <p style="margin: 0 0 10px 0;"><strong>${escapeHtml(t("applicationEmailPhone"))}:</strong> ${escapeHtml(seekerPhone)}</p>
        <p style="margin: 0 0 10px 0;"><strong>${escapeHtml(t("applicationEmailLocation"))}:</strong> ${escapeHtml(seekerLocation)}</p>
        ${
          seekerCv
            ? `<p style="margin: 0 0 10px 0;"><strong>${escapeHtml(t("applicationEmailCv"))}:</strong> <a href="${escapeAttr(
                applicantInboxUrl,
              )}">${escapeHtml(t("applicationEmailCvInbox"))}</a></p>`
            : ""
        }
        ${
          answers
            ? `<p style="margin: 14px 0 6px 0;"><strong>${escapeHtml(t("applicationEmailAnswers"))}:</strong></p>
        <ul style="margin: 0 0 10px 0; padding-left: 18px;">
          <li><strong>${escapeHtml(t("applicationEmailSalary"))}:</strong> ${escapeHtml(salaryPlain)}</li>
          <li><strong>${escapeHtml(t("applicationEmailStart"))}:</strong> ${escapeHtml(startPlain)}</li>
          <li><strong>${escapeHtml(t("applicationEmailNotice"))}:</strong> ${escapeHtml(answers.noticePeriod)}</li>
          <li><strong>${escapeHtml(t("applicationEmailWeeklyHours"))}:</strong> ${escapeHtml(String(answers.weeklyHoursDesired))}</li>
          <li><strong>${escapeHtml(t("applicationEmailSchedule"))}:</strong> ${escapeHtml(schedulePlain)}</li>
          <li><strong>${escapeHtml(t("applicationEmailInterview"))}:</strong> ${escapeHtml(interviewPlain)}</li>
        </ul>`
            : ""
        }
        ${
          answers.noteForEmployer
            ? `<p style="margin: 14px 0 6px 0;"><strong>${escapeHtml(t("applicationEmailNote"))}:</strong></p><pre style="white-space: pre-wrap; background: #fafafa; border: 1px solid #eee; padding: 12px; border-radius: 10px; margin: 0;">${escapeHtml(
                answers.noteForEmployer,
              )}</pre>`
            : ""
        }
        <p style="margin: 14px 0 0 0; font-size: 12px; color: #666;">
          ${escapeHtml(t("applicationEmailConsentFooter"))}
        </p>
      </div>
    `;
}

function escapeHtml(v: string) {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(v: string) {
  return escapeHtml(v).replaceAll("`", "&#096;");
}
