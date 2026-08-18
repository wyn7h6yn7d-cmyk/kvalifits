import { Container } from "@/components/ui/container";
import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";
import { JobCardSkeleton } from "@/components/skeletons/JobCardSkeleton";

export function JobSearchSkeleton({ label, count = 4 }: { label?: string; count?: number }) {
  return (
    <SkeletonRegion label={label} className="pb-16 sm:pb-20">
      <Container className="max-w-[1240px]">
        <div className="border-b border-white/[0.08] pb-6">
          <Bone className="h-8 w-48 rounded-lg sm:h-9" />
          <Bone className="mt-2 h-4 w-28" />
          <Bone className="mt-5 h-12 w-full rounded-2xl lg:h-[52px]" />
        </div>
        <div className="mt-3 space-y-2 lg:hidden">
          <Bone className="h-4 w-32" />
          <Bone className="h-11 w-full rounded-xl" />
          <Bone className="h-11 w-full rounded-xl" />
        </div>
        <div className="grid gap-6 lg:mt-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-7">
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-white/[0.08] bg-[#141416] p-4">
              <Bone className="h-4 w-20" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Bone className="h-3 w-24" />
                    <Bone className="h-8 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:gap-3.5">
            {Array.from({ length: count }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </Container>
    </SkeletonRegion>
  );
}
