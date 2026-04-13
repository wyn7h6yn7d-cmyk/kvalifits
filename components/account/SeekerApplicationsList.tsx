"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, errorMessageFromUnknown } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  job_post_id: string;
  created_at: string | null;
  status: string | null;
  shared_profile: unknown;
};

function fmtDate(locale: string, iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

function jobFromShared(sp: unknown) {
  const seeker = (sp as any)?.seeker ?? {};
  const job = (sp as any)?.job ?? {};
  const employer = (sp as any)?.employer ?? {};
  return {
    jobTitle: (job.title ?? "").toString().trim() || "—",
    jobLocation: (job.location ?? "").toString().trim() || "—",
    employerName: (employer.company_name ?? "").toString().trim() || "—",
    jobId: (job.id ?? "").toString().trim() || "",
    avatarUrl: (seeker.avatar_url ?? "").toString().trim() || "",
  };
}

function statusLabelKey(status: string | null | undefined) {
  const v = (status ?? "").toString().trim().toLowerCase();
  if (v === "withdrawn") return "seekerApplicationStatus_withdrawn";
  if (v === "submitted") return "seekerApplicationStatus_submitted";
  return "seekerApplicationStatus_submitted";
}

function statusTone(status: string | null | undefined) {
  const v = (status ?? "").toString().trim().toLowerCase();
  if (v === "withdrawn") {
    return "border-white/[0.10] bg-white/[0.03] text-white/60";
  }
  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100/85";
}

export function SeekerApplicationsList({ locale, applications }: { locale: string; applications: Row[] }) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [rows, setRows] = useState<Row[]>(applications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function withdraw(id: string) {
    const ok = window.confirm(t("seekerWithdrawConfirm"));
    if (!ok) return;

    setBusyId(id);
    setError(null);
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: "withdrawn", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // Remove immediately from the list (premium UX + matches server-side filter).
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (e) {
      setError(errorMessageFromUnknown(e, t("unknownError")));
    } finally {
      setBusyId(null);
    }
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] px-6 py-10 text-center sm:px-8">
        <div className="text-sm font-medium text-white/85">{t("seekerNoApplicationsTitle")}</div>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">{t("seekerNoApplicationsBody")}</p>
        <div className="mt-5">
          <Link href="/tood" className="text-sm font-medium text-white/80 underline hover:text-white">
            {t("seekerNoApplicationsCta")}
          </Link>
        </div>
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

      <ul className="list-none space-y-3 p-0">
        {rows.map((r) => {
          const meta = jobFromShared(r.shared_profile);
          const created = fmtDate(locale, r.created_at);
          const withdrawn = (r.status ?? "").toString().toLowerCase() === "withdrawn";

          return (
            <li key={r.id}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 transition-[border-color,background-color,box-shadow] duration-200 sm:p-6",
                  "hover:border-white/[0.17] hover:bg-white/[0.055] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_20px_50px_-38px_rgba(0,0,0,0.65)]"
                )}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold leading-snug tracking-tight text-white/92 sm:text-[16px]">
                        {meta.jobTitle}
                      </div>
                      <div className="mt-1 text-sm text-white/60">{meta.employerName}</div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
                          statusTone(r.status)
                        )}
                      >
                        {t(statusLabelKey(r.status))}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-[13px] text-white/55 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                      <span className="text-white/70">{meta.jobLocation}</span>
                    </span>
                    <span className="hidden h-1 w-1 shrink-0 rounded-full bg-white/20 sm:inline-block" aria-hidden />
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                      <span>
                        {t("seekerAppliedAt")} {created}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[12px] text-white/40">
                      {withdrawn ? t("seekerWithdrawnHint") : t("seekerNextStepHint")}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {meta.jobId ? (
                        <Link
                          href={`/tood/${meta.jobId}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 text-[13px] font-medium text-white/75 hover:border-white/[0.16] hover:bg-white/[0.05]"
                        >
                          {t("seekerViewJob")} <ChevronRight className="h-4 w-4" aria-hidden />
                        </Link>
                      ) : null}

                      {!withdrawn ? (
                        <Button
                          type="button"
                          onClick={() => void withdraw(r.id)}
                          className={cn(
                            "h-9 rounded-xl px-3 text-[13px] font-medium transition-colors",
                            "border-white/[0.10] bg-white/[0.03] text-rose-100/75 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-100/90",
                            busyId === r.id && "opacity-60"
                          )}
                          loading={busyId === r.id}
                          loadingText={t("saving")}
                        >
                          {t("seekerWithdraw")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

