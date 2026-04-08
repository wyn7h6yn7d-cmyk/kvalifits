import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  const ids = (profiles ?? []).map((p) => p.id);

  const { data: seekerRows } = ids.length
    ? await supabase.from("seeker_profiles").select("user_id,profile_visible,is_complete").in("user_id", ids)
    : { data: [] as any[] };

  const { data: employerRows } = ids.length
    ? await supabase.from("employer_profiles").select("owner_user_id").in("owner_user_id", ids)
    : { data: [] as any[] };

  const seekerById = new Map((seekerRows ?? []).map((r) => [r.user_id, r]));
  const employerById = new Map((employerRows ?? []).map((r) => [r.owner_user_id, true]));

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("usersTitle")} subtitle={t("usersSubtitle")} maxWidthClassName="max-w-5xl">
          <AdminUsersTable
            locale={locale}
            users={(profiles ?? []).map((p: any) => ({
              id: p.id,
              email: p.email ?? null,
              role: p.role ?? null,
              created_at: p.created_at ?? null,
              is_blocked: Boolean(p.is_blocked),
              has_seeker_profile: Boolean(seekerById.get(p.id)),
              seeker_visible: Boolean(seekerById.get(p.id)?.profile_visible),
              seeker_complete: Boolean(seekerById.get(p.id)?.is_complete),
              has_employer_profile: Boolean(employerById.get(p.id)),
            }))}
          />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

