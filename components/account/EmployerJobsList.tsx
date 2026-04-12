"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

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

  async function setStatus(jobId: string, status: "draft" | "published" | "archived") {
    setBusyId(jobId);
    setError(null);
    try {
      const updates: Record<string, unknown> = { status };
      if (status === "published") updates.published_at = new Date().toISOString();
      if (status !== "published") updates.published_at = null;

      const { error } = await supabase.from("job_posts").update(updates).eq("id", jobId);
      if (error) throw error;

      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setBusyId(null);
    }
  }

  if (!jobs.length) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 text-sm text-white/70">
        {t("noJobsYet")}{" "}
        <Link href="/account/employer/jobs/new" className="text-white/80 underline hover:text-white">
          {t("createOne")}
        </Link>
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

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-3 text-[13px]">
              <Link href={`/account/employer/jobs/${job.id}/edit`}>{t("edit")}</Link>
            </Button>

            <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-3 text-[13px]">
              <Link href={`/account/employer/jobs/${job.id}/applicants`}>{t("applicants")}</Link>
            </Button>

            {job.status !== "published" ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="h-9 rounded-xl px-3 text-[13px]"
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
                className="h-9 rounded-xl px-3 text-[13px]"
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
              className="h-9 rounded-xl px-3 text-[13px]"
              onClick={() => void setStatus(job.id, "archived")}
              disabled={busyId === job.id}
            >
              {t("archive")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

