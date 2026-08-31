import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";

function SummaryCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <Bone className="h-4 w-36" />
        <Bone className="h-3.5 w-16" />
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-1">
            <div className="min-w-0 flex-1">
              <Bone className="h-3.5 w-[70%]" />
              <Bone className="mt-1.5 h-3 w-[46%]" />
            </div>
            <Bone className="h-3.5 w-10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSummarySkeleton({ label }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Bone className="h-3 w-24" />
            <Bone className="mt-2 h-5 w-48" />
          </div>
          <Bone className="h-3.5 w-20 shrink-0" />
        </div>
        <Bone className="mt-4 h-1.5 w-full rounded-full" />
        <div className="mt-4 space-y-2">
          <Bone className="h-3.5 w-[88%]" />
          <Bone className="h-3.5 w-[72%]" />
          <Bone className="h-3.5 w-[64%]" />
        </div>
      </div>
      <SummaryCard />
      <SummaryCard />
      <SummaryCard lines={2} />
    </SkeletonRegion>
  );
}
