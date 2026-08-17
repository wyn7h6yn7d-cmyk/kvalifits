import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";
import { MatchPanelSkeleton } from "@/components/skeletons/MatchPanelSkeleton";

export function JobDetailSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonRegion
      label={label}
      className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.75rem+var(--site-bottom-nav-offset,0px))] pt-8 sm:px-6 lg:pb-16 lg:pt-10"
    >
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:items-start lg:gap-10">
        <div className="min-w-0">
          <Bone className="h-8 w-[78%] max-w-xl rounded-lg sm:h-9" />
          <div className="mt-3 flex items-start gap-3">
            <Bone className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Bone className="h-4 w-40" />
              <Bone className="mt-2 h-3.5 w-52" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Bone className="h-7 w-24 rounded-md" />
            <Bone className="h-7 w-28 rounded-md" />
            <Bone className="h-7 w-20 rounded-md" />
          </div>
          <div className="mt-8 space-y-3 border-t border-white/[0.08] pt-8">
            <Bone className="h-4 w-32" />
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-[94%]" />
            <Bone className="h-3.5 w-[88%]" />
            <Bone className="h-3.5 w-[70%]" />
          </div>
          <div className="mt-2 space-y-3 border-t border-white/[0.08] py-8">
            <Bone className="h-4 w-28" />
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-[80%]" />
            <Bone className="h-3.5 w-[62%]" />
          </div>
          <div className="border-t border-white/[0.08] pt-8">
            <Bone className="h-4 w-36" />
            <div className="mt-4 rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
              <Bone className="h-4 w-40" />
              <Bone className="mt-3 h-11 w-full rounded-xl" />
              <Bone className="mt-3 h-11 w-full rounded-xl" />
              <Bone className="mt-3 h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
        <div className="mt-8 hidden lg:sticky lg:top-[calc(var(--site-header-offset)+0.75rem)] lg:mt-0 lg:block">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141416] p-5">
            <MatchPanelSkeleton />
            <Bone className="mt-5 h-11 w-full rounded-xl" />
            <Bone className="mt-2 h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}
