import { MapPin } from "lucide-react";

import { Link } from "@/i18n/routing";
import type { SimilarJobCardData } from "@/lib/jobs/loadSimilarJobsForDetail";

export function SimilarJobsSection({
  jobs,
  title,
  matchLabel,
}: {
  jobs: SimilarJobCardData[];
  title: string;
  matchLabel: (score: number) => string;
}) {
  if (!jobs.length) return null;

  return (
    <section className="mt-12 border-t border-white/[0.08] pt-10">
      <h2 className="text-[15px] font-semibold tracking-tight text-white/90">{title}</h2>
      <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link
              href={`/tood/${job.id}`}
              className="block h-full rounded-2xl border border-white/[0.08] bg-[#16161b] p-4 transition-[border-color,background-color] hover:border-white/[0.14] hover:bg-[#1a1a20]"
            >
              <article>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 min-w-0 text-[15px] font-semibold leading-snug tracking-tight text-white">
                    {job.title}
                  </h3>
                  {typeof job.matchScore === "number" ? (
                    <span className="shrink-0 whitespace-nowrap tabular-nums text-[12px] font-medium text-white/70">
                      {matchLabel(job.matchScore)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-[13px] text-white/58">{job.company}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/50">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                    <span className="truncate">{job.location}</span>
                  </span>
                  {job.workType ? <span>{job.workType}</span> : null}
                </div>
                {job.salary ? (
                  <p className="mt-2 text-[13px] font-medium tabular-nums text-white/85">{job.salary}</p>
                ) : null}
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
