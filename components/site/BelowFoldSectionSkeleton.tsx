/** Lightweight placeholder while below-the-fold homepage chunks load. */
import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";
import { SITE_CONTAINER, SITE_SECTION_PY } from "@/lib/site/publicPageLayout";

export function BelowFoldSectionSkeleton() {
  return (
    <SkeletonRegion className={SITE_SECTION_PY}>
      <div className={SITE_CONTAINER}>
        <Bone className="h-4 w-40" />
        <Bone className="mt-6 h-9 max-w-lg rounded-lg" />
        <Bone className="mt-4 h-4 max-w-2xl" />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Bone className="h-24 rounded-xl" />
          <Bone className="h-24 rounded-xl" />
          <Bone className="h-24 rounded-xl" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
