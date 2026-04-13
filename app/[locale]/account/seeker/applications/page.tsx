import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { SeekerApplicationsList } from "@/components/account/SeekerApplicationsList";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export default async function SeekerApplicationsPage({ params }: Props) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role } = await getRoleAndNextPath(locale);
  if (role !== "seeker") redirect(`/${locale}/account`);

  const { data: applications, error } = await supabase
    .from("job_applications")
    .select("id,job_post_id,created_at,status,match_score,shared_profile")
    .eq("seeker_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell
          title={tNav("seekerApplications")}
          subtitle={tNav("seekerAreaSubtitle")}
          maxWidthClassName="max-w-3xl"
        >
          <SeekerApplicationsList locale={locale} applications={(applications ?? []) as any[]} />
          <div className="mt-8 text-xs text-white/40">{tJobs("seekerApplicationsPrivacyNote")}</div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

