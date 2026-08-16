import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { EmployerApplicantList } from "@/components/employer/EmployerApplicantList";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { getEmployerJobIfOwned } from "@/lib/employer/getEmployerJobIfOwned";
import { safeHttpUrl } from "@/lib/utils";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EmployerJobApplicantsPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "jobs" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

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

  const { data: applications, error: appErr } = await supabase
    .from("job_applications")
    .select("id,seeker_user_id,created_at,status,match_score,match_breakdown,shared_profile,application_answers")
    .eq("job_post_id", id)
    .limit(200);
  if (appErr) throw appErr;

  const apps = applications ?? [];
  const seekerIds = [...new Set(apps.map((a) => a.seeker_user_id).filter(Boolean))] as string[];
  const liveBySeeker = new Map<
    string,
    { cvUrl: string | null; languages: string[]; experienceDurationYears: number | null; seekingFirstJob: boolean }
  >();
  if (seekerIds.length) {
    const { data: profiles } = await supabase
      .from("seeker_profiles")
      .select("user_id,cv_url,languages,experience_duration_years,exp_seeking_first_job")
      .in("user_id", seekerIds);
    for (const p of profiles ?? []) {
      const row = p as {
        user_id: string;
        cv_url?: string | null;
        languages?: string[] | null;
        experience_duration_years?: number | null;
        exp_seeking_first_job?: boolean | null;
      };
      const langs = Array.isArray(row.languages)
        ? row.languages.map((x) => String(x).trim()).filter(Boolean)
        : [];
      const years =
        row.experience_duration_years === null || row.experience_duration_years === undefined
          ? null
          : Number(row.experience_duration_years);
      liveBySeeker.set(row.user_id, {
        cvUrl: safeHttpUrl(row.cv_url),
        languages: langs,
        experienceDurationYears: years !== null && Number.isFinite(years) ? years : null,
        seekingFirstJob: Boolean(row.exp_seeking_first_job),
      });
    }
  }

  const enriched = apps.map((a) => {
    const seeker = (a.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
    const fromSnap = safeHttpUrl(seeker.cv_url);
    const live = a.seeker_user_id ? liveBySeeker.get(a.seeker_user_id) : undefined;
    return {
      ...a,
      resolved_cv_url: fromSnap ?? live?.cvUrl ?? null,
      live: live
        ? {
            languages: live.languages,
            experienceDurationYears: live.experienceDurationYears,
            seekingFirstJob: live.seekingFirstJob,
          }
        : null,
    };
  });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("applicantsTitle")} subtitle={tNav("employerAreaSubtitle")} maxWidthClassName="max-w-4xl">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/[0.10] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 sm:p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t("applicantsForJob")}</div>
              <div className="mt-2 text-base font-semibold leading-snug tracking-tight text-white/90">{job.title}</div>
            </div>

            <EmployerApplicantList locale={locale} jobPostId={id} applications={enriched} />
          </div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}
