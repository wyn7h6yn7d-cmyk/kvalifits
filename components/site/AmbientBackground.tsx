import { cn } from "@/lib/utils";

export function AmbientBackground({
  className,
}: {
  className?: string;
  intensity?: "soft" | "default" | "strong";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-20%,rgba(37,99,235,0.07),transparent_58%)]" />
    </div>
  );
}
