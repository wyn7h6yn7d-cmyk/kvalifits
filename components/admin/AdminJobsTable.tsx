"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

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

export function AdminJobsTable({ locale, jobs }: { locale: string; jobs: JobRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

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

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteJob(jobId: string) {
    setBusyId(jobId);
    setError(null);
    try {
      const { error } = await supabase.from("job_posts").delete().eq("id", jobId);
      if (error) throw error;
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
        {t("noJobs")}
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
        <div className="grid grid-cols-[1.3fr_0.9fr_0.6fr_0.9fr] gap-3 border-b border-white/[0.10] bg-white/[0.03] px-4 py-3 text-xs font-medium tracking-wide text-white/60">
          <div>{t("colJob")}</div>
          <div className="hidden sm:block">{t("colCompany")}</div>
          <div>{t("colStatus")}</div>
          <div className="text-right">{t("colActions")}</div>
        </div>

        {jobs.map((j) => (
          <div
            key={j.id}
            className="grid grid-cols-[1.3fr_0.9fr_0.6fr_0.9fr] gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3 last:border-b-0"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white/85">{j.title}</div>
              <div className="mt-1 text-xs text-white/55">
                {(j.location ?? "").trim() ? j.location : "—"}
              </div>
            </div>

            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-sm text-white/75">{j.employer_name ?? "—"}</div>
            </div>

            <div className="text-sm text-white/75">{j.status}</div>

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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-red-500/30 bg-red-500/10 px-3 text-[13px] text-red-100 hover:bg-red-500/15"
                onClick={() => void deleteJob(j.id)}
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

