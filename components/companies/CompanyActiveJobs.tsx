import { Briefcase, MapPin } from "lucide-react";

import { Link } from "@/i18n/routing";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PublicCompanyJob } from "@/lib/companies/loadPublicCompany";
import { formatJobDateDdMmYyyy } from "@/lib/jobs/jobLifecycle";

export function CompanyActiveJobs({
  jobs,
  title,
  empty,
  openJob,
}: {
  jobs: PublicCompanyJob[];
  title: string;
  empty: string;
  openJob: string;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-[1.25rem] font-semibold leading-snug text-foreground sm:text-[1.5rem]">{title}</h2>
      {!jobs.length ? (
        <EmptyState className="mt-5 py-8" icon={Briefcase} title={empty} />
      ) : (
        <ul className="mt-5 list-none space-y-3 p-0">
          {jobs.map((job) => {
            const posted = formatJobDateDdMmYyyy(job.publishedAt);
            return (
              <li key={job.id}>
                <article className="relative rounded-2xl border border-border bg-white p-4 transition-[border-color] hover:border-border-strong sm:p-5">
                  <Link
                    href={`/tood/${job.id}`}
                    className="absolute inset-0 z-0 rounded-2xl"
                    aria-label={`${openJob}: ${job.title}`}
                  />
                  <div className="relative z-[1]">
                    <h3 className="text-[1.0625rem] font-semibold leading-snug text-foreground">{job.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-2" aria-hidden />
                        {job.location}
                      </span>
                      {posted ? <span>{posted}</span> : null}
                    </div>
                    {job.salary ? (
                      <p className="mt-2 text-base font-semibold tabular-nums text-foreground">{job.salary}</p>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
