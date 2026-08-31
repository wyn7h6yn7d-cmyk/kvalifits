import { getTranslations } from "next-intl/server";

import { JobCard } from "@/components/jobs/JobCard";
import { JobSearchAlertsButton } from "@/components/jobs/JobSearchAlertsButton";
import { HomeSectionHeader } from "@/components/sections/home/HomeSectionHeader";
import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { getNewJobsForHomepage } from "@/lib/jobs/loadNewJobsForHomepage";
import { SITE_BODY, SITE_GRID_GAP, SITE_HOME_CTA_PRIMARY, SITE_HOME_CTA_SECONDARY } from "@/lib/site/publicPageLayout";
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
    <HomeSectionShell id="home-jobs" tone="base" glow="center" aria-labelledby="home-jobs-title">
      <HomeSectionHeader
        id="home-jobs-title"
        title={t("newTitle")}
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
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} saved={savedSet.has(job.id)} canSave={canSaveJobs} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#13131a]/70 px-5 py-8 sm:px-8 sm:py-10">
          <p className={cn(SITE_BODY, "text-muted")}>{t("empty")}</p>
          <div className="mt-5">
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
