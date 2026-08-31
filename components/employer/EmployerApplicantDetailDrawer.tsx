"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { Bone } from "@/components/ui/Skeleton";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { FitScoreExplain } from "@/components/jobs/FitScoreExplain";
import { EmployerApplicationStatusSelect } from "@/components/employer/EmployerApplicationStatusSelect";
import { EmployerApplicationInternalNotes } from "@/components/employer/EmployerApplicationInternalNotes";
import { EmployerApplicationStatusHistory } from "@/components/employer/EmployerApplicationStatusHistory";
import {
  formatAvailabilityStartDisplay,
  formatInterviewPreferencesDisplay,
  formatSalaryExpectationScan,
} from "@/lib/jobs/applicationAnswers";
import {
  formatCertificateExpiryWarning,
  parseCertificateVerificationStatus,
} from "@/lib/seeker/certificateVerification";
import {
  CertificateStatusBlock,
  certificateViewLabelsFromT,
} from "@/components/seeker/CertificateVerificationBadge";
import { ApplicantEducationList } from "@/components/employer/ApplicantEducationList";
import { isWorkplaceNeedKey, type SharedWorkplaceNeed, type WorkplaceNeedKey } from "@/lib/seeker/workplaceNeeds";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { firstCvStorageRef } from "@/lib/seeker/cvStorage";
import { PrivateCvOpenLink } from "@/components/seeker/PrivateCvOpenLink";
import {
  type ApplicantApplicationRow,
  answersFromApplicantRow,
  scanApplicantRow,
  seekerFromApplicantRow,
} from "@/lib/employer/applicantScan";
import { formatPipelineTimestamp, type ApplicationPipelineStatus } from "@/lib/employer/applicationPipeline";

function sharedWorkplaceNeeds(seeker: Record<string, unknown>): SharedWorkplaceNeed[] {
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
}

function workplaceNeedLabel(key: WorkplaceNeedKey, t: (key: string) => string) {
  return t(`workplaceNeedEmployer.${key}`);
}

export function EmployerApplicantDetailDrawer({
  locale,
  jobPostId,
  row,
  status,
  statusUpdatedAt,
  onStatusUpdated,
  onClose,
}: {
  locale: string;
  jobPostId: string;
  row: ApplicantApplicationRow | null;
  status: ApplicationPipelineStatus;
  statusUpdatedAt: string | null | undefined;
  onStatusUpdated: (next: ApplicationPipelineStatus, at?: string | null) => void;
  onClose: () => void;
}) {
  const t = useTranslations("jobs");
  const tOnb = useTranslations("onboarding");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [noteState, setNoteState] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    const applicationId = row?.id;
    if (!applicationId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("job_application_internal_notes")
        .select("note_text")
        .eq("application_id", applicationId)
        .maybeSingle();
      if (cancelled) return;
      const text =
        error && !/does not exist|schema cache|relation|could not find/i.test(error.message ?? "")
          ? ""
          : typeof data?.note_text === "string"
            ? data.note_text
            : "";
      setNoteState({ id: applicationId, text });
    })();
    return () => {
      cancelled = true;
    };
  }, [row?.id, supabase]);

  const noteReady = Boolean(row && noteState?.id === row.id);

  const scan = row ? scanApplicantRow(row) : null;
  const seeker = row ? seekerFromApplicantRow(row) : {};
  const answers = row ? answersFromApplicantRow(row) : null;

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
        t("applyPreferFirstInterviewOnline"),
      )
    : null;
  const startLabel = answers
    ? formatAvailabilityStartDisplay(answers, (code) => t(`applyAvailableFromOption.${code}`))
    : null;
  const needs = sharedWorkplaceNeeds(seeker);
  const certRows = Array.isArray(seeker.certificates) ? seeker.certificates : [];
  const cvUrl = firstCvStorageRef(row?.resolved_cv_url, typeof seeker.cv_url === "string" ? seeker.cv_url : null);
  const about = ((seeker.about as string | undefined) ?? "").toString().trim();

  let experienceLabel = "—";
  if (scan?.firstJob) {
    experienceLabel = t("applicantCardFirstJob");
  } else if (scan?.experienceLevel) {
    const known = ["entry", "mid", "senior", "lead", "executive", "not_required"] as const;
    experienceLabel = (known as readonly string[]).includes(scan.experienceLevel)
      ? tOnb(`experienceLevelOption.${scan.experienceLevel as (typeof known)[number]}`)
      : scan.experienceLevel;
    if (scan.years !== null) {
      experienceLabel = `${experienceLabel} · ${t("applicantCardExperienceYears", { years: scan.years })}`;
    }
  } else if (scan?.years !== null && scan?.years !== undefined) {
    experienceLabel = t("applicantCardExperienceYears", { years: scan.years });
  }

  return (
    <Sheet open={Boolean(row)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        className={cn(
          "right-0 top-[var(--site-header-offset)] flex h-[calc(100dvh-var(--site-header-offset))] w-full max-w-xl flex-col rounded-none border-y-0 border-l border-r-0 p-0 shadow-none md:right-0 md:w-[min(100%,36rem)]",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <SheetTitle className="pr-10 text-[17px] font-semibold tracking-tight text-foreground">
            {scan?.name ?? t("applicantsTitle")}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm text-muted-2">
            {scan?.profileTitle || t("applicantsNoTitle")}
          </SheetDescription>

          {row && scan ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                    {t("applicationPipelineStatusLabel")}
                  </div>
                  <EmployerApplicationStatusSelect
                    key={row.id}
                    applicationId={row.id}
                    status={status}
                    onUpdated={onStatusUpdated}
                  />
                  <p className="mt-1.5 text-[11px] tabular-nums text-muted-2">
                    {t("applicationStatusUpdatedAt")}: {formatPipelineTimestamp(locale, statusUpdatedAt)}
                  </p>
                </div>
                {cvUrl ? (
                  <div className="flex items-end">
                    <PrivateCvOpenLink
                      cvRef={cvUrl}
                      errorLabel={t("applicantCvOpenFailed")}
                      className="inline-flex h-10 items-center rounded-xl border border-border bg-[#f8fafc] px-3 text-[13px] font-medium text-foreground/80 hover:bg-[#f5f7fb] disabled:opacity-60"
                    >
                      {t("applicantDetailViewCv")}
                    </PrivateCvOpenLink>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border bg-white p-4">
                <FitScoreExplain
                  score={scan.score}
                  lazySource={{ applicationId: row.id }}
                  label={t("applicantsSuitabilityPercent")}
                  defaultOpen
                  showCountsWhenCollapsed
                />
              </div>

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                  {t("applicantCardExperience")}
                </h3>
                <p className="mt-1.5 text-sm text-foreground/80">{experienceLabel}</p>
              </section>

              {scan.skills.length ? (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                    {t("applicantDetailSkills")}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {scan.skills.slice(0, 18).map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-border bg-[#f8fafc] px-2.5 py-0.5 text-[12px] text-body"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                  {t("applicantCardLanguages")}
                </h3>
                <p className="mt-1.5 text-sm text-foreground/80">
                  {scan.languages.length ? scan.languages.join(" · ") : "—"}
                </p>
              </section>

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                  {t("applicantDetailCertificates")}
                </h3>
                {certRows.filter((c) => {
                  const name = ((c as { certificate_name?: string }).certificate_name ?? "").toString().trim();
                  return Boolean(name);
                }).length ? (
                  <ul className="mt-2 space-y-3">
                    {certRows
                      .map((c) => c as {
                        certificate_name?: string | null;
                        certificate_issuer?: string | null;
                        certificate_valid_until?: string | null;
                        verification_status?: string | null;
                        verified_at?: string | null;
                        verification_source?: string | null;
                        verified_by?: string | null;
                      })
                      .filter((c) => (c.certificate_name ?? "").toString().trim())
                      .slice(0, 8)
                      .map((c, i) => {
                        const stored = parseCertificateVerificationStatus(c.verification_status);
                        const warningLine = formatCertificateExpiryWarning(c.certificate_valid_until ?? null, {
                          expiresToday: tOnb("certificateExpiresToday"),
                          expiresInDays: (days) => tOnb("certificateExpiresInDays", { days }),
                        });
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
                ) : (
                  <p className="mt-1.5 text-sm text-muted-2">{t("applicantDetailNoCertificates")}</p>
                )}
              </section>

              <ApplicantEducationList raw={seeker.education} variant="drawer" />

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                  {t("applyInterviewPreference")}
                </h3>
                {interviewScan ? (
                  <p className="mt-1.5 text-sm text-foreground/80">
                    {interviewScan.formats}
                    {interviewScan.preferOnline ? (
                      <span className="mt-1 block text-xs text-muted-2">{t("applicantCardPreferOnlineShort")}</span>
                    ) : null}
                  </p>
                ) : (
                  <p className="mt-1.5 text-sm text-muted-2">—</p>
                )}
              </section>

              {answers ? (
                <section className="rounded-2xl border border-border bg-white p-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                    {t("applicationAnswersTitle")}
                  </h3>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[11px] text-muted-2">{t("applySalary")}</dt>
                      <dd className="mt-0.5 tabular-nums text-foreground/80">
                        {salaryScan ? `${salaryScan.primary} ${salaryScan.basis}` : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-2">{t("applyAvailableFrom")}</dt>
                      <dd className="mt-0.5 text-foreground/80">{startLabel ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-2">{t("applyWeeklyHours")}</dt>
                      <dd className="mt-0.5 text-foreground/80">{answers.weeklyHoursDesired}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-2">{t("applyNoticePeriod")}</dt>
                      <dd className="mt-0.5 text-foreground/80">{answers.noticePeriod || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-2">{t("applyScheduleFit")}</dt>
                      <dd className="mt-0.5 text-foreground/80">{t(`applyScheduleFitOption.${answers.scheduleFits}`)}</dd>
                    </div>
                  </dl>
                  {answers.noteForEmployer ? (
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="text-[11px] text-muted-2">{t("applyNoteLabel")}</div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{answers.noteForEmployer}</p>
                    </div>
                  ) : null}
                </section>
              ) : row.cover_letter ? (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                    {t("applicationsMessage")}
                  </h3>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted">{row.cover_letter}</p>
                </section>
              ) : null}

              {needs.length ? (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                    {t("applicantWorkplaceNeedsTitle")}
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-2">{t("applicantWorkplaceNeedsHint")}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                    {needs.map((item) => (
                      <li key={item.key}>
                        {workplaceNeedLabel(item.key, t)}
                        {item.key === "other_need" && item.note ? (
                          <span className="text-muted-2"> — {item.note}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {about ? (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                    {t("applicantDetailIntro")}
                  </h3>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-body">
                    {about.length > 340 ? `${about.slice(0, 340)}…` : about}
                  </p>
                </section>
              ) : null}

              {noteReady ? (
                  <EmployerApplicationInternalNotes
                    applicationId={row.id}
                    initialNote={noteState?.text ?? ""}
                    className="rounded-2xl p-4"
                  />
              ) : (
                <div className="rounded-2xl border border-border bg-white px-4 py-5">
                  <Bone className="h-3 w-28" />
                  <Bone className="mt-3 h-16 w-full rounded-xl" />
                </div>
              )}

              <EmployerApplicationStatusHistory
                locale={locale}
                applicationId={row.id}
                refreshKey={statusUpdatedAt}
              />

              <Link
                href={`/account/employer/jobs/${jobPostId}/applicants/${row.id}`}
                className="inline-flex text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("inboxOpenFullPage")}
              </Link>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
