/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { getEmployerJobIfOwned } from "@/lib/employer/getEmployerJobIfOwned";
import { parseMatchBreakdown } from "@/lib/employer/parseMatchBreakdown";
import { buildMatchExplanationFromSharedProfile } from "@/lib/matching/matchExplanation";
import { EmployerApplicantMatchPanel } from "@/components/employer/EmployerApplicantMatchPanel";
import { EmployerLegalRepresentativeConsentNotice } from "@/components/employer/EmployerLegalRepresentativeConsentNotice";
import { formatPipelineTimestamp } from "@/lib/employer/applicationPipeline";
import { EmployerApplicationStatusSelect } from "@/components/employer/EmployerApplicationStatusSelect";
import { EmployerApplicationInternalNotes } from "@/components/employer/EmployerApplicationInternalNotes";
import { EmployerApplicationStatusHistory } from "@/components/employer/EmployerApplicationStatusHistory";
import { Link } from "@/i18n/routing";
import { firstCvStorageRef } from "@/lib/seeker/cvStorage";
import { PrivateCvOpenLink } from "@/components/seeker/PrivateCvOpenLink";
import {
  calculateAgeYears,
  isLegalRepresentativeConsentStatus,
  requiresLegalRepresentativeConsentNotice,
} from "@/lib/seeker/age";
import { isWorkplaceNeedKey, type SharedWorkplaceNeed, type WorkplaceNeedKey } from "@/lib/seeker/workplaceNeeds";
import { applicationAnswersFromUnknown, formatAvailabilityStartDisplay, formatInterviewPreferencesDisplay, formatSalaryExpectationScan } from "@/lib/jobs/applicationAnswers";
import {
  formatCertificateExpiryWarning,
  parseCertificateVerificationStatus,
} from "@/lib/seeker/certificateVerification";
import {
  CertificateStatusBlock,
  certificateViewLabelsFromT,
} from "@/components/seeker/CertificateVerificationBadge";
import { ApplicantEducationList } from "@/components/employer/ApplicantEducationList";

type Props = { params: Promise<{ locale: string; id: string; applicationId: string }> };

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

function mapWorkType(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim();
  if (!v) return "";
  if (v === "on_site") return tJobs("workTypeOnSite");
  if (v === "hybrid") return tJobs("workTypeHybrid");
  if (v === "remote") return tJobs("workTypeRemote");
  return v;
}

function mapJobType(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim();
  if (!v) return "";
  if (v === "full_time") return tJobs("jobTypeFullTime");
  if (v === "part_time") return tJobs("jobTypePartTime");
  if (v === "contract") return tJobs("jobTypeContract");
  if (v === "internship") return tJobs("jobTypeInternship");
  return v;
}

function mapExperience(raw: string | null | undefined, tOnb: (key: string) => string) {
  const v = (raw ?? "").trim();
  if (!v) return "—";
  const allowed = new Set(["not_required", "entry", "mid", "senior", "lead", "executive"]);
  if (!allowed.has(v)) return v;
  return tOnb(`experienceLevelOption.${v}` as "experienceLevelOption.entry");
}

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0]?.toUpperCase() ?? "") : "";
  return `${first}${last}` || "—";
}

function workplaceNeedLabel(key: WorkplaceNeedKey, t: (key: string) => string) {
  return t(`workplaceNeedEmployer.${key}`);
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

export default async function EmployerApplicantDetailPage({ params }: Props) {
  const { locale, id, applicationId } = await params;
  const t = await getTranslations({ locale, namespace: "jobs" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tOnb = await getTranslations({ locale, namespace: "onboarding" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  const job = await getEmployerJobIfOwned(supabase, user.id, id);
  if (!job) redirect(`/${locale}/account/employer`);

  const { data: appRaw, error: appErr } = await supabase
    .from("job_applications")
    .select(
      "id,job_post_id,seeker_user_id,created_at,status,status_updated_at,cover_letter,application_answers,match_score,match_breakdown,shared_profile"
    )
    .eq("id", applicationId)
    .eq("job_post_id", id)
    .neq("status", "withdrawn")
    .maybeSingle();

  let app = appRaw;
  if (appErr && /status_updated_at/i.test(appErr.message ?? "")) {
    const fallback = await supabase
      .from("job_applications")
      .select(
        "id,job_post_id,seeker_user_id,created_at,status,cover_letter,application_answers,match_score,match_breakdown,shared_profile"
      )
      .eq("id", applicationId)
      .eq("job_post_id", id)
      .neq("status", "withdrawn")
      .maybeSingle();
    if (fallback.error && /application_answers|column/i.test(fallback.error.message ?? "")) {
      const fallback2 = await supabase
        .from("job_applications")
        .select(
          "id,job_post_id,seeker_user_id,created_at,status,cover_letter,match_score,match_breakdown,shared_profile"
        )
        .eq("id", applicationId)
        .eq("job_post_id", id)
        .neq("status", "withdrawn")
        .maybeSingle();
      if (fallback2.error) throw fallback2.error;
      app = fallback2.data as typeof appRaw;
    } else if (fallback.error) {
      throw fallback.error;
    } else {
      app = fallback.data as typeof appRaw;
    }
  } else if (appErr && /application_answers|column/i.test(appErr.message ?? "")) {
    const fallback = await supabase
      .from("job_applications")
      .select(
        "id,job_post_id,seeker_user_id,created_at,status,cover_letter,match_score,match_breakdown,shared_profile"
      )
      .eq("id", applicationId)
      .eq("job_post_id", id)
      .neq("status", "withdrawn")
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    app = fallback.data as typeof appRaw;
  } else if (appErr) {
    throw appErr;
  }
  if (!app) redirect(`/${locale}/account/employer/jobs/${id}/applicants`);

  const { data: internalNoteRow, error: internalNoteErr } = await supabase
    .from("job_application_internal_notes")
    .select("note_text")
    .eq("application_id", applicationId)
    .maybeSingle();
  // Table may be missing until fix script is run — page still works without notes.
  if (
    internalNoteErr &&
    !/does not exist|schema cache|relation|could not find/i.test(internalNoteErr.message ?? "")
  ) {
    throw internalNoteErr;
  }
  const internalNoteText =
    typeof internalNoteRow?.note_text === "string" ? internalNoteRow.note_text : "";

  const seeker = (app.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
  const employerSnap = (app.shared_profile as { employer?: Record<string, unknown> } | null)?.employer ?? {};
  const sharedAnswers =
    (app.shared_profile as { answers?: unknown } | null)?.answers ??
    (app as { application_answers?: unknown }).application_answers ??
    null;
  const answers = applicationAnswersFromUnknown(sharedAnswers);
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
  const avatarUrl = ((seeker.avatar_url as string | undefined) ?? "").toString().trim();
  const certRows = (seeker.certificates as unknown) ?? [];
  const certs = Array.isArray(certRows)
    ? (certRows as unknown[]).map(
        (c) =>
          c as {
            certificate_name?: string | null;
            certificate_issuer?: string | null;
            certificate_valid_until?: string | null;
            verification_status?: string | null;
            verified_at?: string | null;
            verification_source?: string | null;
            verified_by?: string | null;
          }
      )
    : [];

  const name = displayName((seeker.full_name as string | undefined) ?? null);
  const profileTitle = ((seeker.profile_title as string | undefined) ?? "").trim() || "—";
  const location = ((seeker.location as string | undefined) ?? "").trim() || "—";
  const skillsRaw = seeker.skills;
  const skills = Array.isArray(skillsRaw)
    ? (skillsRaw as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : [];

  const metaLine = [mapWorkType((job.work_type ?? "").toString(), t), mapJobType((job.job_type ?? "").toString(), t)]
    .filter(Boolean)
    .join(" · ");

  const requirementLines = (job.requirement_lines ?? []).map((x) => String(x).trim()).filter(Boolean);
  const requiredSkills = (job.required_skills ?? []).map((x) => String(x).trim()).filter(Boolean);

  const breakdown = parseMatchBreakdown(app.match_breakdown);
  const score = typeof app.match_score === "number" ? app.match_score : null;
  const explanation = buildMatchExplanationFromSharedProfile({
    breakdown,
    sharedProfile: app.shared_profile,
    applicationAnswers: answers,
  });
  const employerName = ((employerSnap.company_name as string | undefined) ?? "").toString().trim() || "—";
  const about = ((seeker.about as string | undefined) ?? "").toString().trim();
  const workplaceNeedsShared: SharedWorkplaceNeed[] = (() => {
    const raw = seeker.workplace_needs;
    if (!Array.isArray(raw)) return [];
    const out: SharedWorkplaceNeed[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const key = (item as { key?: unknown }).key;
      if (!isWorkplaceNeedKey(key)) continue;
      const note = (item as { note?: unknown }).note;
      out.push({
        key,
        note: typeof note === "string" && note.trim() ? note.trim() : null,
      });
    }
    return out;
  })();
  let cvUrl = firstCvStorageRef(typeof seeker.cv_url === "string" ? seeker.cv_url : null);
  const seekerUserId = (app as { seeker_user_id?: string }).seeker_user_id;
  let showLegalRepConsentNotice = Boolean(seeker.requires_legal_representative_consent);
  if (seekerUserId) {
    const { data: liveSeeker } = await supabase
      .from("seeker_profiles")
      .select("cv_url,is_minor,date_of_birth,legal_representative_consent_status")
      .eq("user_id", seekerUserId)
      .maybeSingle();
    if (!cvUrl) cvUrl = firstCvStorageRef(liveSeeker?.cv_url);
    if (liveSeeker) {
      const dob = (liveSeeker.date_of_birth ?? "").toString();
      const age = dob ? calculateAgeYears(dob) : null;
      const consentRaw = liveSeeker.legal_representative_consent_status;
      showLegalRepConsentNotice = requiresLegalRepresentativeConsentNotice({
        isMinor: Boolean(liveSeeker.is_minor) || (age !== null && age < 18),
        consentStatus: isLegalRepresentativeConsentStatus(consentRaw) ? consentRaw : "required",
      });
    }
  }
  const highlightCodes = Array.isArray((breakdown as any)?.highlights)
    ? (((breakdown as any).highlights as unknown[]).filter((x): x is string => typeof x === "string") as string[])
    : [];
  const weakCodes = Array.isArray((breakdown as any)?.weak_areas)
    ? (((breakdown as any).weak_areas as unknown[]).filter((x): x is string => typeof x === "string") as string[])
    : [];

  return (
    <AuthShell title={name} subtitle={tNav("employerAreaSubtitle")} maxWidthClassName="max-w-5xl">
          <div className="space-y-6">
            <Link
              href={`/account/employer/jobs/${id}/applicants`}
              className="inline-flex text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              ← {t("applicantMatchBack")}
            </Link>

            {showLegalRepConsentNotice ? (
              <EmployerLegalRepresentativeConsentNotice locale={locale} />
            ) : null}

            <div className="rounded-3xl border border-white/[0.10] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03]">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/55">
                        {initialsFromName(name)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t("applicantDetailHeader")}</div>
                    <div className="mt-2 text-lg font-semibold leading-snug tracking-tight text-white/92">{name}</div>
                    <div className="mt-1 text-sm text-white/65">{profileTitle}</div>
                    <div className="mt-2 text-sm text-white/55">
                      {location} · {mapExperience(seeker.experience_level as string | undefined, tOnb)}
                    </div>
                    <div className="mt-3 text-xs text-white/45">
                      {t("applicantDetailAppliedTo", { company: employerName, title: job.title })} ·{" "}
                      {t("applicantsApplied")}:{" "}
                      {app.created_at ? new Date(app.created_at as string).toLocaleString() : "—"}
                    </div>
                    {interviewScan ? (
                      <div className="mt-4 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          {t("applyInterviewPreference")}
                        </div>
                        <div className="mt-1.5 text-sm font-medium leading-snug text-white/90">
                          {interviewScan.formats}
                        </div>
                        {interviewScan.preferOnline ? (
                          <div className="mt-2 inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100/90">
                            {interviewScan.preferOnlineLabel}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="mt-4 max-w-xs">
                      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        {t("applicationPipelineStatusLabel")}
                      </div>
                      <EmployerApplicationStatusSelect
                        applicationId={String(app.id)}
                        status={(app as { status?: string | null }).status}
                      />
                      <p className="mt-1.5 text-[11px] tabular-nums text-white/40">
                        {t("applicationStatusUpdatedAt")}:{" "}
                        {formatPipelineTimestamp(
                          locale,
                          (app as { status_updated_at?: string | null }).status_updated_at ??
                            (app.created_at as string | null),
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                  {salaryScan ? (
                    <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] px-5 py-4 text-right shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                        {t("applySalary")}
                      </div>
                      <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-white/95">
                        {salaryScan.primary}
                      </div>
                      <div className="mt-1 text-[12px] text-white/50">{salaryScan.basis}</div>
                    </div>
                  ) : null}
                  <div className="rounded-3xl border border-white/[0.10] bg-black/25 px-5 py-4 text-right shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      {t("applicantDetailSuitability")}
                    </div>
                    <div className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-white">
                      {score == null ? "—" : `${score}%`}
                    </div>
                    <div className="mt-1 text-[12px] text-white/50">{t("applicantDetailSuitabilityHint")}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-white/[0.10] pt-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{t("applicantDetailCv")}</div>
                {cvUrl ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <PrivateCvOpenLink
                      cvRef={cvUrl}
                      errorLabel={t("applicantCvOpenFailed")}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/25 to-fuchsia-500/20 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] transition-colors hover:border-violet-400/50 hover:from-violet-500/35 hover:to-fuchsia-500/28 disabled:opacity-60 sm:w-auto"
                    >
                      {t("applicantDetailDownloadCv")}
                    </PrivateCvOpenLink>
                    <p className="text-[12px] leading-relaxed text-white/45 sm:ml-1">{t("applicantDetailCvHint")}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{t("applicantDetailNoCv")}</p>
                )}
              </div>

              {(highlightCodes.length || weakCodes.length) ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {highlightCodes.length ? (
                    <div className="rounded-2xl border border-emerald-500/18 bg-emerald-500/8 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/85">
                        {t("applicantDetailWhyStrong")}
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-emerald-100/85">
                        {highlightCodes
                          .map((c) => highlightLabel(c, t))
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((line, i) => (
                            <li key={`${i}-${line.slice(0, 16)}`}>{line}</li>
                          ))}
                      </ul>
                    </div>
                  ) : null}

                  {weakCodes.length ? (
                    <div className="rounded-2xl border border-amber-500/18 bg-amber-500/10 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/85">
                        {t("applicantDetailWhyWeak")}
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-amber-100/85">
                        {weakCodes
                          .map((code) => {
                            const k = `applicantMatchWeak_${code}` as any;
                            const v = t(k);
                            return v && typeof v === "string" ? v : "";
                          })
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((line, i) => (
                            <li key={`${i}-${line.slice(0, 16)}`}>{line}</li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <EmployerApplicationInternalNotes
              applicationId={String(app.id)}
              initialNote={internalNoteText}
            />

            <EmployerApplicationStatusHistory
              locale={locale}
              applicationId={String(app.id)}
              refreshKey={(app as { status_updated_at?: string | null }).status_updated_at ?? null}
            />

            <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
              <section className="flex min-h-0 w-full min-w-0 flex-1 basis-0 flex-col rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t("applicantDetailSeeker")}</div>

                {skills.length ? (
                  <div className="mt-5">
                    <div className="text-xs font-medium tracking-wide text-white/55">{t("applicantDetailSkills")}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {skills.slice(0, 18).map((s, i) => (
                        <span key={`${i}-${s}`} className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {about ? (
                  <div className="mt-5">
                    <div className="text-xs font-medium tracking-wide text-white/55">{t("applicantDetailIntro")}</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                      {about.length > 340 ? `${about.slice(0, 340)}…` : about}
                    </div>
                  </div>
                ) : null}

                {workplaceNeedsShared.length ? (
                  <div className="mt-5">
                    <div className="text-xs font-medium tracking-wide text-white/55">
                      {t("applicantWorkplaceNeedsTitle")}
                    </div>
                    <div className="mt-1 text-[12px] leading-relaxed text-white/45">
                      {t("applicantWorkplaceNeedsHint")}
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/72">
                      {workplaceNeedsShared.map((item) => (
                        <li key={item.key}>
                          {workplaceNeedLabel(item.key, t)}
                          {item.key === "other_need" && item.note ? (
                            <span className="text-white/55"> — {item.note}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <ApplicantEducationList raw={seeker.education} />

                {certs.filter((c) => (c.certificate_name ?? "").toString().trim()).length ? (
                  <div className="mt-5">
                    <div className="text-xs font-medium tracking-wide text-white/55">{t("applicantDetailCertificates")}</div>
                    <ul className="mt-2 space-y-3 text-sm text-white/65">
                      {certs
                        .filter((c) => (c.certificate_name ?? "").toString().trim())
                        .slice(0, 8)
                        .map((c, i) => {
                          const stored = parseCertificateVerificationStatus(c.verification_status);
                          const warningLine = formatCertificateExpiryWarning(
                            c.certificate_valid_until ?? null,
                            {
                              expiresToday: tOnb("certificateExpiresToday"),
                              expiresInDays: (days) => tOnb("certificateExpiresInDays", { days }),
                            }
                          );
                          return (
                            <li key={`${i}-${(c.certificate_name ?? "").toString().slice(0, 24)}`}>
                              <CertificateStatusBlock
                                name={(c.certificate_name ?? "—").toString()}
                                fields={{
                                  verification_status: stored,
                                  verified_at: c.verified_at ?? null,
                                  verification_source: c.verification_source ?? null,
                                  certificate_valid_until: c.certificate_valid_until ?? null,
                                  certificate_issuer: c.certificate_issuer ?? null,
                                }}
                                labels={certificateViewLabelsFromT((key, values) => tOnb(key, values))}
                                locale={locale}
                                warningLine={warningLine}
                              />
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ) : null}
              </section>

              <section className="flex min-h-0 w-full min-w-0 flex-1 basis-0 flex-col rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t("applicantDetailJob")}</div>
                <div className="mt-2 text-base font-semibold leading-snug tracking-tight text-white/90">{job.title}</div>
                <div className="mt-2 text-sm text-white/60">
                  {employerName} · {(job.location ?? "—").toString()} · {metaLine || "—"}
                </div>

                {requirementLines.length ? (
                  <div className="mt-5">
                    <div className="text-xs font-medium tracking-wide text-white/55">{t("applicantDetailRequirements")}</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
                      {requirementLines.slice(0, 14).map((line, i) => (
                        <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {requiredSkills.length ? (
                  <div className="mt-5">
                    <div className="text-xs font-medium tracking-wide text-white/55">{t("applicantDetailRequiredSkills")}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {requiredSkills.slice(0, 14).map((s, i) => (
                        <span key={`${i}-${s}`} className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {Array.isArray(job.keywords) && (job.keywords as string[]).filter(Boolean).length ? (
                  <div className="mt-5">
                    <div className="text-xs font-medium tracking-wide text-white/55">{t("applicantDetailKeywords")}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(job.keywords as string[]).filter(Boolean).slice(0, 14).map((s, i) => (
                        <span key={`${i}-${s}`} className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>

            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                {t("applicantDetailScore")}
              </div>
              <EmployerApplicantMatchPanel
                variant="breakdownOnly"
                score={score}
                breakdown={breakdown}
                explanation={explanation}
                seeker={{
                  displayName: name,
                  profileTitle,
                  location,
                  experienceLabel: mapExperience(seeker.experience_level as string | undefined, tOnb),
                  skills,
                }}
                job={{
                  title: job.title,
                  location: (job.location ?? "").trim() || "—",
                  metaLine: metaLine || "—",
                  experienceLabel: mapExperience(job.experience_level_required, tOnb),
                  requirementLines,
                  requiredSkills,
                  certRequirements: job.certificate_requirements ?? null,
                  shortSummary: job.short_summary,
                }}
              />
            </div>

            {answers ? (
              <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6 space-y-4">
                <div className="text-xs font-medium tracking-wide text-white/55">{t("applicationAnswersTitle")}</div>
                <dl className="grid gap-2 text-sm text-white/75 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-white/45">{t("applyAvailableFrom")}</dt>
                    <dd className="mt-0.5">
                      {formatAvailabilityStartDisplay(answers, (code) =>
                        t(`applyAvailableFromOption.${code}`)
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-white/45">{t("applyNoticePeriod")}</dt>
                    <dd className="mt-0.5">{answers.noticePeriod}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-white/45">{t("applyWeeklyHours")}</dt>
                    <dd className="mt-0.5">{answers.weeklyHoursDesired}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-white/45">{t("applyScheduleFit")}</dt>
                    <dd className="mt-0.5">{t(`applyScheduleFitOption.${answers.scheduleFits}`)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-white/45">{t("applyInterviewPreference")}</dt>
                    <dd className="mt-0.5">
                      {formatInterviewPreferencesDisplay(
                        answers,
                        (code) => t(`applyInterviewOption.${code}`),
                        t("applyPreferFirstInterviewOnline")
                      ).formats}
                      {answers.prefer_first_interview_online ? (
                        <div className="mt-1 text-xs text-emerald-100/80">{t("applyPreferFirstInterviewOnline")}</div>
                      ) : null}
                    </dd>
                  </div>
                </dl>
                {answers.noteForEmployer ? (
                  <div className="border-t border-white/[0.08] pt-3">
                    <div className="text-xs text-white/45">{t("applyNoteLabel")}</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-white/75">{answers.noteForEmployer}</div>
                  </div>
                ) : null}
              </div>
            ) : app.cover_letter ? (
              <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
                <div className="text-xs font-medium tracking-wide text-white/55">{t("applicationsMessage")}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-white/75">{app.cover_letter as string}</div>
              </div>
            ) : null}
          </div>
        </AuthShell>
  );
}
