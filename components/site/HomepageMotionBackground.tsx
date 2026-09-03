import { AmbientBackground } from "@/components/site/AmbientBackground";
import { HeroMotionAurora } from "@/components/site/portal-background/HeroMotionAurora";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

/**
 * Human Premium hero motion — alive but secondary to the person + search.
 * Masked away from the face; prefers-reduced-motion handled in CSS.
 */
export function HomepageMotionBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <AmbientBackground intensity={heroPortal.ambientIntensity} layout="hero" />

      <div className="homepage-hero-tech-mask absolute inset-0">
        <HeroMotionAurora className="opacity-[0.14] sm:opacity-[0.16] lg:opacity-[0.18]" bias="empty" />
        <div className="absolute inset-0 opacity-[0.16] sm:opacity-[0.18] lg:opacity-[0.20]">
          <PortalBackgroundVariantA intensity={heroPortal.intensity} />
        </div>
      </div>

      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_72%_62%_at_80%_40%,rgba(7,7,12,0.5)_0%,transparent_64%)] max-lg:bg-[radial-gradient(ellipse_90%_48%_at_50%_82%,rgba(7,7,12,0.42)_0%,transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_18%_-8%,rgba(99,102,241,0.04),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.2)_60%,rgba(7,7,12,0.52)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/45 via-transparent to-[var(--background)]/88" />
      </div>
    </div>
  );
}
