/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, errorMessageFromUnknown } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  job_post_id: string;
  created_at: string | null;
  updated_at: string | null;
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
  const job = (sp as any)?.job ?? {};
  const employer = (sp as any)?.employer ?? {};
  return {
    jobTitle: (job.title ?? "").toString().trim() || "—",
    employerName: (employer.company_name ?? "").toString().trim() || "—",
    jobId: (job.id ?? "").toString().trim() || "",
  };
}

/** Seeker-facing status only — never exposes employer pipeline nuance beyond these labels. */
function statusLabelKey(status: string | null | undefined) {
  const v = (status ?? "").toString().trim().toLowerCase();
  if (v === "rejected" || v === "withdrawn") return "seekerApplicationStatus_processEnded";
  if (v === "hired") return "seekerApplicationStatus_hired";
  if (v === "offer") return "seekerApplicationStatus_offer";
  if (v === "interview" || v === "interview_2") return "seekerApplicationStatus_interview";
  if (v === "reviewing") return "seekerApplicationStatus_reviewing";
  // new / submitted / empty
  return "seekerApplicationStatus_sent";
}

function statusTone(status: string | null | undefined) {
  const v = (status ?? "").toString().trim().toLowerCase();
  if (v === "withdrawn" || v === "rejected") {
    return "border-white/[0.10] bg-white/[0.03] text-white/55";
  }
  if (v === "hired") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90";
  }
  if (v === "offer") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100/80";
  }
  if (v === "interview" || v === "interview_2") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-100/85";
  }
  if (v === "reviewing") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-100/85";
  }
  return "border-white/[0.12] bg-white/[0.04] text-white/75";
}

function isClosed(status: string | null | undefined) {
  const v = (status ?? "").toString().trim().toLowerCase();
  return v === "withdrawn" || v === "rejected" || v === "hired";
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
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error(t("notAuthed"));

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("job_applications")
        .update({ status: "withdrawn", updated_at: now })
        .eq("id", id)
        .eq("seeker_user_id", user.id);
      if (error) throw error;

      const { data: check, error: checkErr } = await supabase
        .from("job_applications")
        .select("status,updated_at")
        .eq("id", id)
        .eq("seeker_user_id", user.id)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if ((check?.status ?? "").toString().toLowerCase() !== "withdrawn") {
        throw new Error(t("seekerWithdrawPolicyFixHint"));
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "withdrawn", updated_at: (check?.updated_at as string | null) ?? now }
            : r
        )
      );
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
          const applied = fmtDate(locale, r.created_at);
          const updated = fmtDate(locale, r.updated_at ?? r.created_at);
          const closed = isClosed(r.status);
          const canWithdraw = !closed && (r.status ?? "").toString().toLowerCase() !== "withdrawn";

          return (
            <li key={r.id}>
              <article
                className={cn(
                  "rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6",
                  "transition-[border-color,background-color] duration-200",
                  "hover:border-white/[0.16] hover:bg-white/[0.045]"
                )}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">
                      {t("seekerMetaCompany")}
                    </p>
                    <p className="mt-1 text-sm text-white/70">{meta.employerName}</p>
                    <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-white/92 sm:text-[16px]">
                      <span className="sr-only">{t("seekerMetaRole")}: </span>
                      {meta.jobTitle}
                    </h3>
                  </div>
                  <div className="mt-2 flex shrink-0 flex-col items-start gap-1 sm:mt-0 sm:items-end">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">
                      {t("seekerMetaStatus")}
                    </span>
                    <span
                      className={cn(
                        "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium",
                        statusTone(r.status)
                      )}
                    >
                      {t(statusLabelKey(r.status))}
                    </span>
                  </div>
                </div>

                <dl className="mt-5 grid gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">
                      {t("seekerMetaAppliedAt")}
                    </dt>
                    <dd className="mt-1 text-sm text-white/80">{applied}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">
                      {t("seekerMetaLastUpdate")}
                    </dt>
                    <dd className="mt-1 text-sm text-white/80">{updated}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {meta.jobId ? (
                    <Link
                      href={`/tood/${meta.jobId}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 text-[13px] font-medium text-white/75 hover:border-white/[0.16] hover:bg-white/[0.05]"
                    >
                      {t("seekerViewJob")} <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}

                  {canWithdraw ? (
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
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
