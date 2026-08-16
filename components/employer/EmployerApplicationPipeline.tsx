"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

import {
  APPLICATION_PIPELINE_ACTIVE,
  APPLICATION_PIPELINE_TERMINAL,
  type ApplicationPipelineStatus,
} from "@/lib/employer/applicationPipeline";
import { cn } from "@/lib/utils";

type Props = {
  total: number;
  counts: Record<ApplicationPipelineStatus, number>;
  filter: ApplicationPipelineStatus | "all";
  onFilterChange: (next: ApplicationPipelineStatus | "all") => void;
};

function stageTone(status: ApplicationPipelineStatus, active: boolean) {
  if (!active) return "border-white/[0.10] bg-white/[0.02] text-white/55 hover:border-white/[0.14] hover:text-white/75";
  switch (status) {
    case "new":
      return "border-sky-400/35 bg-sky-500/15 text-sky-50";
    case "reviewing":
      return "border-violet-400/35 bg-violet-500/15 text-violet-50";
    case "interview":
    case "interview_2":
      return "border-amber-400/35 bg-amber-500/15 text-amber-50";
    case "offer":
      return "border-emerald-400/30 bg-emerald-500/12 text-emerald-50";
    case "hired":
      return "border-emerald-400/40 bg-emerald-500/18 text-emerald-50";
    case "rejected":
    case "withdrawn":
      return "border-white/[0.16] bg-white/[0.07] text-white/85";
    default:
      return "border-white/[0.16] bg-white/[0.08] text-white/90";
  }
}

/**
 * Lightweight hiring pipeline filter — stages + counts only.
 * Not a full ATS (no automations, scorecards, or multi-seat workflows).
 */
export function EmployerApplicationPipeline({ total, counts, filter, onFilterChange }: Props) {
  const t = useTranslations("jobs");

  return (
    <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            {t("applicationPipelineTitle")}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/50">{t("applicationPipelineHint")}</p>
        </div>
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
            filter === "all"
              ? "border-white/[0.18] bg-white/[0.08] text-white/90"
              : "border-white/[0.10] bg-white/[0.02] text-white/55 hover:border-white/[0.14] hover:text-white/75"
          )}
        >
          {t("applicationPipelineAll")} · {total}
        </button>
      </div>

      {/* Active path */}
      <div className="mt-4">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
          {t("applicationPipelinePathLabel")}
        </div>
        <div className="mt-2 flex items-stretch gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {APPLICATION_PIPELINE_ACTIVE.map((s, i) => (
            <div key={s} className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onFilterChange(s)}
                className={cn(
                  "min-w-[5.5rem] rounded-2xl border px-2.5 py-2 text-left transition-colors",
                  stageTone(s, filter === s)
                )}
              >
                <div className="text-[10px] font-semibold leading-snug">{t(`applicationPipelineStatus.${s}`)}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums leading-none">{counts[s]}</div>
              </button>
              {i < APPLICATION_PIPELINE_ACTIVE.length - 1 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Terminal outcomes */}
      <div className="mt-4 border-t border-white/[0.08] pt-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
          {t("applicationPipelineOutcomesLabel")}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {APPLICATION_PIPELINE_TERMINAL.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onFilterChange(s)}
              className={cn(
                "rounded-2xl border px-3 py-2 text-left transition-colors",
                stageTone(s, filter === s)
              )}
            >
              <div className="text-[10px] font-semibold leading-snug">{t(`applicationPipelineStatus.${s}`)}</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">{counts[s]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
