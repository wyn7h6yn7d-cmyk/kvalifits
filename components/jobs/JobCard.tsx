"use client";

import { CalendarDays, ChevronRight, MapPin } from "lucide-react";

import type { Job } from "@/components/jobs/types";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("et-EE", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function JobCard({ job }: { job: Job }) {
  const posted = formatDate(job.createdAt);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 backdrop-blur-md transition-colors hover:bg-white/[0.04]">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_55%)]"
        )}
      />

      <div className="relative space-y-4">
        <div className="space-y-1.5">
          <Link
            href={`/tood/${job.id}`}
            className="block text-pretty text-lg font-semibold tracking-tight text-white/92 hover:underline"
          >
            {job.title}
          </Link>
          <div className="flex items-center gap-2.5">
            {job.companyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.companyLogoUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-lg border border-white/[0.10] bg-white/[0.04] object-contain"
              />
            ) : null}
            <div className="text-sm text-white/60">{job.company}</div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-white/55">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
            {posted ? (
              <span className="inline-flex items-center gap-1 text-white/45">
                <CalendarDays className="h-3.5 w-3.5" />
                {posted}
              </span>
            ) : null}
          </div>
          <div className="text-white/55">
            {(job.workType || job.jobType) ? (
              <span>
                {[job.workType, job.jobType].filter(Boolean).join(" · ")}
              </span>
            ) : (
              <span>{job.type}</span>
            )}
            {job.salary ? <span className="text-white/25"> {" · "}</span> : null}
            {job.salary ? <span className="text-white/65">{job.salary}</span> : null}
          </div>
        </div>

        {job.summary ? (
          <p className="text-pretty text-sm leading-relaxed text-white/60">
            {job.summary}
          </p>
        ) : null}

        {job.tags.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {job.tags.slice(0, 6).map((t, idx) => (
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
        ) : null}

        <div className="flex justify-end pt-1">
          <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-3 text-[13px]">
            <Link href={`/tood/${job.id}`}>
              Ava kuulutus <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

