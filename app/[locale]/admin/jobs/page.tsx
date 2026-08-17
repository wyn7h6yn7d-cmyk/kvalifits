/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { AdminJobsTable } from "@/components/admin/AdminJobsTable";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminJobsPage({ params }: Props) {
  const { locale } = await params;
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const db = createSupabaseAdminClient() ?? supabase;

  const { data: jobs } = await db
    .from("job_posts")
    .select("id,title,status,location,created_at,updated_at,employer_profile_id")
    .order("created_at", { ascending: false })
    .limit(200);

  const employerIds = Array.from(
    new Set((jobs ?? []).map((j) => (j as { employer_profile_id?: string | null }).employer_profile_id).filter(Boolean))
  ) as string[];

  const { data: employers } = employerIds.length
    ? await db.from("employer_profiles").select("id,company_name").in("id", employerIds)
    : { data: [] as { id: string; company_name: string | null }[] };

  const employerNameById = new Map((employers ?? []).map((e) => [e.id, e.company_name ?? "—"]));

  return (
    <AdminShell title={t("jobsTitle")} subtitle={t("jobsSubtitle")}>
      <AdminJobsTable
        jobs={(jobs ?? []).map((j) => ({
          ...(j as any),
          employer_name: employerNameById.get((j as any).employer_profile_id) ?? "—",
        }))}
      />
    </AdminShell>
  );
}
