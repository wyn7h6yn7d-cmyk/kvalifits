/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { getEmployerJobIfOwned } from "@/lib/employer/getEmployerJobIfOwned";
import { parseMatchBreakdown } from "@/lib/employer/parseMatchBreakdown";
import { EmployerApplicantMatchPanel } from "@/components/employer/EmployerApplicantMatchPanel";
import { Link } from "@/i18n/routing";
import { safeHttpUrl } from "@/lib/utils";

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
  const allowed = new Set(["entry", "mid", "senior", "lead", "executive"]);
  if (!allowed.has(v)) return v;
  return tOnb(`experienceLevelOption.${v}` as "experienceLevelOption.entry");
}

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0]?.toUpperCase() ?? "") : "";
  return `${first}${last}` || "—";
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const job = await getEmployerJobIfOwned(supabase, user.id, id);
  if (!job) redirect(`/${locale}/account/employer`);

  const { data: app, error: appErr } = await supabase
    .from("job_applications")
    .select(
      "id,job_post_id,seeker_user_id,created_at,status,cover_letter,match_score,match_breakdown,shared_profile"
    )
    .eq("id", applicationId)
    .eq("job_post_id", id)
    .neq("status", "withdrawn")
    .maybeSingle();

  if (appErr) throw appErr;
  if (!app) redirect(`/${locale}/account/employer/jobs/${id}/applicants`);

  const seeker = (app.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
  const employerSnap = (app.shared_profile as { employer?: Record<string, unknown> } | null)?.employer ?? {};
  const avatarUrl = ((seeker.avatar_url as string | undefined) ?? "").toString().trim();
  const certRows = (seeker.certificates as unknown) ?? [];
  const certs = Array.isArray(certRows)
    ? (certRows as unknown[]).map((c) => c as { certificate_name?: string | null; certificate_issuer?: string | null })
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
  const employerName = ((employerSnap.company_name as string | undefined) ?? "").toString().trim() || "—";
  const about = ((seeker.about as string | undefined) ?? "").toString().trim();
  let cvUrl = safeHttpUrl(seeker.cv_url);
  const seekerUserId = (app as { seeker_user_id?: string }).seeker_user_id;
  if (!cvUrl && seekerUserId) {
    const { data: liveSeeker } = await supabase
      .from("seeker_profiles")
      .select("cv_url")
      .eq("user_id", seekerUserId)
      .maybeSingle();
    cvUrl = safeHttpUrl(liveSeeker?.cv_url);
  }
  const highlightCodes = Array.isArray((breakdown as any)?.highlights)
    ? (((breakdown as any).highlights as unknown[]).filter((x): x is string => typeof x === "string") as string[])
    : [];
  const weakCodes = Array.isArray((breakdown as any)?.weak_areas)
    ? (((breakdown as any).weak_areas as unknown[]).filter((x): x is string => typeof x === "string") as string[])
    : [];

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={name} subtitle={tNav("employerAreaSubtitle")} maxWidthClassName="max-w-5xl">
          <div className="space-y-6">
            <Link
              href={`/account/employer/jobs/${id}/applicants`}
              className="inline-flex text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              ← {t("applicantMatchBack")}
            </Link>

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
                  </div>
                </div>

                <div className="shrink-0">
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
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/25 to-fuchsia-500/20 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] transition-colors hover:border-violet-400/50 hover:from-violet-500/35 hover:to-fuchsia-500/28 sm:w-auto"
                    >
                      {t("applicantDetailDownloadCv")}
                    </a>
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

                {certs.filter((c) => (c.certificate_name ?? "").toString().trim()).length ? (
                  <div className="mt-5">
                    <div className="text-xs font-medium tracking-wide text-white/55">{t("applicantDetailCertificates")}</div>
                    <ul className="mt-2 space-y-1 text-sm text-white/65">
                      {certs
                        .filter((c) => (c.certificate_name ?? "").toString().trim())
                        .slice(0, 8)
                        .map((c, i) => (
                          <li key={`${i}-${(c.certificate_name ?? "").toString().slice(0, 24)}`}>
                            {(c.certificate_name ?? "—").toString()}
                            {(c.certificate_issuer ?? "").toString().trim()
                              ? <span className="text-white/45"> · {(c.certificate_issuer ?? "").toString()}</span>
                              : null}
                          </li>
                        ))}
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

            {app.cover_letter ? (
              <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
                <div className="text-xs font-medium tracking-wide text-white/55">{t("applicationsMessage")}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-white/75">{app.cover_letter as string}</div>
              </div>
            ) : null}
          </div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}
