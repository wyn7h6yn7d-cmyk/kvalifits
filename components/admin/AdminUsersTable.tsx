"use client";

import { useTranslations } from "next-intl";

type Row = {
  id: string;
  email: string | null;
  role: string | null;
  created_at?: string | null;
  has_seeker_profile: boolean;
  seeker_visible: boolean;
  seeker_complete: boolean;
  has_employer_profile: boolean;
};

function fmtDate(iso: string | null | undefined) {
  const s = (iso ?? "").trim();
  return s.length >= 10 ? s.slice(0, 10) : s || "—";
}

export function AdminUsersTable({ users }: { locale: string; users: Row[] }) {
  const t = useTranslations("admin");

  if (!users.length) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 text-sm text-white/70">
        {t("noUsers")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.10]">
      <div className="grid grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr] gap-3 border-b border-white/[0.10] bg-white/[0.03] px-4 py-3 text-xs font-medium tracking-wide text-white/60">
        <div>{t("colEmail")}</div>
        <div>{t("colRole")}</div>
        <div>{t("colProfiles")}</div>
        <div>{t("colCreated")}</div>
      </div>

      {users.map((u) => (
        <div
          key={u.id}
          className="grid grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr] gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/75 last:border-b-0"
        >
          <div className="min-w-0 truncate">{u.email ?? "—"}</div>
          <div>{u.role ?? "—"}</div>
          <div className="text-xs text-white/60">
            <div>{u.has_seeker_profile ? t("hasSeeker") : t("noSeeker")}</div>
            <div>{u.has_employer_profile ? t("hasEmployer") : t("noEmployer")}</div>
            {u.has_seeker_profile ? (
              <div>
                {u.seeker_visible ? t("seekerVisible") : t("seekerHidden")} ·{" "}
                {u.seeker_complete ? t("seekerComplete") : t("seekerIncomplete")}
              </div>
            ) : null}
          </div>
          <div className="text-xs text-white/60">{fmtDate(u.created_at)}</div>
        </div>
      ))}
    </div>
  );
}

