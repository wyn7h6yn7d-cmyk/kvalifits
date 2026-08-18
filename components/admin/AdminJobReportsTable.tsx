"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";

import {
  isJobPostReportReason,
  JOB_POST_REPORT_STATUS_VALUES,
  type JobPostReportReason,
  type JobPostReportStatus,
} from "@/lib/jobs/jobPostReport";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { errorMessageFromUnknown } from "@/lib/utils";

export type AdminJobReportRow = {
  id: string;
  job_post_id: string;
  reason: JobPostReportReason | string;
  details: string | null;
  status: JobPostReportStatus | string;
  admin_notes: string;
  created_at: string;
  job_title?: string;
  employer_name?: string;
};

export function AdminJobReportsTable({ reports }: { reports: AdminJobReportRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(reports.map((r) => [r.id, r.admin_notes ?? ""]))
  );
  const [statusDraft, setStatusDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(reports.map((r) => [r.id, r.status]))
  );

  async function save(reportId: string) {
    setBusyId(reportId);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const status = (statusDraft[reportId] ?? "open") as JobPostReportStatus;
      const admin_notes = (notesDraft[reportId] ?? "").slice(0, 8000);
      const updates: Record<string, unknown> = {
        status,
        admin_notes,
        updated_at: new Date().toISOString(),
      };
      if (status === "resolved" || status === "dismissed" || status === "reviewing") {
        updates.reviewed_at = new Date().toISOString();
        updates.reviewed_by = user?.id ?? null;
      }
      const { error: updErr } = await supabase
        .from("job_post_reports")
        .update(updates)
        .eq("id", reportId);
      if (updErr) throw updErr;
      const { tryWriteAdminAuditLog, ADMIN_AUDIT_ACTIONS } = await import("@/lib/admin/auditLog");
      await tryWriteAdminAuditLog(supabase, {
        actorId: user?.id,
        action: ADMIN_AUDIT_ACTIONS.reportUpdate,
        targetType: "job_post_report",
        targetId: reportId,
        details: { status, admin_notes },
      });
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  if (!reports.length) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 text-sm text-white/70">
        {t("noReports")}
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

      {reports.map((r) => (
        <div
          key={r.id}
          className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-white/88">
                {r.job_title ?? r.job_post_id}
              </div>
              <div className="mt-1 text-xs text-white/55">
                {r.employer_name ?? "—"} ·{" "}
                <Link href={`/tood/${r.job_post_id}`} className="underline-offset-2 hover:underline">
                  {t("reportsOpenJob")}
                </Link>
              </div>
            </div>
            <div className="text-xs tabular-nums text-white/45">
              {new Date(r.created_at).toLocaleString()}
            </div>
          </div>

          <div className="mt-3 text-sm text-white/80">
            <span className="text-white/50">{t("colReason")}: </span>
            {isJobPostReportReason(r.reason)
              ? t(`reportReason.${r.reason}`)
              : r.reason}
          </div>
          {(r.details ?? "").trim() ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
              {r.details}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-wide text-white/55" htmlFor={`status-${r.id}`}>
                {t("colStatus")}
              </label>
              <select
                id={`status-${r.id}`}
                value={statusDraft[r.id] ?? r.status}
                onChange={(e) =>
                  setStatusDraft((prev) => ({ ...prev, [r.id]: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-3 py-2.5 text-sm text-white/85 outline-none"
              >
                {JOB_POST_REPORT_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {t(`reportStatus.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium tracking-wide text-white/55" htmlFor={`notes-${r.id}`}>
                {t("colAdminNotes")}
              </label>
              <textarea
                id={`notes-${r.id}`}
                value={notesDraft[r.id] ?? ""}
                onChange={(e) =>
                  setNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value.slice(0, 8000) }))
                }
                rows={3}
                className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-3 py-2.5 text-sm text-white/85 outline-none"
                placeholder={t("adminNotesPlaceholder")}
              />
              <p className="text-[11px] text-white/40">{t("adminNotesPrivateHint")}</p>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              className="h-11 w-full rounded-xl px-4 text-[13px] sm:h-9 sm:w-auto"
              disabled={busyId === r.id}
              onClick={() => void save(r.id)}
            >
              {busyId === r.id ? t("saving") : t("saveReport")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
