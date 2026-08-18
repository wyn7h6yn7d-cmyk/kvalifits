"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  JOB_POST_REPORT_REASON_VALUES,
  type JobPostReportReason,
} from "@/lib/jobs/jobPostReport";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  jobPostId: string;
  className?: string;
  variant?: "link" | "toolbar";
};

export function JobPostReportLink({ jobPostId, className, variant = "link" }: Props) {
  const t = useTranslations("jobs");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<JobPostReportReason | "">("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reasons = useMemo(() => JOB_POST_REPORT_REASON_VALUES, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError(t("jobReportErrReason"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/job-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobPostId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (json.error === "details_required_for_other") {
          setError(t("jobReportErrDetailsOther"));
        } else if (json.error === "missing_reports_table") {
          setError(t("jobReportFixHint"));
        } else if (json.error === "job_not_found") {
          setError(t("jobReportErrJob"));
        } else {
          setError(t("jobReportErrGeneric"));
        }
        return;
      }
      setDone(true);
    } catch {
      setError(t("jobReportErrGeneric"));
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setError(null);
    if (done) {
      setDone(false);
      setReason("");
      setDetails("");
    }
  }

  return (
    <div className={cn("min-w-0", className)}>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError(null);
        }}
        className={
          variant === "toolbar"
            ? "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 text-[13px] font-medium text-white/55 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white/85 lg:h-9"
            : "text-sm font-medium text-white/50 underline-offset-4 transition-colors hover:text-white/75 hover:underline"
        }
      >
        {variant === "toolbar" ? <Flag className="h-4 w-4" aria-hidden /> : null}
        {variant === "toolbar" ? t("jobDetailReportCta") : t("jobReportLink")}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-report-title"
          onClick={close}
        >
          <div
            className="max-h-[min(90dvh,40rem)] w-full overflow-y-auto rounded-t-3xl border border-white/[0.12] bg-zinc-950 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-h-[min(90dvh,36rem)] sm:max-w-md sm:rounded-3xl sm:p-6 sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div id="job-report-title" className="text-sm font-semibold text-white/90">
              {t("jobReportTitle")}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-white/55">{t("jobReportHint")}</p>

            {done ? (
              <div className="mt-5 space-y-4">
                <p className="text-sm leading-relaxed text-emerald-100/90">{t("jobReportThanks")}</p>
                  <Button type="button" variant="outline" className="w-full" onClick={close}>
                    {t("jobReportClose")}
                  </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-xs font-medium tracking-wide text-white/65">
                    {t("jobReportReasonLabel")}
                  </legend>
                  {reasons.map((code) => (
                    <label
                      key={code}
                      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5"
                    >
                      <input
                        type="radio"
                        name="job-report-reason"
                        checked={reason === code}
                        onChange={() => setReason(code)}
                        className="mt-1 h-4 w-4 border-white/[0.20] bg-white/[0.03]"
                      />
                      <span className="text-sm text-white/80">{t(`jobReportReason.${code}`)}</span>
                    </label>
                  ))}
                </fieldset>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="job-report-details">
                    {t("jobReportDetailsLabel")}
                  </label>
                  <textarea
                    id="job-report-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
                    rows={3}
                    maxLength={2000}
                    placeholder={t("jobReportDetailsPlaceholder")}
                    className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 outline-none focus:border-white/[0.18]"
                  />
                </div>

                {error ? (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-rose-200/90">{error}</p>
                ) : null}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={close} disabled={loading}>
                    {t("jobReportCancel")}
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" disabled={loading || !reason}>
                    {loading ? t("jobReportSubmitting") : t("jobReportSubmit")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
