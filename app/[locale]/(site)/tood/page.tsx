import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { JobsSearch } from "@/components/jobs/JobsSearch";
import { JobSearchSkeleton } from "@/components/skeletons/JobSearchSkeleton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NOINDEX_FOLLOW, publicPageMetadata, searchParamsIndicateDuplicateLanding } from "@/lib/seo/site";
import { loadPublishedJobSearch } from "@/lib/jobs/loadPublishedJobSearch";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "pages.jobs" });
  return publicPageMetadata({
    locale,
    path: "/tood",
    title: t("title"),
    description: t("description"),
    robots: searchParamsIndicateDuplicateLanding(sp) ? NOINDEX_FOLLOW : undefined,
  });
}

export default async function ToodPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("pages.jobs");
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const supabase = await createSupabaseServerClient();

  const result = await loadPublishedJobSearch({
    supabase,
    locale,
    searchParams: sp,
    tJobs,
  });

  return (
    <>
      <Suspense fallback={<JobSearchSkeleton />}>
        <JobsSearch
          jobs={result.jobs}
          totalCount={result.totalCount}
          currentPage={result.currentPage}
          totalPages={result.totalPages}
          pageSize={result.pageSize}
          facetOptions={result.facetOptions}
          pageTitle={t("title")}
          matchSortAvailable={result.matchSortAvailable}
          savedJobIds={result.savedJobIds}
          canSaveJobs={result.canSaveJobs}
        />
      </Suspense>
    </>
  );
}
