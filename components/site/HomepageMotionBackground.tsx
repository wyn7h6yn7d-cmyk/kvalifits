import { AmbientBackground } from "@/components/site/AmbientBackground";
import { HeroMotionAurora } from "@/components/site/portal-background/HeroMotionAurora";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

/**
 * Human Premium hero motion — quiet atmosphere behind copy + search.
 * No person photo in hero; motion stays soft and secondary to the content.
 */
export function HomepageMotionBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <AmbientBackground intensity={heroPortal.ambientIntensity} layout="hero" />

      <div className="absolute inset-0">
        <HeroMotionAurora className="opacity-[0.14] sm:opacity-[0.16] lg:opacity-[0.18]" bias="empty" />
        <div className="absolute inset-0 opacity-[0.16] sm:opacity-[0.18] lg:opacity-[0.20]">
          <PortalBackgroundVariantA intensity={heroPortal.intensity} />
        </div>
      </div>

      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_18%_-6%,rgba(99,102,241,0.05),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.16)_62%,rgba(7,7,12,0.5)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/45 via-transparent to-[var(--background)]/88" />
      </div>
    </div>
  );
}
