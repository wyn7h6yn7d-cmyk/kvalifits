/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { AdminEmployersTable } from "@/components/admin/AdminEmployersTable";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminEmployersPage({ params }: Props) {
  const { locale } = await params;
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const db = createSupabaseAdminClient() ?? supabase;

  let { data: employers, error } = await db
    .from("employer_profiles")
    .select(
      "id,company_name,registry_code,contact_email,company_verified,verification_status,verification_source,verified_at,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    const fallback = await db
      .from("employer_profiles")
      .select("id,company_name,registry_code,contact_email,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    employers = (fallback.data ?? []).map((e) => ({
      ...e,
      company_verified: false,
      verification_status: "unverified",
      verification_source: null,
      verified_at: null,
    })) as any;
  }

  const ids = (employers ?? []).map((e) => e.id);
  const jobCountById = new Map<string, number>();
  if (ids.length) {
    const { data: jobRows } = await db.from("job_posts").select("employer_profile_id").in("employer_profile_id", ids);
    for (const row of jobRows ?? []) {
      const id = (row as { employer_profile_id?: string | null }).employer_profile_id;
      if (!id) continue;
      jobCountById.set(id, (jobCountById.get(id) ?? 0) + 1);
    }
  }

  return (
    <AdminShell title={t("employersTitle")} subtitle={t("employersSubtitle")} maxWidthClassName="max-w-3xl">
      <AdminEmployersTable
        employers={(employers ?? []).map((e) => ({
          ...(e as any),
          job_count: jobCountById.get(e.id) ?? 0,
        }))}
      />
    </AdminShell>
  );
}
