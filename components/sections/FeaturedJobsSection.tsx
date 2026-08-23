import { getTranslations } from "next-intl/server";

import { JobCard } from "@/components/jobs/JobCard";
import { Container } from "@/components/ui/container";
import { getFeaturedJobsForHomepage } from "@/lib/jobs/loadFeaturedJobsForHomepage";

export async function FeaturedJobsSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "homeJobs" });
  const { jobs, savedJobIds, canSaveJobs } = await getFeaturedJobsForHomepage(locale);

  if (!jobs.length) return null;

  const savedSet = new Set(savedJobIds);

  return (
    <section className="border-b border-white/[0.06] bg-surface py-10 sm:py-12 lg:py-14">
      <Container>
        <h2 className="text-balance text-[1.625rem] font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
          {t("featuredTitle")}
        </h2>
        <div className="mt-5 grid gap-3.5 sm:mt-6 sm:gap-4">
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
