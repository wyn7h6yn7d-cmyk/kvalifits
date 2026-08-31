import { AmbientBackground } from "@/components/site/AmbientBackground";
import { HeroMotionAurora } from "@/components/site/portal-background/HeroMotionAurora";
import { PortalBackgroundSignalSweep } from "@/components/site/portal-background/PortalBackgroundSignalSweep";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

/**
 * Premium homepage motion — connection network + signal sweep + soft glow.
 * Kept behind readability scrims; respects prefers-reduced-motion in CSS.
 */
export function HomepageMotionBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <AmbientBackground intensity={heroPortal.ambientIntensity} />

      <HeroMotionAurora className="opacity-[0.82] sm:opacity-90 lg:opacity-95" />

      <div className="absolute inset-0 opacity-[0.78] sm:opacity-[0.84] lg:opacity-[0.92]">
        <PortalBackgroundVariantA intensity={heroPortal.intensity} />
      </div>

      <PortalBackgroundSignalSweep />

      {/* Readability scrims — lighter so motion stays visible */}
      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(99,102,241,0.12),transparent_58%)] lg:bg-[radial-gradient(ellipse_120%_75%_at_50%_-14%,rgba(99,102,241,0.15),transparent_55%)]" />
        <div className="absolute bottom-0 right-0 h-[45%] w-[55%] bg-[radial-gradient(ellipse_at_100%_100%,rgba(227,31,141,0.06),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.12)_62%,rgba(7,7,12,0.38)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/28 via-transparent to-[#0c0c13]/24" />
      </div>
    </div>
  );
}
