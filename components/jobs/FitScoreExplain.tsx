"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { MatchExplanationSkeleton } from "@/components/skeletons/MatchPanelSkeleton";
import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";
import type { MatchCriterion, MatchExplanation } from "@/lib/matching/matchExplanation";
import { parseMatchExplanation } from "@/lib/matching/matchExplanation";
import { cn } from "@/lib/utils";

const LANG_NAME_IDS = new Set(["et", "en", "ru", "fi", "de", "fr", "es", "sv", "lv", "lt"]);

export type MatchExplanationLazySource = { jobId: string } | { applicationId: string };

type Props = {
  score: number | null;
  explanation?: MatchExplanation | null;
  /** Fetch detailed criteria only when the why panel opens. */
  lazySource?: MatchExplanationLazySource | null;
  label?: string;
  defaultOpen?: boolean;
  compact?: boolean;
  /** Show mandatory/preferred totals next to the score (not only inside the why panel). */
  showCountsWhenCollapsed?: boolean;
  className?: string;
};

function criterionText(
  t: (key: string, values?: Record<string, string | number>) => string,
  row: MatchCriterion,
): string {
  const values: Record<string, string | number> = { ...(row.values ?? {}) };
  if (typeof values.language === "string" && LANG_NAME_IDS.has(values.language)) {
    values.language = t(`matchLangName.${values.language}`);
  }
  return t(row.messageKey, values);
}

function lazyKey(source: MatchExplanationLazySource | null | undefined): string | null {
  if (!source) return null;
  return "jobId" in source ? `job:${source.jobId}` : `app:${source.applicationId}`;
}

async function fetchExplanation(
  source: MatchExplanationLazySource,
  signal: AbortSignal,
): Promise<MatchExplanation | null> {
  const params =
    "jobId" in source
      ? `jobId=${encodeURIComponent(source.jobId)}`
      : `applicationId=${encodeURIComponent(source.applicationId)}`;
  const res = await fetch(`/api/jobs/match-explanation?${params}`, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { explanation?: unknown };
  return parseMatchExplanation(body.explanation);
}

/** Shared match % + expandable “why” criteria. Never a bare percentage. */
export function FitScoreExplain({
  score,
  explanation,
  lazySource = null,
  label,
  defaultOpen = false,
  compact = false,
  showCountsWhenCollapsed = false,
  className,
}: Props) {
  const tJobs = useTranslations("jobs");
  const t = tJobs as unknown as (key: string, values?: Record<string, string | number>) => string;
  const [open, setOpen] = useState(defaultOpen);
  const jobId = lazySource && "jobId" in lazySource ? lazySource.jobId : null;
  const applicationId = lazySource && "applicationId" in lazySource ? lazySource.applicationId : null;
  const sourceKey = lazyKey(lazySource);
  const [fetched, setFetched] = useState<{ key: string; data: MatchExplanation | null } | null>(null);
  const hasScore = score !== null;
  const resolved = explanation ?? (fetched?.key === sourceKey ? fetched.data : null);
  const loading = Boolean(open && !explanation && sourceKey && fetched?.key !== sourceKey);
  const criteria = resolved?.criteria ?? [];
  const mandTotal = resolved?.mandatoryTotal ?? 0;
  const recTotal = resolved?.recommendedTotal ?? 0;
  const whyLabel = t("fitWhyOpen", { score: score ?? 0 });
  const hideLabel = t("fitWhyHide");

  useEffect(() => {
    const source = jobId
      ? { jobId }
      : applicationId
        ? { applicationId }
        : null;
    if (!open || explanation || !source) return;
    const key = lazyKey(source);
    if (!key) return;
    const ac = new AbortController();
    fetchExplanation(source, ac.signal)
      .then((data) => {
        if (!ac.signal.aborted) setFetched({ key, data });
      })
      .catch(() => {
        if (!ac.signal.aborted) setFetched({ key, data: null });
      });
    return () => {
      ac.abort();
    };
  }, [open, explanation, jobId, applicationId]);

  const counts = (
    <ul className={cn("space-y-0.5 tabular-nums text-white/55", compact ? "text-[11px]" : "text-[13px]")}>
      {mandTotal > 0 ? (
        <li>
          {t("matchExplainMandatoryCount", {
            filled: resolved?.mandatoryFilled ?? 0,
            total: mandTotal,
          })}
        </li>
      ) : null}
      {recTotal > 0 ? (
        <li>
          {t("matchExplainRecommendedCount", {
            filled: resolved?.recommendedFilled ?? 0,
            total: recTotal,
          })}
        </li>
      ) : null}
    </ul>
  );

  return (
    <div
      className={cn("min-w-0", className)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {label ? (
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</div>
      ) : null}
      <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", label ? "mt-1" : "")}>
        <div
          className={cn(
            "font-semibold tabular-nums tracking-tight text-white",
            compact ? "text-xl leading-none" : "text-[1.65rem] leading-none",
          )}
        >
          {hasScore ? `${score}%` : "—"}
        </div>
        {hasScore ? (
          <button
            type="button"
            className="relative z-[2] inline-flex min-h-11 items-center text-sm text-white/55 underline-offset-4 hover:text-white/85 hover:underline lg:min-h-0"
            aria-expanded={open}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          >
            {open ? hideLabel : whyLabel}
          </button>
        ) : null}
      </div>

      {showCountsWhenCollapsed && !open && (mandTotal > 0 || recTotal > 0) ? (
        <div className="mt-2">{counts}</div>
      ) : null}

      {open && hasScore ? (
        <div
          className={cn(
            "mt-3 space-y-3 rounded-2xl border border-white/[0.08] bg-black/20 px-3.5 py-3",
            compact &&
              "max-lg:relative max-lg:right-auto max-lg:mt-2 max-lg:w-full max-lg:shadow-none lg:absolute lg:right-0 lg:z-30 lg:w-[min(20.5rem,calc(100vw-2rem))] lg:border-white/[0.12] lg:bg-[#16161b] lg:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)]",
          )}
        >
          {loading && !explanation ? (
            <SkeletonRegion>
              <div className="mb-3 space-y-1">
                <Bone className="h-3 w-36" />
                <Bone className="h-3 w-24" />
              </div>
              <MatchExplanationSkeleton />
            </SkeletonRegion>
          ) : (
            <>
              {mandTotal > 0 || recTotal > 0 ? counts : null}
              {criteria.length ? (
                <ul className="space-y-1.5">
                  {criteria.map((row) => (
                    <li key={row.id} className="flex items-start gap-2 text-[13px] leading-snug">
                      <span
                        className={cn(
                          "mt-px shrink-0 font-semibold",
                          row.status === "pass" && "text-emerald-300/90",
                          row.status === "partial" && "text-amber-200/80",
                          row.status === "gap" && "text-white/35",
                        )}
                        aria-hidden
                      >
                        {row.status === "pass" ? "✓" : "○"}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1",
                          row.status === "pass" && "text-white/82",
                          row.status === "partial" && "text-white/65",
                          row.status === "gap" && "text-white/48",
                        )}
                      >
                        {criterionText(t, row)}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 shrink-0 rounded-md border px-1.5 py-px text-[10px] font-medium",
                          row.priority === "mandatory"
                            ? "border-white/[0.12] text-white/55"
                            : "border-white/[0.08] text-white/40",
                        )}
                      >
                        {row.priority === "mandatory" ? t("matchPriorityMandatory") : t("matchPriorityPreferred")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] leading-snug text-white/55">{t("matchExplainFallback")}</p>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}