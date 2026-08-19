import { getTranslations } from "next-intl/server";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parsePaginationParams } from "@/lib/pagination/serverPagination";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

type ProfileRow = {
  id: string;
  email: string | null;
  role: string | null;
  created_at: string | null;
  is_blocked: boolean | null;
};

type SeekerRow = { user_id: string; profile_visible: boolean | null; is_complete: boolean | null };
type EmployerRow = { owner_user_id: string };

export default async function AdminUsersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const pagination = parsePaginationParams(sp, 30);
  const t = await getTranslations({ locale, namespace: "admin" });
  const { supabase, user } = await requireAdmin(locale);

  const admin = createSupabaseAdminClient();
  const isUsingAdmin = Boolean(admin);

  let ids: string[] = [];
  const emailById = new Map<string, string>();
  const createdById = new Map<string, string>();
  const metaRoleById = new Map<string, string>();

  if (admin) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagination.page, perPage: pagination.pageSize });
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
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    const { data: fallbackProfiles } = await supabase
      .from("profiles")
      .select("id,email,role,created_at,is_blocked")
      .order("created_at", { ascending: false })
      .range(from, to);
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
    <AdminShell title={t("usersTitle")} subtitle={t("usersSubtitle")}>
      {!isUsingAdmin ? (
        <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-[12.5px] leading-relaxed text-white/70">
          <div className="font-semibold text-white/85">{t("limitedViewTitle")}</div>
          <div className="mt-1">{t("limitedViewBody")}</div>
        </div>
      ) : null}
      <div className="mb-4 flex items-center justify-between text-sm">
        {pagination.page > 1 ? (
          <a href={`/${locale}/admin/users?page=${pagination.page - 1}`} className="text-white/70 hover:text-white">← {t("paginationPrev")}</a>
        ) : <span />}
        <span className="text-white/50 tabular-nums">{t("paginationStatus", { page: pagination.page, totalPages: "?", totalCount: ids.length })}</span>
        {ids.length >= pagination.pageSize ? (
          <a href={`/${locale}/admin/users?page=${pagination.page + 1}`} className="text-white/70 hover:text-white">{t("paginationNext")} →</a>
        ) : <span />}
      </div>
      <AdminUsersTable
            locale={locale}
            actorId={user.id}
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
    </AdminShell>
  );
}

