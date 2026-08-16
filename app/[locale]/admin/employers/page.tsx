/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { AdminEmployersTable } from "@/components/admin/AdminEmployersTable";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminEmployersPage({ params }: Props) {
  const { locale } = await params;
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });

  let { data: employers, error } = await supabase
    .from("employer_profiles")
    .select(
      "id,company_name,registry_code,contact_email,company_verified,verification_status,verification_source,verified_at,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    const fallback = await supabase
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

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell
          title={t("employersTitle")}
          subtitle={t("employersSubtitle")}
          maxWidthClassName="max-w-3xl"
        >
          <AdminEmployersTable employers={(employers ?? []) as any} />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}
