/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

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
    .select("id,job_post_id,created_at,updated_at,status_updated_at,status,shared_profile")
    .eq("seeker_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  let applicationRows = applications;
  let applicationErr = error;
  if (applicationErr && /status_updated_at/i.test(applicationErr.message ?? "")) {
    const fallback = await supabase
      .from("job_applications")
      .select("id,job_post_id,created_at,updated_at,status,shared_profile")
      .eq("seeker_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    applicationRows = fallback.data;
    applicationErr = fallback.error;
  }
  if (applicationErr) throw applicationErr;

  return (
    <AuthShell
          title={tNav("seekerApplications")}
          subtitle={tNav("seekerAreaSubtitle")}
          maxWidthClassName="max-w-3xl"
        >
          <SeekerApplicationsList locale={locale} applications={(applicationRows ?? []) as any[]} />
          <div className="mt-8 text-xs text-white/40">{tJobs("seekerApplicationsPrivacyNote")}</div>
        </AuthShell>
  );
}

