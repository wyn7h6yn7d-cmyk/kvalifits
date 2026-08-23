import { getTranslations } from "next-intl/server";

import { JobCard } from "@/components/jobs/JobCard";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { getNewJobsForHomepage } from "@/lib/jobs/loadNewJobsForHomepage";
import { SITE_GRID_GAP, SITE_H2_SECTION } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function NewJobsSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "homeJobs" });
  const { jobs, savedJobIds, canSaveJobs } = await getNewJobsForHomepage(locale);

  if (!jobs.length) return null;

  const savedSet = new Set(savedJobIds);

  return (
    <section className="border-b border-white/[0.06] bg-surface py-10 sm:py-12 lg:py-14">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className={SITE_H2_SECTION}>{t("newTitle")}</h2>
          <Link
            href="/tood"
            className="text-[14px] font-medium text-white/55 hover:text-white/85"
          >
            {t("viewAll")}
          </Link>
        </div>
        <div className={cn("mt-5 sm:mt-6", SITE_GRID_GAP, "grid")}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={savedSet.has(job.id)}
              canSave={canSaveJobs}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
