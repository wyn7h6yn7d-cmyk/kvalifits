import { Bone } from "@/components/ui/Skeleton";
import { MatchPanelSkeleton } from "@/components/skeletons/MatchPanelSkeleton";

export function JobCardSkeleton({ withMatch = true }: { withMatch?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#16161b] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex gap-3 sm:gap-3.5">
            <Bone className="h-11 w-11 shrink-0 rounded-xl lg:h-12 lg:w-12" />
            <div className="min-w-0 flex-1">
              <Bone className="h-5 w-[72%] max-w-sm rounded-md" />
              <div className="mt-2 flex items-center gap-2">
                <Bone className="h-3.5 w-28" />
                <Bone className="h-3.5 w-24" />
              </div>
            </div>
          </div>
          <Bone className="mt-3 h-5 w-36" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Bone className="h-6 w-16 rounded-md" />
            <Bone className="h-6 w-20 rounded-md" />
            <Bone className="h-6 w-14 rounded-md" />
          </div>
          {withMatch ? (
            <div className="mt-3 lg:hidden">
              <MatchPanelSkeleton compact />
            </div>
          ) : null}
          <Bone className="mt-2.5 hidden h-3.5 w-full max-w-xl lg:block" />
          <Bone className="mt-1.5 hidden h-3.5 w-[82%] max-w-lg lg:block" />
          <div className="mt-3 flex items-center gap-2 lg:hidden">
            <Bone className="h-11 w-11 shrink-0 rounded-xl" />
            <Bone className="h-11 min-w-0 flex-1 rounded-xl" />
          </div>
        </div>
        <div className="hidden w-[12.75rem] shrink-0 flex-col items-end justify-between gap-4 border-l border-white/[0.06] pl-6 lg:flex">
          {withMatch ? <MatchPanelSkeleton compact /> : <Bone className="h-9 w-24 rounded-lg" />}
          <Bone className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
