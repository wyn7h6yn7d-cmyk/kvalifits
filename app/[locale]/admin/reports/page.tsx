/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { AdminJobReportsTable } from "@/components/admin/AdminJobReportsTable";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminJobReportsPage({ params }: Props) {
  const { locale } = await params;
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });

  const { data: reports } = await supabase
    .from("job_post_reports")
    .select("id,job_post_id,reason,details,status,admin_notes,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const jobIds = Array.from(
    new Set((reports ?? []).map((r) => (r as { job_post_id: string }).job_post_id).filter(Boolean))
  );

  const { data: jobs } = jobIds.length
    ? await supabase.from("job_posts").select("id,title,employer_profile_id").in("id", jobIds)
    : { data: [] as { id: string; title: string | null; employer_profile_id: string | null }[] };

  const employerIds = Array.from(
    new Set((jobs ?? []).map((j) => j.employer_profile_id).filter(Boolean))
  ) as string[];

  const { data: employers } = employerIds.length
    ? await supabase.from("employer_profiles").select("id,company_name").in("id", employerIds)
    : { data: [] as { id: string; company_name: string | null }[] };

  const employerNameById = new Map((employers ?? []).map((e) => [e.id, e.company_name ?? "—"]));
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

  return (
    <AdminShell title={t("reportsTitle")} subtitle={t("reportsSubtitle")} maxWidthClassName="max-w-3xl">
      <AdminJobReportsTable
        reports={(reports ?? []).map((r) => {
          const meta = jobMetaById.get((r as any).job_post_id);
          return {
            ...(r as any),
            job_title: meta?.title,
            employer_name: meta?.employer_name,
          };
        })}
      />
    </AdminShell>
  );
}
