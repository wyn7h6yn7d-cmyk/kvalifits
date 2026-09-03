import { AmbientBackground } from "@/components/site/AmbientBackground";
import { HeroMotionAurora } from "@/components/site/portal-background/HeroMotionAurora";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

/**
 * Human Premium hero motion — quiet animated atmosphere edge-to-edge.
 * Dim enough that copy and search stay primary.
 */
export function HomepageMotionBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <AmbientBackground intensity={heroPortal.ambientIntensity} />

      <HeroMotionAurora className="opacity-[0.10] sm:opacity-[0.12] lg:opacity-[0.14]" />

      <div className="absolute inset-0 opacity-[0.12] sm:opacity-[0.14] lg:opacity-[0.16]">
        <PortalBackgroundVariantA intensity={heroPortal.intensity} />
      </div>

      {/* Darker scrims — motion fills the canvas but stays subdued */}
      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_50%_-8%,rgba(99,102,241,0.03),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.28)_55%,rgba(7,7,12,0.62)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/55 via-[#07070c]/15 to-[var(--background)]/90" />
      </div>
    </div>
  );
}
