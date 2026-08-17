import { AccountAuthLoadingFrame } from "@/components/skeletons/AccountLoadingFrame";
import { CandidateCardSkeleton } from "@/components/skeletons/CandidateListSkeleton";
import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";

export default function EmployerCandidatesLoading() {
  return (
    <AccountAuthLoadingFrame maxWidthClassName="max-w-6xl">
      <SkeletonRegion className="space-y-6">
        <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
          <Bone className="h-4 w-40" />
          <Bone className="mt-2 h-3.5 w-64 max-w-full" />
          <Bone className="mt-4 h-12 w-full rounded-xl sm:max-w-md sm:ml-auto" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-white/[0.08] bg-[#141416] p-4">
              <Bone className="h-4 w-24" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Bone key={i} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <CandidateCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </SkeletonRegion>
    </AccountAuthLoadingFrame>
  );
}
