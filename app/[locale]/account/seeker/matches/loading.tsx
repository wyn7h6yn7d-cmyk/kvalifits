import { AccountAuthLoadingFrame } from "@/components/skeletons/AccountLoadingFrame";
import { JobCardSkeleton } from "@/components/skeletons/JobCardSkeleton";
import { SkeletonRegion } from "@/components/ui/Skeleton";

export default function SeekerMatchesLoading() {
  return (
    <AccountAuthLoadingFrame>
      <SkeletonRegion className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </SkeletonRegion>
    </AccountAuthLoadingFrame>
  );
}
