import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";

export function CandidateCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Bone className="h-4 w-40" />
          <Bone className="mt-2 h-3 w-52" />
        </div>
        <Bone className="h-5 w-12 rounded-md" />
      </div>
      <div className="mt-4 space-y-2">
        <Bone className="h-8 w-full max-w-sm rounded-lg" />
        <Bone className="h-8 w-[70%] max-w-xs rounded-lg" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Bone className="h-7 w-16 rounded-full" />
        <Bone className="h-7 w-20 rounded-full" />
        <Bone className="h-7 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function CandidateListSkeleton({
  label,
  count = 5,
  withFilters = true,
}: {
  label?: string;
  count?: number;
  withFilters?: boolean;
}) {
  return (
    <SkeletonRegion label={label} className="space-y-4">
      {withFilters ? (
        <>
          <Bone className="h-11 w-full rounded-xl" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Bone key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </>
      ) : null}
      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] lg:block">
        <div className="grid grid-cols-8 gap-3 border-b border-white/[0.08] px-4 py-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Bone key={i} className="h-2.5 w-16" />
          ))}
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="grid grid-cols-8 items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-3.5 w-24" />
            <Bone className="h-3.5 w-10" />
            <Bone className="h-3.5 w-16" />
            <Bone className="h-3.5 w-14" />
            <Bone className="h-3.5 w-16" />
            <Bone className="h-3.5 w-12" />
            <Bone className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2 lg:hidden">
        {Array.from({ length: count }).map((_, i) => (
          <CandidateCardSkeleton key={i} />
        ))}
      </div>
    </SkeletonRegion>
  );
}
