import { Bone } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function MatchPanelSkeleton({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn(compact ? "w-[7.5rem]" : "w-full", className)}>
      <Bone className={cn("ml-auto rounded-lg", compact ? "h-5 w-12" : "h-6 w-16")} />
      <Bone className={cn("ml-auto mt-1.5", compact ? "h-2.5 w-16" : "h-3 w-24")} />
      <Bone className={cn("ml-auto mt-1", compact ? "h-2.5 w-14" : "h-3 w-20")} />
    </div>
  );
}

/** Expanded “why” panel only — same layout as criteria rows. */
export function MatchExplanationSkeleton() {
  return (
    <div className="space-y-1.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-2">
          <Bone className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm" />
          <Bone className={cn("h-3.5 flex-1", i % 2 === 0 ? "max-w-[14rem]" : "max-w-[11rem]")} />
          <Bone className="mt-0.5 h-4 w-14 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}
