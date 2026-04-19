import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

type Props = { params: Promise<{ locale: string }> };

type ProfileRow = {
  id: string;
  email: string | null;
  role: string | null;
  created_at: string | null;
  is_blocked: boolean | null;
};

type SeekerRow = { user_id: string; profile_visible: boolean | null; is_complete: boolean | null };
type EmployerRow = { owner_user_id: string };

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  const { supabase } = await requireAdmin(locale);

  const admin = createSupabaseAdminClient();
  const isUsingAdmin = Boolean(admin);

  let ids: string[] = [];
  const emailById = new Map<string, string>();
  const createdById = new Map<string, string>();
  const metaRoleById = new Map<string, string>();

  if (admin) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 300 });
    if (error) throw error;
    for (const u of data.users) {
      ids.push(u.id);
      if (u.email) emailById.set(u.id, u.email);
      if (u.created_at) createdById.set(u.id, u.created_at);
      const mr = (u.user_metadata as Record<string, unknown> | null | undefined)?.role;
      if (typeof mr === "string" && mr.trim()) metaRoleById.set(u.id, mr.trim());
    }
  } else {
    // Fallback: without service-role we can't list auth users, so use profiles table (RLS applies).
    const { data: fallbackProfiles } = await supabase
      .from("profiles")
      .select("id,email,role,created_at,is_blocked")
      .order("created_at", { ascending: false })
      .limit(300);
    ids = (fallbackProfiles ?? []).map((p) => p.id);
    for (const p of fallbackProfiles ?? []) {
      if (p.email) emailById.set(p.id, p.email);
      if (p.created_at) createdById.set(p.id, p.created_at);
      if (p.role) metaRoleById.set(p.id, p.role);
    }
  }

  const { data: profiles } = ids.length
    ? await (admin ?? supabase)
        .from("profiles")
        .select("id,email,role,created_at,is_blocked")
        .in("id", ids)
    : { data: [] as ProfileRow[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: seekerRows } = ids.length
    ? await (admin ?? supabase)
        .from("seeker_profiles")
        .select("user_id,profile_visible,is_complete")
        .in("user_id", ids)
    : { data: [] as SeekerRow[] };

  const { data: employerRows } = ids.length
    ? await (admin ?? supabase).from("employer_profiles").select("owner_user_id").in("owner_user_id", ids)
    : { data: [] as EmployerRow[] };

  const seekerById = new Map((seekerRows ?? []).map((r) => [r.user_id, r]));
  const employerById = new Map((employerRows ?? []).map((r) => [r.owner_user_id, true]));

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("usersTitle")} subtitle={t("usersSubtitle")} maxWidthClassName="max-w-5xl">
          {!isUsingAdmin ? (
            <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-[12.5px] leading-relaxed text-white/70">
              <div className="font-semibold text-white/85">Admin vaade on piiratud.</div>
              <div className="mt-1">
                Täieliku kasutajate nimekirja jaoks seadista serveris{" "}
                <span className="font-mono text-white/85">SUPABASE_SERVICE_ROLE_KEY</span>. Hetkel näidatakse andmeid
                vastavalt RLS reeglitele.
              </div>
            </div>
          ) : null}
          <AdminUsersTable
            locale={locale}
            users={ids
              .slice()
              .sort((a, b) => (createdById.get(b) ?? "").localeCompare(createdById.get(a) ?? ""))
              .map((id) => {
                const p = profileById.get(id);
                const seeker = seekerById.get(id);
                const role = (p?.role ?? metaRoleById.get(id) ?? null) as string | null;
                return {
                  id,
                  email: emailById.get(id) ?? p?.email ?? null,
                  role,
                  created_at: p?.created_at ?? createdById.get(id) ?? null,
                  is_blocked: Boolean(p?.is_blocked),
                  has_seeker_profile: Boolean(seeker),
                  seeker_visible: Boolean(seeker?.profile_visible),
                  seeker_complete: Boolean(seeker?.is_complete),
                  has_employer_profile: Boolean(employerById.get(id)),
                };
              })}
          />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

