import { cn } from "@/lib/utils";
import type { JobRequirementPriority } from "@/lib/jobs/jobRequirements";

type Props = {
  priority: JobRequirementPriority;
  label: string;
  className?: string;
};

/** Distinct visual treatment for mandatory vs recommended job requirements. */
export function JobRequirementPriorityBadge({ priority, label, className }: Props) {
  const mandatory = priority === "mandatory";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide",
        mandatory
          ? "border-rose-400/35 bg-rose-500/15 text-rose-100/95"
          : "border-sky-400/30 bg-sky-500/10 text-sky-100/85",
        className
      )}
    >
      {label}
    </span>
  );
}
