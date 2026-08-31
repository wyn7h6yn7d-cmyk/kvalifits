import { cn } from "@/lib/utils";

/** Soft blend between sections so blocks don’t feel hard-cut. */
export function SectionDivider({
  className,
  tone = "soft",
}: {
  className?: string;
  tone?: "soft" | "deep";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative h-16 w-full overflow-hidden sm:h-20 lg:h-24",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          tone === "deep"
            ? "bg-gradient-to-b from-transparent via-slate-200/50 to-transparent"
            : "bg-gradient-to-b from-transparent via-slate-100/80 to-transparent",
        )}
      />
      <div className="absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
}
