import { AmbientBackground } from "@/components/site/AmbientBackground";
import { cn } from "@/lib/utils";

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <AmbientBackground />
    </div>
  );
}
