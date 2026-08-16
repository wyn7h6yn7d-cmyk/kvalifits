/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { AdminModerationPanel } from "@/components/admin/AdminModerationPanel";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminModerationPage({ params }: Props) {
  const { locale } = await params;
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const admin = createSupabaseAdminClient();
  const db = admin ?? supabase;

  const { data: reportRows } = await supabase
    .from("job_post_reports")
    .select("id,job_post_id,reason,details,status,created_at")
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: false })
    .limit(100);

  const jobIds = Array.from(
    new Set((reportRows ?? []).map((r) => (r as any).job_post_id).filter(Boolean))
  ) as string[];

  const { data: jobs } = jobIds.length
    ? await supabase.from("job_posts").select("id,title,employer_profile_id").in("id", jobIds)
    : { data: [] as { id: string; title: string | null; employer_profile_id: string | null }[] };

  const employerIdsFromJobs = Array.from(
    new Set((jobs ?? []).map((j) => j.employer_profile_id).filter(Boolean))
  ) as string[];

  const { data: employersFromJobs } = employerIdsFromJobs.length
    ? await supabase
        .from("employer_profiles")
        .select("id,company_name")
        .in("id", employerIdsFromJobs)
    : { data: [] as { id: string; company_name: string | null }[] };

  const employerNameById = new Map(
    (employersFromJobs ?? []).map((e) => [e.id, e.company_name ?? "—"])
  );
  const jobMetaById = new Map(
    (jobs ?? []).map((j) => [
      j.id,
      {
        title: (j.title ?? "").toString().trim() || j.id,
        employer_name: j.employer_profile_id
          ? employerNameById.get(j.employer_profile_id) ?? "—"
          : "—",
      },
    ])
  );

  let certificates: any[] = [];
  {
    const q = await db
      .from("seeker_certificates")
      .select(
        "id,user_id,certificate_name,certificate_issuer,verification_status,created_at"
      )
      .in("verification_status", ["submitted", "under_review"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (!q.error) certificates = q.data ?? [];
  }

  const certUserIds = Array.from(
    new Set(certificates.map((c) => c.user_id).filter(Boolean))
  ) as string[];

  const { data: certProfiles } = certUserIds.length
    ? await db.from("profiles").select("id,email").in("id", certUserIds)
    : { data: [] as { id: string; email: string | null }[] };
  const emailById = new Map((certProfiles ?? []).map((p) => [p.id, p.email]));

  let companies: any[] = [];
  {
    // When verification columns are not migrated yet, keep the queue empty
    // (do not fake under_review — approve would fail with missing columns).
    const q = await supabase
      .from("employer_profiles")
      .select(
        "id,company_name,registry_code,contact_email,verification_status,created_at"
      )
      .eq("verification_status", "under_review")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!q.error) companies = q.data ?? [];
  }

  let blockedUsers: any[] = [];
  {
    const q = await db
      .from("profiles")
      .select("id,email,role,created_at,is_blocked")
      .eq("is_blocked", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!q.error) blockedUsers = q.data ?? [];
  }

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell
          title={t("moderationTitle")}
          subtitle={t("moderationSubtitle")}
          maxWidthClassName="max-w-3xl"
        >
          <AdminModerationPanel
            reports={(reportRows ?? []).map((r) => {
              const meta = jobMetaById.get((r as any).job_post_id);
              return {
                ...(r as any),
                job_title: meta?.title,
                employer_name: meta?.employer_name,
              };
            })}
            certificates={certificates.map((c) => ({
              ...c,
              owner_email: emailById.get(c.user_id) ?? null,
            }))}
            companies={companies}
            blockedUsers={blockedUsers}
          />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}
