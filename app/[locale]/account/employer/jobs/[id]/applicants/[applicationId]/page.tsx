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
    .select("id,job_post_id,created_at,status,cover_letter,match_score,match_breakdown,shared_profile")
    .eq("id", applicationId)
    .eq("job_post_id", id)
    .neq("status", "withdrawn")
    .maybeSingle();

  if (appErr) throw appErr;
  if (!app) redirect(`/${locale}/account/employer/jobs/${id}/applicants`);

  const seeker = (app.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
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

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={name} subtitle={tNav("employerAreaSubtitle")} maxWidthClassName="max-w-3xl">
          <div className="space-y-6">
            <Link
              href={`/account/employer/jobs/${id}/applicants`}
              className="inline-flex text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              ← {t("applicantMatchBack")}
            </Link>

            <div className="text-xs text-white/50">
              {job.title} · {t("applicantsApplied")}:{" "}
              {app.created_at ? new Date(app.created_at as string).toLocaleString() : "—"}
            </div>

            <div className="grid gap-6">
              <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t("applicantDetailSeeker")}</div>
                <div className="mt-4 flex items-start gap-4">
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

                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold leading-snug tracking-tight text-white/90">{name}</div>
                    <div className="mt-1 text-sm text-white/65">{profileTitle}</div>
                    <div className="mt-2 text-sm text-white/55">{location} · {mapExperience(seeker.experience_level as string | undefined, tOnb)}</div>
                  </div>
                </div>

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
              </div>

              <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t("applicantDetailJob")}</div>
                <div className="mt-2 text-base font-semibold leading-snug tracking-tight text-white/90">{job.title}</div>
                <div className="mt-2 text-sm text-white/60">
                  {(job.location ?? "—").toString()} · {metaLine || "—"}
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
