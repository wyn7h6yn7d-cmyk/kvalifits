import { Container } from "@/components/ui/container";
import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";
import { JobCardSkeleton } from "@/components/skeletons/JobCardSkeleton";
import {
  JOBS_PAGE_CONTAINER,
  JOBS_PAGE_CONTROL_HEIGHT,
  JOBS_PAGE_LIST_GAP,
  JOBS_PAGE_MAIN_GRID,
  JOBS_PAGE_SECTION_GAP,
  JOBS_PAGE_SIDEBAR_PADDING,
} from "@/lib/jobs/jobsPageLayout";
import { cn } from "@/lib/utils";

export function JobSearchSkeleton({ label, count = 4 }: { label?: string; count?: number }) {
  return (
    <SkeletonRegion label={label} className="pb-12 sm:pb-12 lg:pb-16">
      <Container className={JOBS_PAGE_CONTAINER}>
        <header className="border-b border-white/[0.08] pb-4 md:pb-6 lg:pb-8">
          <Bone className="h-8 w-48 rounded-lg sm:h-9" />
          <Bone className={cn("mt-4 w-full rounded-2xl", JOBS_PAGE_CONTROL_HEIGHT)} />
          <Bone className="mt-4 h-4 w-32 lg:hidden" />
        </header>

        <div
          className={cn(
            JOBS_PAGE_SECTION_GAP,
            "space-y-3 border-b border-white/[0.08] py-3 lg:hidden",
          )}
        >
          <div className="grid grid-cols-2 gap-2">
            <Bone className="h-11 w-full rounded-xl" />
            <Bone className="h-11 w-full rounded-xl" />
          </div>
          <Bone className="h-11 w-full rounded-xl" />
        </div>

        <div className={JOBS_PAGE_SECTION_GAP}>
          <div className={JOBS_PAGE_MAIN_GRID}>
            <Bone className="hidden h-4 w-16 lg:block" />
            <div className="hidden min-w-0 items-center justify-between gap-3 lg:flex">
              <Bone className="h-4 w-36" />
              <div className="flex shrink-0 items-center gap-3">
                <Bone className="h-11 w-40 rounded-xl" />
                <Bone className="h-11 w-44 rounded-xl" />
              </div>
            </div>

            <div className="hidden lg:block">
              <div
                className={cn(
                  JOBS_PAGE_SIDEBAR_PADDING,
                  "rounded-2xl border border-white/[0.08] bg-[#141416]",
                )}
              >
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Bone className="h-3 w-24" />
                      <Bone className="h-8 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={JOBS_PAGE_LIST_GAP}>
              {Array.from({ length: count }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </SkeletonRegion>
  );
}
