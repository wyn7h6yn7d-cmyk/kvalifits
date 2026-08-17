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
      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
      {!jobs.length ? (
        <EmptyState className="mt-5 py-8" icon={Briefcase} title={empty} />
      ) : (
        <ul className="mt-5 list-none space-y-3 p-0">
          {jobs.map((job) => {
            const posted = formatJobDateDdMmYyyy(job.publishedAt);
            return (
              <li key={job.id}>
                <article className="relative rounded-2xl border border-white/[0.08] bg-[#16161b] p-4 transition-[border-color] hover:border-white/[0.14] sm:p-5">
                  <Link
                    href={`/tood/${job.id}`}
                    className="absolute inset-0 z-0 rounded-2xl"
                    aria-label={`${openJob}: ${job.title}`}
                  />
                  <div className="relative z-[1]">
                    <h3 className="text-[1.05rem] font-semibold tracking-tight text-white">{job.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/55">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-white/35" aria-hidden />
                        {job.location}
                      </span>
                      {posted ? <span>{posted}</span> : null}
                    </div>
                    {job.salary ? (
                      <p className="mt-2 text-[15px] font-semibold tabular-nums text-white">{job.salary}</p>
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
