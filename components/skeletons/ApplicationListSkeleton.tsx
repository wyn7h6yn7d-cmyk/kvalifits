import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";

export function ApplicationListSkeleton({ label, count = 4 }: { label?: string; count?: number }) {
  return (
    <SkeletonRegion label={label} className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <Bone className="h-2.5 w-16" />
              <Bone className="mt-2 h-3.5 w-36" />
              <Bone className="mt-3 h-5 w-[70%] max-w-xs" />
            </div>
            <Bone className="h-7 w-28 rounded-full" />
          </div>
          <div className="mt-5 grid gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
            <div>
              <Bone className="h-2.5 w-20" />
              <Bone className="mt-2 h-3.5 w-24" />
            </div>
            <div>
              <Bone className="h-2.5 w-24" />
              <Bone className="mt-2 h-3.5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}
