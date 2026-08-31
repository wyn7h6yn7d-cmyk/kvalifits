"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ACCOUNT_DELETE_CONFIRM_WORD } from "@/lib/account/privacyCategories";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import {
  SITE_DARK_NOTICE,
  SITE_DARK_PANEL,
  SITE_DARK_TABLE_HEADER,
  SITE_DARK_TABLE_ROW,
} from "@/lib/site/publicPageLayout";
import { cn, errorMessageFromUnknown } from "@/lib/utils";

type JobRow = {
  id: string;
  title: string;
  status: string;
  location: string | null;
  created_at?: string;
  updated_at?: string;
  employer_profile_id?: string | null;
  employer_name?: string;
};

const JOB_STATUSES = ["draft", "published", "archived"] as const;

export function AdminJobsTable({ jobs }: { locale?: string; jobs: JobRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function statusLabel(status: string) {
    return JOB_STATUSES.includes(status as (typeof JOB_STATUSES)[number])
      ? t(`jobStatus.${status}`)
      : status;
  }

  async function setStatus(jobId: string, status: "draft" | "published" | "archived") {
    setBusyId(jobId);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const updates: Record<string, unknown> = { status };
      if (status === "published") updates.published_at = new Date().toISOString();

      const { error } = await supabase.from("job_posts").update(updates).eq("id", jobId);
      if (error) throw error;

      const { tryWriteAdminAuditLog, ADMIN_AUDIT_ACTIONS } = await import("@/lib/admin/auditLog");
      const action =
        status === "published"
          ? ADMIN_AUDIT_ACTIONS.jobPostRestore
          : status === "archived"
            ? ADMIN_AUDIT_ACTIONS.jobPostRemove
            : ADMIN_AUDIT_ACTIONS.jobPostUnpublish;
      await tryWriteAdminAuditLog(supabase, {
        actorId: user?.id,
        action,
        targetType: "job_post",
        targetId: jobId,
        details: { status },
      });

      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteJob(row: JobRow) {
    const title = row.title?.trim() || row.id;
    if (!window.confirm(t("deleteJobConfirm1", { title }))) return;
    if (!window.confirm(t("deleteJobConfirm2", { title }))) return;

    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/jobs/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: row.id,
          confirmWord: ACCOUNT_DELETE_CONFIRM_WORD,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        if (json.error === "missing_service_role_key") throw new Error(t("deleteUserErrConfig"));
        if (json.error === "mfa_required") throw new Error(t("deleteUserErrMfa"));
        if (json.error === "job_not_found") throw new Error(t("deleteJobErrMissing"));
        throw new Error(json.message || t("unknownError"));
      }
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  if (!jobs.length) {
    return (
      <div className={cn(SITE_DARK_PANEL, "p-6 text-sm text-body")}>
        {t("noJobs")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className={SITE_DARK_NOTICE}>
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-border">
        <div className={cn("grid grid-cols-[1.3fr_0.9fr_0.7fr_1fr] gap-3 px-4 py-3 text-[0.9375rem] font-medium leading-snug text-foreground", SITE_DARK_TABLE_HEADER)}>
          <div>{t("colJob")}</div>
          <div className="hidden sm:block">{t("colCompany")}</div>
          <div>{t("colStatus")}</div>
          <div className="text-right">{t("colActions")}</div>
        </div>

        {jobs.map((j) => (
          <div
            key={j.id}
            className={cn("grid grid-cols-[1.3fr_0.9fr_0.7fr_1fr] gap-3 px-4 py-3", SITE_DARK_TABLE_ROW)}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground/80">{j.title}</div>
              <div className="mt-1 text-xs text-muted-2">
                {(j.location ?? "").trim() ? j.location : "—"}
              </div>
            </div>

            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-sm text-muted">{j.employer_name ?? "—"}</div>
            </div>

            <div className="text-sm text-muted">{statusLabel(j.status)}</div>

            <div className="flex flex-wrap justify-end gap-2">
              {j.status !== "published" ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="h-9 rounded-xl px-3 text-[13px]"
                  onClick={() => void setStatus(j.id, "published")}
                  disabled={busyId === j.id}
                >
                  {t("publish")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl px-3 text-[13px]"
                  onClick={() => void setStatus(j.id, "draft")}
                  disabled={busyId === j.id}
                >
                  {t("unpublish")}
                </Button>
              )}
              {j.status !== "archived" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-xl px-3 text-[13px]"
                  onClick={() => void setStatus(j.id, "archived")}
                  disabled={busyId === j.id}
                >
                  {t("archive")}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-red-500/30 bg-red-500/10 px-3 text-[13px] text-red-100 hover:bg-red-500/15"
                onClick={() => void deleteJob(j)}
                disabled={busyId === j.id}
              >
                {t("delete")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
