import { AmbientBackground } from "@/components/site/AmbientBackground";
import { HeroMotionAurora } from "@/components/site/portal-background/HeroMotionAurora";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

/**
 * Human Premium hero motion — animated atmosphere behind copy + search.
 * No person photo in hero; motion can fill the canvas while staying secondary to content.
 */
export function HomepageMotionBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <AmbientBackground intensity={heroPortal.ambientIntensity} />

      <HeroMotionAurora className="opacity-[0.22] sm:opacity-[0.26] lg:opacity-[0.30]" />

      <div className="absolute inset-0 opacity-[0.28] sm:opacity-[0.32] lg:opacity-[0.36]">
        <PortalBackgroundVariantA intensity={heroPortal.intensity} />
      </div>

      {/* Readability scrims — keep copy readable over motion */}
      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_50%_-8%,rgba(99,102,241,0.05),transparent_58%)]" />
        <div className="absolute bottom-0 right-0 h-[40%] w-[50%] bg-[radial-gradient(ellipse_at_100%_100%,rgba(227,31,141,0.03),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.18)_58%,rgba(7,7,12,0.52)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/40 via-transparent to-[var(--background)]/85" />
      </div>
    </div>
  );
}
