import { AmbientBackground } from "@/components/site/AmbientBackground";
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

      <div className="absolute inset-0 opacity-[0.55] sm:opacity-[0.62] lg:opacity-[0.72]">
        <PortalBackgroundVariantA intensity={heroPortal.intensity} />
      </div>

      <PortalBackgroundSignalSweep className="hidden sm:block" />

      {/* Depth scrims — lighter than before so motion reads through */}
      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(99,102,241,0.16),transparent_58%)] lg:bg-[radial-gradient(ellipse_120%_75%_at_50%_-14%,rgba(99,102,241,0.2),transparent_55%)]" />
        <div className="absolute bottom-0 right-0 h-[45%] w-[55%] bg-[radial-gradient(ellipse_at_100%_100%,rgba(227,31,141,0.07),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.28)_68%,rgba(7,7,12,0.62)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/45 via-transparent to-[#0c0c13]/35" />
      </div>
    </div>
  );
}
