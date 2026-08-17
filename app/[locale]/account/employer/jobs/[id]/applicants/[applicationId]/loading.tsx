import { AccountAuthLoadingFrame } from "@/components/skeletons/AccountLoadingFrame";
import { MatchPanelSkeleton } from "@/components/skeletons/MatchPanelSkeleton";
import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";

export default function ApplicantDetailLoading() {
  return (
    <AccountAuthLoadingFrame maxWidthClassName="max-w-5xl">
      <SkeletonRegion className="space-y-6">
        <Bone className="h-4 w-40" />
        <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
          <div className="flex gap-4">
            <Bone className="h-14 w-14 shrink-0 rounded-3xl" />
            <div className="min-w-0 flex-1">
              <Bone className="h-3 w-24" />
              <Bone className="mt-2 h-5 w-48" />
              <Bone className="mt-2 h-3.5 w-36" />
            </div>
            <MatchPanelSkeleton />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
            <Bone className="h-3 w-28" />
            <Bone className="mt-4 h-3.5 w-full" />
            <Bone className="mt-2 h-3.5 w-[80%]" />
            <div className="mt-4 flex gap-2">
              <Bone className="h-7 w-16 rounded-full" />
              <Bone className="h-7 w-20 rounded-full" />
            </div>
          </div>
          <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
            <Bone className="h-3 w-24" />
            <Bone className="mt-4 h-4 w-[70%]" />
            <Bone className="mt-2 h-3.5 w-full" />
            <Bone className="mt-2 h-3.5 w-[76%]" />
          </div>
        </div>
      </SkeletonRegion>
    </AccountAuthLoadingFrame>
  );
}
