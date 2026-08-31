import { Bone } from "@/components/ui/Skeleton";
import { MatchPanelSkeleton } from "@/components/skeletons/MatchPanelSkeleton";
import { JOBS_PAGE_CARD_PADDING } from "@/lib/jobs/jobsPageLayout";
import { SITE_DARK_CARD } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function JobCardSkeleton({ withMatch = true }: { withMatch?: boolean }) {
  return (
    <div
      className={cn(
        JOBS_PAGE_CARD_PADDING,
        SITE_DARK_CARD,
      )}
    >
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_12.75rem] lg:items-stretch lg:gap-x-6 lg:gap-y-3">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex gap-3">
            <Bone className="h-10 w-10 shrink-0 rounded-xl lg:h-11 lg:w-11" />
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
        </div>

        {withMatch ? (
          <div className="lg:col-start-2 lg:row-start-1 lg:self-start lg:border-l lg:border-border lg:pl-6">
            <MatchPanelSkeleton compact />
          </div>
        ) : null}

        <Bone className="h-3.5 w-full max-w-xl lg:col-start-1 lg:row-start-2" />
        <Bone className="hidden h-3.5 w-[82%] max-w-lg lg:col-start-1 lg:row-start-3 lg:block" />

        <div className="flex items-center gap-2 lg:contents">
          <Bone className="h-11 w-11 shrink-0 rounded-xl lg:col-start-2 lg:row-start-1 lg:justify-self-end lg:self-start" />
          <Bone className="h-11 min-w-0 flex-1 rounded-xl lg:col-start-2 lg:row-start-1 lg:row-end-[-1] lg:w-full lg:self-end" />
        </div>
      </div>
    </div>
  );
}
