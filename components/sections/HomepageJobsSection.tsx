import { getTranslations } from "next-intl/server";

import { JobCard } from "@/components/jobs/JobCard";
import { JobSearchAlertsButton } from "@/components/jobs/JobSearchAlertsButton";
import { HomeSectionHeader } from "@/components/sections/home/HomeSectionHeader";
import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { getFeaturedJobsForHomepage } from "@/lib/jobs/loadFeaturedJobsForHomepage";
import { getNewJobsForHomepage } from "@/lib/jobs/loadNewJobsForHomepage";
import {
  SITE_BODY,
  SITE_GRID_GAP,
  SITE_HOME_CARD,
  SITE_HOME_CTA_PRIMARY,
  SITE_HOME_CTA_SECONDARY,
} from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

const EMPTY_ALERT_SNAPSHOT = {
  query: "",
  requirePublicSalary: false,
  filters: [],
};

const JOBS_LIMIT = 6;

/**
 * Homepage jobs — featured first, then newest, deduped. One section only.
 */
export async function HomepageJobsSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "homeJobs" });
  const [featured, fresh] = await Promise.all([
    getFeaturedJobsForHomepage(locale),
    getNewJobsForHomepage(locale),
  ]);

  const featuredIds = new Set(featured.jobs.map((job) => job.id));
  const jobs = [
    ...featured.jobs.map((job) => ({ job, featured: true as const })),
    ...fresh.jobs
      .filter((job) => !featuredIds.has(job.id))
      .map((job) => ({ job, featured: false as const })),
  ].slice(0, JOBS_LIMIT);

  const canSaveJobs = featured.canSaveJobs || fresh.canSaveJobs;
  const savedSet = new Set([...featured.savedJobIds, ...fresh.savedJobIds]);
  const title = featured.jobs.length ? t("featuredTitle") : t("newTitle");

  return (
    <HomeSectionShell id="home-jobs" tone="base" aria-labelledby="home-jobs-title">
      <HomeSectionHeader
        id="home-jobs-title"
        title={title}
        action={
          jobs.length ? (
            <Button asChild variant="outline" className={SITE_HOME_CTA_SECONDARY}>
              <Link href="/tood">{t("viewAll")}</Link>
            </Button>
          ) : null
        }
      />
      {jobs.length ? (
        <div className={cn(SITE_GRID_GAP, "grid")}>
          {jobs.map(({ job, featured: isFeatured }) => (
            <JobCard
              key={job.id}
              job={job}
              featured={isFeatured}
              saved={savedSet.has(job.id)}
              canSave={canSaveJobs}
            />
          ))}
        </div>
      ) : (
        <div className={cn(SITE_HOME_CARD, "px-6 py-9 sm:px-8 sm:py-10 lg:px-10")}>
          <p className={cn(SITE_BODY, "text-muted")}>{t("empty")}</p>
          <div className="mt-6">
            <JobSearchAlertsButton
              snapshot={EMPTY_ALERT_SNAPSHOT}
              matchSortAvailable={false}
              canSave={canSaveJobs}
              alwaysShow
              label={t("emptyCta")}
              variant="primary"
              className={cn(SITE_HOME_CTA_PRIMARY, "w-full sm:w-auto")}
            />
          </div>
        </div>
      )}
    </HomeSectionShell>
  );
}
