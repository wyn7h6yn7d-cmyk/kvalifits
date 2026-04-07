"use client";

import { BadgeCheck, MapPin, Sparkles } from "lucide-react";

import type { Job } from "@/components/jobs/mock-data";
import { cn } from "@/lib/utils";

export function JobCard({ job }: { job: Job }) {
  const tone =
    job.matchPercent >= 85 ? "violet" : job.matchPercent >= 75 ? "neutral" : "soft";

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 backdrop-blur-md transition-colors hover:bg-white/[0.04]">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          tone === "violet"
            ? "bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.18),transparent_55%)]"
            : tone === "neutral"
              ? "bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_55%)]"
              : "bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.12),transparent_55%)]"
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold tracking-tight text-white/92">
            {job.title}
          </div>
          <div className="mt-1 text-sm text-white/60">{job.company}</div>
        </div>
        <div className="shrink-0 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1 text-xs text-white/75">
          {job.matchPercent}% sobivus
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-white/55">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </span>
        <span className="text-white/25">•</span>
        <span>{job.type}</span>
        {job.salary ? (
          <>
            <span className="text-white/25">•</span>
            <span className="text-white/65">{job.salary}</span>
          </>
        ) : null}
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {job.tags.slice(0, 4).map((t, idx) => (
          <span
            key={t}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              idx === 1
                ? "border-white/[0.12] bg-[rgba(227,31,141,0.10)] text-white/85"
                : "border-white/[0.10] bg-white/[0.03] text-white/70"
            )}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="relative mt-6 grid gap-2">
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3">
          <div className="text-xs text-white/55">Verifitseerimine</div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <BadgeCheck className={cn("h-4 w-4", job.verified ? "text-white/70" : "text-white/40")} />
            {job.verified ? "kontrollitud" : "osaliselt"}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3">
          <div className="text-xs text-white/55">Signaalid</div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Sparkles className="h-4 w-4 text-white/60" />
            {job.highlights[0]}
          </div>
        </div>
      </div>
    </div>
  );
}

