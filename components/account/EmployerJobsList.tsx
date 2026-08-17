/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "@/i18n/routing";
import { errorMessageFromUnknown } from "@/lib/utils";

type Job = {
  id: string;
  title: string;
  status: string;
  created_at?: string;
};

type Props = {
  locale: string;
  initialJobs: Job[];
};

export function EmployerJobsList({ locale, initialJobs }: Props) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteJob(jobId: string, title: string) {
    const ok = window.confirm(t("deleteJobConfirm", { title: title || "—" }));
    if (!ok) return;

    setBusyId(jobId);
    setError(null);
    try {
      const { error } = await supabase.from("job_posts").delete().eq("id", jobId);
      if (error) throw error;

      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  async function setStatus(jobId: string, status: "draft" | "published" | "archived") {
    setBusyId(jobId);
    setError(null);
    try {
      const updates: Record<string, unknown> = { status };
      if (status === "published") {
        updates.published_at = new Date().toISOString();
      }
      // Keep published_at when archiving (inactive) so history remains.

      const { error } = await supabase.from("job_posts").update(updates).eq("id", jobId);
      if (error) throw error;

      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  if (!jobs.length) {
    return (
      <EmptyState
        icon={Briefcase}
        title={t("noJobsYet")}
        actions={
          <Button asChild variant="primary" size="sm">
            <Link href="/account/employer/jobs/new">{t("createOne")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex flex-col gap-3 rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white/85">{job.title}</div>
            <div className="mt-1 text-xs text-white/55">
              {t("statusLabel")}:{" "}
              <span className="text-white/75">{t(`status_${job.status}` as any)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button asChild variant="outline" size="sm" className="h-11 w-full rounded-xl px-3 text-[13px] sm:h-9 sm:w-auto">
              <Link href={`/account/employer/jobs/${job.id}/edit`}>{t("edit")}</Link>
            </Button>

            <Button asChild variant="outline" size="sm" className="h-11 w-full rounded-xl px-3 text-[13px] sm:h-9 sm:w-auto">
              <Link href={`/account/employer/jobs/${job.id}/applicants`}>{t("applicants")}</Link>
            </Button>

            {job.status !== "published" ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="h-11 w-full rounded-xl px-3 text-[13px] sm:h-9 sm:w-auto"
                onClick={() => void setStatus(job.id, "published")}
                disabled={busyId === job.id}
              >
                {t("publish")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 w-full rounded-xl px-3 text-[13px] sm:h-9 sm:w-auto"
                onClick={() => void setStatus(job.id, "draft")}
                disabled={busyId === job.id}
              >
                {t("unpublish")}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11 w-full rounded-xl px-3 text-[13px] sm:h-9 sm:w-auto"
              onClick={() => void setStatus(job.id, "archived")}
              disabled={busyId === job.id}
            >
              {t("archive")}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 w-full rounded-xl border-red-500/45 bg-red-500/[0.12] px-3 text-[13px] text-red-100 hover:bg-red-500/25 hover:text-white sm:h-9 sm:w-auto"
              onClick={() => void deleteJob(job.id, job.title)}
              disabled={busyId === job.id}
            >
              {t("deleteJob")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

