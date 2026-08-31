import { MapPin } from "lucide-react";

import { Link } from "@/i18n/routing";
import type { SimilarJobCardData } from "@/lib/jobs/loadSimilarJobsForDetail";
import { SITE_DARK_CARD, SITE_DARK_CARD_HOVER } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

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
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="text-[1.0625rem] font-semibold leading-snug text-foreground">{title}</h2>
      <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link
              href={`/tood/${job.id}`}
              className={cn("block h-full p-4", SITE_DARK_CARD, SITE_DARK_CARD_HOVER)}
            >
              <article>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 min-w-0 text-[1.0625rem] font-semibold leading-snug text-foreground">
                    {job.title}
                  </h3>
                  {typeof job.matchScore === "number" ? (
                    <span className="shrink-0 whitespace-nowrap tabular-nums text-[0.8125rem] font-medium text-body">
                      {matchLabel(job.matchScore)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-[0.9375rem] text-body">{job.company}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-muted">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden />
                    <span className="truncate">{job.location}</span>
                  </span>
                  {job.workType ? <span>{job.workType}</span> : null}
                </div>
                {job.salary ? (
                  <p className="mt-2 text-[0.9375rem] font-medium tabular-nums text-foreground">{job.salary}</p>
                ) : null}
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
