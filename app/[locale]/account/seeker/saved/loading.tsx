import { AccountAuthLoadingFrame } from "@/components/skeletons/AccountLoadingFrame";
import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";

export default function SeekerSavedLoading() {
  return (
    <AccountAuthLoadingFrame maxWidthClassName="max-w-3xl">
      <SkeletonRegion className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#16161b] p-4 sm:p-5">
            <Bone className="h-5 w-[68%] max-w-sm" />
            <div className="mt-2 flex gap-2">
              <Bone className="h-3.5 w-28" />
              <Bone className="h-3.5 w-24" />
            </div>
            <Bone className="mt-3 h-3 w-36" />
          </div>
        ))}
      </SkeletonRegion>
    </AccountAuthLoadingFrame>
  );
}
