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
