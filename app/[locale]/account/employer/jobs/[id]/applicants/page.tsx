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
    .select("id,seeker_user_id,created_at,status,match_score,match_breakdown,shared_profile")
    .eq("job_post_id", id)
    .neq("status", "withdrawn")
    .limit(200);
  if (appErr) throw appErr;

  const apps = applications ?? [];
  const seekerIds = [...new Set(apps.map((a) => a.seeker_user_id).filter(Boolean))] as string[];
  const liveCvBySeeker = new Map<string, string>();
  if (seekerIds.length) {
    const { data: profiles } = await supabase.from("seeker_profiles").select("user_id,cv_url").in("user_id", seekerIds);
    for (const p of profiles ?? []) {
      const u = safeHttpUrl((p as { cv_url?: string | null }).cv_url);
      if (u) liveCvBySeeker.set((p as { user_id: string }).user_id, u);
    }
  }

  const enriched = apps.map((a) => {
    const seeker = (a.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
    const fromSnap = safeHttpUrl(seeker.cv_url);
    const fromLive = a.seeker_user_id ? liveCvBySeeker.get(a.seeker_user_id) : undefined;
    return {
      ...a,
      resolved_cv_url: fromSnap ?? fromLive ?? null,
    };
  });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("applicantsTitle")} subtitle={tNav("employerAreaSubtitle")} maxWidthClassName="max-w-3xl">
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
