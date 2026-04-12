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
    .select("id,job_post_id,created_at,cover_letter,match_score,match_breakdown,shared_profile")
    .eq("id", applicationId)
    .eq("job_post_id", id)
    .maybeSingle();

  if (appErr) throw appErr;
  if (!app) redirect(`/${locale}/account/employer/jobs/${id}/applicants`);

  const seeker = (app.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
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

            <EmployerApplicantMatchPanel
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
