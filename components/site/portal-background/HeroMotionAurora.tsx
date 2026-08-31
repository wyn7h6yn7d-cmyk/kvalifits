import { cn } from "@/lib/utils";

/**
 * Slow rotating blue/violet light wash — visible motion without particle clutter.
 */
export function HeroMotionAurora({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="homepage-hero-aurora absolute left-[46%] top-[28%] h-[min(140%,720px)] w-[min(150%,920px)] -translate-x-1/2 -translate-y-1/2" />
      <div className="homepage-hero-aurora homepage-hero-aurora--reverse absolute left-[58%] top-[42%] h-[min(120%,640px)] w-[min(130%,820px)] -translate-x-1/2 -translate-y-1/2 opacity-70" />
    </div>
  );
}
