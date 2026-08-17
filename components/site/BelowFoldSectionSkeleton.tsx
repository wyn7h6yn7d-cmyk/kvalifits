/** Lightweight placeholder while below-the-fold homepage chunks load. */
import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";

export function BelowFoldSectionSkeleton() {
  return (
    <SkeletonRegion className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] px-6 py-10">
        <Bone className="mx-auto h-4 max-w-xs" />
        <Bone className="mx-auto mt-6 h-9 max-w-lg rounded-lg" />
        <Bone className="mx-auto mt-4 h-4 max-w-2xl" />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Bone className="h-40 rounded-2xl" />
          <Bone className="h-40 rounded-2xl" />
          <Bone className="h-40 rounded-2xl" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
