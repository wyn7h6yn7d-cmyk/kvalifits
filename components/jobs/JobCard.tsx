"use client";

import { MapPin } from "lucide-react";

import type { Job } from "@/components/jobs/types";
import { cn } from "@/lib/utils";

export function JobCard({ job }: { job: Job }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 backdrop-blur-md transition-colors hover:bg-white/[0.04]">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_55%)]"
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold tracking-tight text-white/92">
            {job.title}
          </div>
          <div className="mt-1 text-sm text-white/60">{job.company}</div>
        </div>
        {/* MVP: no match % / signals until real scoring exists */}
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
    </div>
  );
}

