import { HomepageMotionBackground } from "@/components/site/HomepageMotionBackground";
import { cn } from "@/lib/utils";

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <HomepageMotionBackground />
      <div className="absolute inset-x-0 top-0 z-[2] h-36 bg-gradient-to-b from-[#07070c]/95 via-[#07070c]/40 to-transparent sm:h-40" />
    </div>
  );
}
