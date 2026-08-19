"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ACCOUNT_DELETE_CONFIRM_WORD } from "@/lib/account/privacyCategories";
import { Button } from "@/components/ui/button";
import { errorMessageFromUnknown } from "@/lib/utils";

type Row = {
  id: string;
  email: string | null;
  role: string | null;
  created_at?: string | null;
  is_blocked: boolean;
  has_seeker_profile: boolean;
  seeker_visible: boolean;
  seeker_complete: boolean;
  has_employer_profile: boolean;
};

function fmtDate(iso: string | null | undefined) {
  const s = (iso ?? "").trim();
  return s.length >= 10 ? s.slice(0, 10) : s || "—";
}

export function AdminUsersTable({
  actorId,
  users,
}: {
  locale: string;
  actorId: string;
  users: Row[];
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setBlocked(userId: string, blocked: boolean) {
    setBusyId(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queue: "blocked_users",
          action: blocked ? "block" : "restore",
          targetId: userId,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || t("unknownError"));
      }
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(row: Row) {
    const email = row.email?.trim() || row.id;
    const first = window.confirm(t("deleteUserConfirm1", { email }));
    if (!first) return;
    const second = window.confirm(t("deleteUserConfirm2", { email }));
    if (!second) return;

    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: row.id,
          confirmWord: ACCOUNT_DELETE_CONFIRM_WORD,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        if (json.error === "cannot_delete_self") throw new Error(t("deleteUserErrSelf"));
        if (json.error === "cannot_delete_admin") throw new Error(t("deleteUserErrAdmin"));
        if (json.error === "missing_service_role_key") throw new Error(t("deleteUserErrConfig"));
        if (json.error === "user_not_found") throw new Error(t("deleteUserErrMissing"));
        if (json.error === "mfa_required") throw new Error(t("deleteUserErrMfa"));
        throw new Error(json.message || t("unknownError"));
      }
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  if (!users.length) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 text-sm text-white/70">
        {t("noUsers")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-white/[0.10]">
        <div className="grid grid-cols-[1.1fr_0.45fr_0.7fr_0.85fr] gap-3 border-b border-white/[0.10] bg-white/[0.03] px-4 py-3 text-xs font-medium tracking-wide text-white/60">
          <div>{t("colEmail")}</div>
          <div>{t("colRole")}</div>
          <div>{t("colProfiles")}</div>
          <div className="text-right">{t("colActions")}</div>
        </div>

        {users.map((u) => {
          const canDelete = u.id !== actorId && u.role !== "admin";
          return (
            <div
              key={u.id}
              className="grid grid-cols-[1.1fr_0.45fr_0.7fr_0.85fr] gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/75 last:border-b-0"
            >
              <div className="min-w-0 truncate">{u.email ?? "—"}</div>
              <div className="text-xs text-white/65">{u.role ?? "—"}</div>
              <div className="text-xs text-white/60">
                <div>{u.has_seeker_profile ? t("hasSeeker") : t("noSeeker")}</div>
                <div>{u.has_employer_profile ? t("hasEmployer") : t("noEmployer")}</div>
                {u.has_seeker_profile ? (
                  <div>
                    {u.seeker_visible ? t("seekerVisible") : t("seekerHidden")} ·{" "}
                    {u.seeker_complete ? t("seekerComplete") : t("seekerIncomplete")}
                  </div>
                ) : null}
                <div>{u.is_blocked ? t("blocked") : t("active")}</div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant={u.is_blocked ? "outline" : "ghost"}
                  size="sm"
                  className="h-9 rounded-xl px-3 text-[13px]"
                  onClick={() => void setBlocked(u.id, !u.is_blocked)}
                  disabled={busyId === u.id}
                >
                  {u.is_blocked ? t("unblock") : t("block")}
                </Button>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl border-red-500/30 bg-red-500/10 px-3 text-[13px] text-red-100 hover:bg-red-500/15"
                    onClick={() => void deleteUser(u)}
                    disabled={busyId === u.id}
                  >
                    {t("delete")}
                  </Button>
                ) : null}
                <div className="hidden text-right text-xs text-white/50 sm:block">{fmtDate(u.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
