/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { AdminJobsTable } from "@/components/admin/AdminJobsTable";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminJobsPage({ params }: Props) {
  const { locale } = await params;
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });

  const { data: jobs } = await supabase
    .from("job_posts")
    .select("id,title,status,location,created_at,updated_at,employer_profile_id,created_by")
    .order("created_at", { ascending: false })
    .limit(200);

  const employerIds = Array.from(
    new Set((jobs ?? []).map((j) => (j as { employer_profile_id?: string | null }).employer_profile_id).filter(Boolean))
  ) as string[];

  const { data: employers } = employerIds.length
    ? await supabase.from("employer_profiles").select("id,company_name").in("id", employerIds)
    : { data: [] as { id: string; company_name: string | null }[] };

  const employerNameById = new Map((employers ?? []).map((e) => [e.id, e.company_name ?? "—"]));

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("jobsTitle")} subtitle={t("jobsSubtitle")} maxWidthClassName="max-w-5xl">
          <AdminJobsTable
            locale={locale}
            jobs={(jobs ?? []).map((j) => ({
              ...(j as any),
              employer_name: employerNameById.get((j as any).employer_profile_id) ?? "—",
            }))}
          />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

