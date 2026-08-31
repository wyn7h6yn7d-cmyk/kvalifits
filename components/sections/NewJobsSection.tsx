import { getTranslations } from "next-intl/server";

import { JobCard } from "@/components/jobs/JobCard";
import { JobSearchAlertsButton } from "@/components/jobs/JobSearchAlertsButton";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { getNewJobsForHomepage } from "@/lib/jobs/loadNewJobsForHomepage";
import { SITE_BODY, SITE_GRID_GAP, SITE_H2_SECTION } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

const EMPTY_ALERT_SNAPSHOT = {
  query: "",
  requirePublicSalary: false,
  filters: [],
};

export async function NewJobsSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "homeJobs" });
  const { jobs, savedJobIds, canSaveJobs } = await getNewJobsForHomepage(locale);
  const savedSet = new Set(savedJobIds);

  return (
    <section id="home-jobs" className="border-y border-border bg-surface py-8 sm:py-10 lg:py-12">
      <Container>
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
          <h2 className={SITE_H2_SECTION}>{t("newTitle")}</h2>
          {jobs.length ? (
            <Link
              href="/tood"
              className="inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-muted hover:text-foreground"
            >
              {t("viewAll")}
            </Link>
          ) : null}
        </div>
        {jobs.length ? (
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
        ) : (
          <div className="mt-5">
            <p className={cn(SITE_BODY, "text-muted")}>{t("empty")}</p>
            <div className="mt-3">
              <JobSearchAlertsButton
                snapshot={EMPTY_ALERT_SNAPSHOT}
                matchSortAvailable={false}
                canSave={canSaveJobs}
                alwaysShow
                label={t("emptyCta")}
                variant="outline"
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
