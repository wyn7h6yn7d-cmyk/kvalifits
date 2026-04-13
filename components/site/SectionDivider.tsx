import { cn } from "@/lib/utils";

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative h-px w-full overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent" />
      <div className="absolute inset-x-[15%] -top-24 h-48 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.12),transparent_70%)] blur-2xl" />
    </div>
  );
}
