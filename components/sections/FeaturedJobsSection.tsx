import { getTranslations } from "next-intl/server";

import { JobCard } from "@/components/jobs/JobCard";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { getFeaturedJobsForHomepage } from "@/lib/jobs/loadFeaturedJobsForHomepage";
import { SITE_GRID_GAP, SITE_H2_SECTION } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function FeaturedJobsSection({
  locale,
  embedded = false,
}: {
  locale: string;
  embedded?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "homeJobs" });
  const { jobs, savedJobIds, canSaveJobs } = await getFeaturedJobsForHomepage(locale);

  if (!jobs.length) return null;

  const savedSet = new Set(savedJobIds);

  return (
    <section
      className={cn(
        embedded
          ? "py-8 sm:py-10 lg:py-12"
          : "border-b border-white/[0.06] bg-surface py-10 sm:py-12 lg:py-14",
      )}
    >
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className={SITE_H2_SECTION}>{t("featuredTitle")}</h2>
          <Link
            href="/tood"
            className="text-[14px] font-medium text-white/55 hover:text-white/85"
          >
            {t("viewAll")}
          </Link>
        </div>
        <div className={cn("mt-5 sm:mt-6 grid", SITE_GRID_GAP)}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              featured
              saved={savedSet.has(job.id)}
              canSave={canSaveJobs}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
