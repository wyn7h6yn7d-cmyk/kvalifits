"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ACCOUNT_DELETE_CONFIRM_WORD } from "@/lib/account/privacyCategories";
import {
  EMPLOYER_COMPANY_VERIFICATION_STATUS_VALUES,
  isEmployerCompanyVerificationStatus,
  parseEmployerCompanyVerificationStatus,
  type EmployerCompanyVerificationStatus,
} from "@/lib/employer/companyVerification";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { CompanyVerificationBadge } from "@/components/employer/CompanyVerificationBadge";
import { errorMessageFromUnknown } from "@/lib/utils";

export type AdminEmployerRow = {
  id: string;
  company_name: string | null;
  registry_code: string | null;
  contact_email: string | null;
  company_verified: boolean | null;
  verification_status: string | null;
  verification_source: string | null;
  verified_at: string | null;
  created_at?: string | null;
  job_count?: number;
};

export function AdminEmployersTable({ employers }: { employers: AdminEmployerRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<Record<string, EmployerCompanyVerificationStatus>>(() =>
    Object.fromEntries(
      employers.map((e) => [e.id, parseEmployerCompanyVerificationStatus(e.verification_status)])
    ) as Record<string, EmployerCompanyVerificationStatus>
  );

  async function save(employerId: string) {
    setBusyId(employerId);
    setError(null);
    try {
      const status = statusDraft[employerId] ?? "unverified";
      if (!isEmployerCompanyVerificationStatus(status)) {
        throw new Error(t("unknownError"));
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: updErr } = await supabase
        .from("employer_profiles")
        .update({
          verification_status: status,
          // Trigger sets company_verified / verified_at / verification_source for admins.
          company_verified: status === "verified",
          verification_source: status === "verified" ? "manual" : null,
          verified_at: status === "verified" ? new Date().toISOString() : null,
        })
        .eq("id", employerId);
      if (updErr) throw updErr;
      const { tryWriteAdminAuditLog, ADMIN_AUDIT_ACTIONS } = await import("@/lib/admin/auditLog");
      await tryWriteAdminAuditLog(supabase, {
        actorId: user?.id,
        action:
          status === "verified"
            ? ADMIN_AUDIT_ACTIONS.employerApprove
            : ADMIN_AUDIT_ACTIONS.employerUpdate,
        targetType: "employer",
        targetId: employerId,
        details: { verification_status: status },
      });
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteEmployer(row: AdminEmployerRow) {
    const name = (row.company_name ?? "").toString().trim() || row.id;
    if (!window.confirm(t("deleteEmployerConfirm1", { name }))) return;
    if (!window.confirm(t("deleteEmployerConfirm2", { name }))) return;

    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/employers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerId: row.id,
          confirmWord: ACCOUNT_DELETE_CONFIRM_WORD,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        if (json.error === "missing_service_role_key") throw new Error(t("deleteUserErrConfig"));
        if (json.error === "mfa_required") throw new Error(t("deleteUserErrMfa"));
        if (json.error === "employer_not_found") throw new Error(t("deleteEmployerErrMissing"));
        throw new Error(json.message || t("unknownError"));
      }
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  if (!employers.length) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 text-sm text-white/70">
        {t("noEmployers")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-white/50">{t("employersVerificationHint")}</p>

      {employers.map((e) => {
        const name = (e.company_name ?? "").toString().trim() || "—";
        return (
          <div
            key={e.id}
            className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-4 sm:p-5"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-white/88">{name}</div>
              <div className="mt-2">
                <CompanyVerificationBadge
                  status={parseEmployerCompanyVerificationStatus(e.verification_status)}
                  statusLine={t(
                    `companyVerificationStatus.${parseEmployerCompanyVerificationStatus(e.verification_status)}`,
                  )}
                />
              </div>
              <div className="mt-1 text-xs text-white/55">
                {(e.registry_code ?? "").toString().trim() || "—"}
                {e.contact_email ? ` · ${e.contact_email}` : ""}
                {typeof e.job_count === "number" ? ` · ${t("jobsCount", { count: e.job_count })}` : ""}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label
                  className="text-xs font-medium tracking-wide text-white/55"
                  htmlFor={`company-status-${e.id}`}
                >
                  {t("colVerification")}
                </label>
                <select
                  id={`company-status-${e.id}`}
                  value={statusDraft[e.id] ?? "unverified"}
                  onChange={(ev) =>
                    setStatusDraft((prev) => ({
                      ...prev,
                      [e.id]: ev.target.value as EmployerCompanyVerificationStatus,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-3 py-2.5 text-sm text-white/85 outline-none"
                >
                  {EMPLOYER_COMPANY_VERIFICATION_STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {t(`companyVerificationStatus.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-10 rounded-xl px-4 text-[13px]"
                  disabled={busyId === e.id}
                  onClick={() => void save(e.id)}
                >
                  {busyId === e.id ? t("saving") : t("saveVerification")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-red-500/30 bg-red-500/10 px-4 text-[13px] text-red-100 hover:bg-red-500/15"
                  disabled={busyId === e.id}
                  onClick={() => void deleteEmployer(e)}
                >
                  {t("delete")}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
